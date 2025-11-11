# Stateful Performance Optimization

**Goal:** Fast stateful conversations (thread history + context) without sacrificing functionality

**Current Bottlenecks:**
1. Thread lookup: 228ms (cached after first request → 0ms)
2. Message loading: 1.4s (loading thread + messages from DB)
3. LLM generation: 4.5s (external API)

**Target:** Reduce message loading from 1.4s to <200ms while maintaining full state

---

## Strategy: Smart Caching + Optimized Loading

### 1. Message Caching Layer

**Cache recent messages in user metadata** (fast access, no DB query):

```typescript
// After each conversation turn, cache recent messages
const cachedMessages = {
  threadId: newThreadId,
  messages: [
    { role: 'user', content: input.text },
    { role: 'assistant', content: responseText },
  ],
  timestamp: Date.now(),
  messageCount: 2,
};

// Store in user.metadata.convex.recentMessages
await ctx.runMutation(internal.internal.updateUserMetadata, {
  userId: user._id,
  metadata: {
    ...metadata,
    convex: {
      ...metadata.convex,
      recentMessages: cachedMessages,
    },
  },
});
```

**On next request, use cached messages if available:**

```typescript
// Check cache first
const cached = metadata.convex?.recentMessages;
if (cached && cached.threadId === threadId && Date.now() - cached.timestamp < 60000) {
  // Use cached messages (0ms)
  return await thread.generateText({
    prompt: input.text,
    messages: cached.messages, // From cache, not DB
  });
}
```

**Savings:** ~1.4s (no DB query for messages)

---

### 2. Incremental Message Loading

**Only load new messages since last request:**

```typescript
// Store last message order in cache
const lastOrder = cached?.lastMessageOrder ?? 0;

// Only load messages after lastOrder
const newMessages = await ctx.runQuery(
  components.agent.messages.listMessages,
  {
    threadId,
    paginationOpts: { cursor: null, numItems: 10 },
    order: 'asc',
    afterOrder: lastOrder, // Only new messages
  }
);

// Merge with cached messages
const allMessages = [...cached.messages, ...newMessages].slice(-10);
```

**Savings:** ~500ms (fewer messages to load)

---

### 3. Parallel Loading

**Load thread and messages in parallel:**

```typescript
// Instead of sequential:
const thread = await agent.continueThread(ctx, { threadId }); // 1.4s
const messages = await thread.listMessages(...); // Already loaded

// Use continueThread which loads messages internally
// But we can optimize by loading thread metadata separately
const [threadMeta, messages] = await Promise.all([
  ctx.runQuery(components.agent.threads.getThread, { threadId }), // Fast
  ctx.runQuery(components.agent.messages.listMessages, { threadId }), // Fast
]);

// Then continue thread (will use cached messages)
const thread = await agent.continueThread(ctx, { threadId });
```

**Savings:** ~200ms (parallel vs sequential)

---

### 4. Smart Context Options

**Only load what's needed:**

```typescript
// Current: Loads everything
contextOptions: {
  recentMessages: 10, // Loads 10 messages from DB
  searchOtherThreads: true, // Searches all threads
  searchOptions: {
    textSearch: true,
    vectorSearch: true,
    limit: 10,
  },
}

// Optimized: Load only what's needed
const contextOptions = isFirstTurn
  ? {
      recentMessages: 1, // Just current message
      searchOtherThreads: false, // No cross-thread search
      searchOptions: { limit: 0 }, // No search
    }
  : {
      recentMessages: 3, // Only last 3 messages (not 10)
      searchOtherThreads: false, // Disable if not needed
      searchOptions: {
        textSearch: true, // Only text search (faster than vector)
        vectorSearch: false, // Disable vector search (slow)
        limit: 5, // Reduce limit
      },
    };
```

**Savings:** ~300ms (fewer messages + no vector search)

---

### 5. Preload Context (Background)

**Preload context in background after response:**

```typescript
// After sending response, preload next context in background
const preloadPromise = ctx.runQuery(components.agent.messages.listMessages, {
  threadId: newThreadId,
  paginationOpts: { numItems: 5 },
});

// Store in cache for next request
preloadPromise.then((messages) => {
  // Cache messages for next request
  cacheMessages(userId, threadId, messages);
});
```

**Savings:** ~1.4s (context ready before next request)

---

## Implementation Plan

### Phase 1: Message Caching (High Impact, Medium Effort)

