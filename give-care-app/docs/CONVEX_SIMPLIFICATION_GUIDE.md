# Convex Simplification Guide - Quick Reference

**Quick reference for migrating from custom implementations to Agent Component's built-in features.**

---

## 1. Message Storage

### ❌ Remove This:
```typescript
// In inbound.ts or similar
await ctx.runMutation(api.internal.recordOutbound, {
  message: {
    externalId: args.userId,
    channel: 'sms',
    text: args.text,
    traceId: args.traceId,
  },
});
```

### ✅ Use This Instead:
```typescript
// Agent Component automatically saves messages when you call:
const result = await thread.generateText({ prompt: input.text });

// To query messages later:
import { agent } from './agents/main';
const messages = await agent.listMessages(ctx, {
  threadId,
  paginationOpts: { numItems: 20 },
});
```

**Action**: Remove all `recordInbound`/`recordOutbound` calls. Agent Component handles this automatically.

---

## 2. Memory System

### ❌ Remove This:
```typescript
// Custom memory retrieval
const memories = await ctx.runQuery(internal.public.retrieveMemories, {
  userId,
  query: userQuery,
  limit: 5,
});

// Async injection
ctx.scheduler.runAfter(0, internal.agents.main.enrichThreadContext, {
  threadId,
  userId,
  userQuery: input.text,
});
```

### ✅ Use This Instead:
```typescript
// Built-in memory search via contextOptions
const result = await thread.generateText({
  prompt: input.text,
  contextOptions: {
    searchOtherThreads: true,  // ✅ Searches all user's threads
    recentMessages: 10,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      messageRange: { before: 1, after: 1 },
      limit: 10,
    },
  },
});
```

**Action**: Remove `enrichThreadContext` function. Use `contextOptions` in `generateText()` calls.

---

## 3. Thread Management

### ❌ Remove This:
```typescript
// Custom threads table (already marked DEPRECATED)
threads: defineTable({
  userId: v.id('users'),
  metadata: v.optional(v.any()),
}).index('by_userId', ['userId']),
```

### ✅ Agent Component Handles This:
```typescript
// Agent Component manages threads automatically
const { threadId, thread } = await agent.createThread(ctx, {
  userId: user._id,
  metadata: { /* GiveCare-specific metadata */ },
});

// Or continue existing thread:
const { thread } = await agent.continueThread(ctx, { threadId });
```

**Action**: Delete `threads` table from schema. Use `components.agent.threads` via Agent Component.

---

## 4. Context Hydration

### ❌ Simplify This:
```typescript
// Complex hydration with sessions, promptHistory, budget
export const hydrate = async (ctx: MutationCtx, params: HydrateParams) => {
  const user = await ensureUser(ctx, params);
  const session = await ensureSession(ctx, {...});
  const promptHistory = session.promptHistory.length
    ? session.promptHistory
    : await fetchRecentPromptHistory(ctx, user._id);
  // ... complex context building
};
```

### ✅ Use This Instead:
```typescript
// Simplified: Only GiveCare-specific state
export const hydrate = async (ctx: MutationCtx, params: HydrateParams) => {
  const user = await ensureUser(ctx, params);
  
  // Get or create thread (Agent Component manages its context)
  const existingThread = await getLatestThread(ctx, user._id);
  const threadId = existingThread 
    ? existingThread._id 
    : await agent.createThread(ctx, { userId: user._id }).then(r => r.threadId);
  
  return {
    userId: user._id,
    threadId,
    // Only GiveCare-specific:
    locale: user.locale,
    consent: user.consent,
    metadata: user.metadata, // Profile, wellness, etc.
  };
};
```

**Action**: Simplify `hydrate()` to only handle GiveCare-specific state. Let Agent Component manage thread context.

---

## 5. Sessions Table

### ❌ Remove These Fields:
```typescript
sessions: defineTable({
  promptHistory: v.array(...),  // ❌ Agent Component has this
  budget: budgetValidator,      // ❌ Can be in metadata
  policyBundle: v.string(),    // ❌ Can be in metadata
  // ... other Agent Component-managed fields
})
```