```typescript
// lib/utils.ts
export async function getCachedMessages(
  ctx: ActionCtx,
  userId: string,
  threadId: string,
  metadata?: Record<string, unknown>
): Promise<Array<{ role: string; content: string }> | null> {
  const cached = metadata?.convex?.recentMessages as {
    threadId: string;
    messages: Array<{ role: string; content: string }>;
    timestamp: number;
  } | undefined;

  if (cached && cached.threadId === threadId && Date.now() - cached.timestamp < 60000) {
    return cached.messages; // Cache hit (0ms)
  }

  return null; // Cache miss, load from DB
}

export async function cacheMessages(
  ctx: ActionCtx,
  userId: string,
  threadId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  // Store in user metadata (non-blocking)
  const user = await getByExternalId(ctx, userId);
  if (!user) return;

  await ctx.runMutation(internal.internal.updateUserMetadata, {
    userId: user._id,
    metadata: {
      ...user.metadata,
      convex: {
        ...(user.metadata?.convex as Record<string, unknown>),
        recentMessages: {
          threadId,
          messages: messages.slice(-10), // Keep last 10
          timestamp: Date.now(),
        },
      },
    },
  });
}
```

### Phase 2: Optimized Context Loading

```typescript
// agents.ts
export const runMainAgent = action({
  handler: async (ctx, { input, context, threadId }) => {
    const metadata = context.metadata ?? {};
    
    // Try cache first
    const cachedMessages = await getCachedMessages(
      ctx,
      context.userId,
      threadId ?? '',
      metadata
    );

    const thread = await ensureAgentThread(...);

    if (cachedMessages) {
      // Use cached messages (fast path)
      const result = await thread.generateText({
        prompt: input.text,
        messages: cachedMessages, // From cache, not DB
        system: systemPrompt,
      });
      
      // Update cache with new messages
      await cacheMessages(ctx, context.userId, threadId, [
        ...cachedMessages,
        { role: 'user', content: input.text },
        { role: 'assistant', content: result.text },
      ]);
      
      return result;
    }

    // Fallback: Load from DB (slow path)
    const result = await thread.generateText({
      prompt: input.text,
      contextOptions: {
        recentMessages: 3, // Reduced from 10
        searchOtherThreads: false, // Disable if not needed
        searchOptions: {
          textSearch: true,
          vectorSearch: false, // Disable vector search
          limit: 5,
        },
      },
    });

    // Cache for next request
    await cacheMessages(ctx, context.userId, threadId, [
      { role: 'user', content: input.text },
      { role: 'assistant', content: result.text },
    ]);

    return result;
  },
});
```

### Phase 3: Background Preloading

```typescript
// After response sent, preload next context
const preloadPromise = ctx.runQuery(components.agent.messages.listMessages, {
  threadId: newThreadId,
  paginationOpts: { numItems: 5 },
});

preloadPromise.then((messages) => {
  // Cache for next request (non-blocking)
  cacheMessages(ctx, context.userId, newThreadId, messages);
});
```

---

## Expected Performance

| Optimization | Current | After | Savings |
|--------------|---------|-------|---------|
| **Message Loading (1st)** | 1.4s | 1.4s | None (expected) |
| **Message Loading (2nd+)** | 1.4s | **0ms** (cached) | **-1.4s** ✅ |
| **Context Options** | Full load | Optimized | **-300ms** ✅ |
| **Total Latency (1st)** | 9.5s | 9.5s | None (expected) |
| **Total Latency (2nd+)** | 9.5s | **~4.8s** | **-4.7s** ✅ |

**Breakdown:**
- Thread lookup: 0ms (cached)
- Message loading: 0ms (cached)
- Context options: 0ms (optimized)
- LLM generation: 4.5s (external API)
- Overhead: ~300ms

---

## Trade-offs

### Pros
- ✅ Fast stateful conversations (~4.8s vs 9.5s)
- ✅ Full conversation history maintained
- ✅ Context-aware responses
- ✅ No functionality loss

### Cons
- ⚠️ Cache invalidation complexity
- ⚠️ Memory usage (cached messages)
- ⚠️ Cache staleness risk (60s TTL)

---

## Implementation Priority

1. **Phase 1: Message Caching** (High impact, medium effort)
   - Expected: 9.5s → 4.8s (50% faster)
   - Effort: 2-3 hours

2. **Phase 2: Optimized Context** (Medium impact, low effort)
   - Expected: Additional 300ms savings
   - Effort: 1 hour

3. **Phase 3: Background Preloading** (Low impact, high effort)
   - Expected: Additional 200ms savings
   - Effort: 3-4 hours

**Recommendation:** Start with Phase 1 (message caching) for biggest impact.