### ✅ Keep Only GiveCare-Specific:
```typescript
sessions: defineTable({
  userId: v.id('users'),
  channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  locale: v.string(),
  // Only GiveCare-specific:
  subscriptionStatus: v.optional(v.string()),
  preferences: v.optional(v.any()),
  wellnessScore: v.optional(v.number()),
  lastSeen: v.number(),
})
```

**Action**: Remove Agent Component-managed fields from `sessions`. Store thread-related state in thread metadata.

---

## 6. Agent Configuration

### ❌ Current (Custom Context Handler):
```typescript
export const mainAgent = new Agent(components.agent, {
  // ...
  contextHandler: async (ctx, args) => {
    // Custom handler that doesn't leverage built-in search
    return [
      ...args.search || [],
      ...args.recent || [],
      ...args.inputMessages,
    ];
  },
});
```

### ✅ Simplified (Use Built-in):
```typescript
export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai('gpt-5-nano'),
  instructions: MAIN_PROMPT,
  tools: { searchResources, recordMemory, ... },
  maxSteps: 5,
  // Remove custom contextHandler - use contextOptions in generateText() instead
});
```

**Action**: Remove `contextHandler`. Use `contextOptions` parameter in `generateText()` calls.

---

## 7. Querying Messages

### ❌ Don't Query Custom Messages Table:
```typescript
const messages = await ctx.db
  .query('messages')
  .withIndex('by_user_direction', (q) => 
    q.eq('userId', userId).eq('direction', 'outbound')
  )
  .order('desc')
  .take(10);
```

### ✅ Query via Agent Component:
```typescript
import { paginationOptsValidator } from 'convex/server';

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const messages = await mainAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    return messages;
  },
});
```

**Action**: Replace all queries to custom `messages` table with `agent.listMessages()`.

---

## 8. Structured Memories (Optional)

If you need structured memory queries (e.g., "all crisis triggers"), keep a lightweight table:

### ✅ Lightweight Memories Table:
```typescript
memories: defineTable({
  userId: v.id('users'),
  category: v.string(),  // 'crisis_trigger', 'care_routine', etc.
  content: v.string(),
  importance: v.number(),
  // No embedding - Agent Component handles semantic search
}).index('by_user_category', ['userId', 'category']),
```

**Use for**: Category-based queries only  
**Don't use for**: Semantic search (use Agent Component's `contextOptions`)

---

## Migration Checklist

### Phase 1: Remove Redundant Storage
- [ ] Delete `threads` table from schema
- [ ] Remove `recordInbound`/`recordOutbound` mutation calls
- [ ] Update queries to use `agent.listMessages()`

### Phase 2: Leverage Built-in Memory
- [ ] Remove `enrichThreadContext` function
- [ ] Add `contextOptions` to all `generateText()` calls
- [ ] Remove custom `retrieveMemories` query (or keep for structured queries only)

### Phase 3: Simplify Context
- [ ] Simplify `sessions` table (remove Agent Component-managed fields)
- [ ] Simplify `hydrate()` function
- [ ] Store thread state in thread metadata, not sessions

### Phase 4: Cleanup
- [ ] Remove `contextHandler` from agent definitions
- [ ] Update all message queries to use Agent Component
- [ ] Test thoroughly with simulation tests
- [ ] Update ARCHITECTURE.md

---

## Testing After Migration

```typescript
// Test that messages are stored automatically
const result = await thread.generateText({ prompt: "Hello" });
const messages = await agent.listMessages(ctx, { threadId: result.threadId });
assert(messages.length > 0, "Message should be stored automatically");

// Test that memory search works
const result2 = await thread.generateText({
  prompt: "What did I say about my mom?",
  contextOptions: {
    searchOtherThreads: true,
    searchOptions: { textSearch: true, vectorSearch: true, limit: 5 },
  },
});
assert(result2.text.includes("mom"), "Should find previous mentions");
```

---

## Key Takeaways

1. **Agent Component stores messages automatically** - Don't duplicate
2. **Use `contextOptions` for memory search** - Don't build custom system
3. **Thread metadata for thread state** - Don't use sessions table
4. **Keep only GiveCare-specific state** - Let Agent Component handle the rest

---

**Last Updated**: 2025-01-14

