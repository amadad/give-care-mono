# Convex Agent Component Audit

**Date**: 2025-01-10  
**Status**: ⚠️ **Several Anti-Patterns Identified**

## Executive Summary

We're using the Agent Component correctly for **basic patterns** (Agent definition, thread management, `generateText`), but we're **missing several best practices** recommended by the docs:

1. ❌ **NOT saving user messages first** (synchronous pattern instead of async)
2. ❌ **NOT using `promptMessageId`** for better retry/idempotency
3. ❌ **NOT using `contextOptions`** for built-in RAG/semantic search
4. ⚠️ **Manual threadId management** (storing in user metadata)
5. ⚠️ **Not using `asTextAction()` utility** for async generation

---

## ✅ What We're Doing Right

### 1. Agent Definition
```typescript
export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: google('gemini-2.5-flash'),
  textEmbeddingModel: openai.embedding('text-embedding-3-small'),
  instructions: MAIN_PROMPT,
  tools: { ... },
  maxSteps: 5,
});
```
✅ **Correct**: Using `new Agent(components.agent, {...})` pattern

### 2. Thread Management
```typescript
if (threadId) {
  const threadResult = await mainAgent.continueThread(ctx, {
    threadId,
    userId: context.userId,
  });
  thread = threadResult.thread;
} else {
  const threadResult = await mainAgent.createThread(ctx, {
    userId: context.userId,
  });
  thread = threadResult.thread;
}
```
✅ **Correct**: Using `createThread` and `continueThread` properly

### 3. generateText Usage
```typescript
const result = await thread.generateText({
  prompt: input.text,
  system: systemPrompt,
  providerOptions: { google: { ... } },
});
```
✅ **Correct**: Using `thread.generateText()` with proper arguments

### 4. Tools Definition
```typescript
export const recordMemory = createTool({
  args: z.object({ ... }),
  description: '...',
  handler: async (ctx, args) => { ... },
});
```
✅ **Correct**: Using `createTool` from `@convex-dev/agent`

---

## ❌ What We're Missing (Best Practices)

### 1. **NOT Saving User Messages First** (Critical)

**Current Pattern** (Synchronous):
```typescript
// ❌ We generate response immediately without saving user message first
const result = await thread.generateText({
  prompt: input.text,  // User message not saved yet
  system: systemPrompt,
});
```

**Recommended Pattern** (Async with `promptMessageId`):
```typescript
// ✅ Step 1: Save user message first (transactional)
import { saveMessage } from "@convex-dev/agent";

const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  prompt: input.text,
});

// ✅ Step 2: Generate response asynchronously (can retry)
await agent.generateText(ctx, { threadId }, { 
  promptMessageId: messageId  // Reference saved message
});
```

**Benefits**:
- ✅ **Idempotent retries**: Client can retry mutations safely
- ✅ **Optimistic UI**: Message appears immediately, response streams in
- ✅ **Transactional**: Save message + other writes in same transaction
- ✅ **No duplicates**: If generation retries, user message isn't duplicated

**Docs Reference**: [Agent Usage - Saving the prompt then generating response(s) asynchronously](https://docs.convex.dev/agents/agent-usage#saving-the-prompt-then-generating-responses-asynchronously)

---

### 2. **NOT Using `contextOptions` for RAG** (Performance)

**Current Pattern** (Manual Context Building):
```typescript
// ❌ We manually build context from metadata
const enrichedContext = metadata.enrichedContext as string | undefined;
const contextSection = enrichedContext
  ? `\n\nContext from previous conversations:\n${enrichedContext}`
  : '';
const systemPrompt = `${basePrompt}\n\n${tone}${contextSection}`;
```

**Recommended Pattern** (Built-in RAG):
```typescript
// ✅ Use Agent Component's built-in semantic search
const result = await thread.generateText({
  prompt: input.text,
  system: systemPrompt,
  contextOptions: {
    // Automatically searches message history + memories via embeddings
    maxMessages: 10,
    maxTokens: 1000,
  },
});
```

**Benefits**:
- ✅ **Automatic semantic search**: Finds relevant past messages automatically
- ✅ **No manual context building**: Component handles it
- ✅ **Better relevance**: Uses embeddings, not just text matching
- ✅ **Performance**: Only includes relevant context, not everything

**Docs Reference**: [LLM Context](https://docs.convex.dev/agents/context)

**Note**: We have `textEmbeddingModel` configured, so this should work!

---

### 3. **Manual ThreadId Management** (Maintenance)

**Current Pattern**:
```typescript
// ❌ We store threadId in user metadata manually
const threadId = getOrCreateThread(user); // Reads from user.metadata.threadId

// After response:
if (response?.threadId) {
  await ctx.runMutation(internal.internal.updateUserMetadata, {
    userId: user._id,
    metadata: { threadId: response.threadId },
  });
}
```

**Recommended Pattern**:
```typescript
// ✅ Agent Component manages threads automatically
// Use listThreads() to find user's threads
import { listThreads } from "@convex-dev/agent";

const threads = await listThreads(ctx, components.agent, {
  userId: context.userId,
  paginationOpts: { cursor: null, numItems: 1 },
});

const threadId = threads.length > 0 ? threads[0].threadId : undefined;
```

**Benefits**:
- ✅ **Single source of truth**: Component manages thread ownership
- ✅ **No manual sync**: No need to update user metadata
- ✅ **Better queries**: Can filter by date, agent, etc.

**Docs Reference**: [Threads - Getting all threads owned by a user](https://docs.convex.dev/agents/threads#getting-all-threads-owned-by-a-user)

---

### 4. **Not Using `asTextAction()` Utility** (Code Simplification)

**Current Pattern**:
```typescript
// ❌ Manual async action pattern
export const generateResponseAsync = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});
```

**Recommended Pattern**:
```typescript
// ✅ Use built-in utility (handles streaming, errors, etc.)
export const generateResponseAsync = agent.asTextAction();
```

**Benefits**:
- ✅ **Less code**: Utility handles common patterns
- ✅ **Better defaults**: Streaming, error handling built-in
- ✅ **Consistent**: Same pattern across all agents

**Docs Reference**: [Agent Usage - Saving the prompt then generating response(s) asynchronously](https://docs.convex.dev/agents/agent-usage#saving-the-prompt-then-generating-responses-asynchronously)

---

## ⚠️ SMS-Specific Considerations

**Question**: Should we use async pattern for SMS?

**Answer**: **Probably YES**, but with modifications:

1. **SMS requires immediate response** - Can't wait for async generation
2. **BUT**: We can still save message first, then generate synchronously
3. **OR**: Use async pattern but return immediately, send SMS when ready

**Hybrid Pattern** (Best for SMS):
```typescript
// Step 1: Save user message (transactional)
const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  prompt: input.text,
});

// Step 2: Generate response synchronously (for SMS)
const result = await thread.generateText(ctx, { threadId }, {
  promptMessageId: messageId,  // Reference saved message
});

// Step 3: Send SMS immediately
await sendSms(result.text);

// Step 4: Trigger async enrichment (non-blocking)
void workflow.start(ctx, internal.workflows.memory.enrichMemory, {
  userId,
  threadId,
  recentMessages: [
    { role: 'user', content: input.text },
    { role: 'assistant', content: result.text },
  ],
});
```

---

## 📊 Impact Assessment

| Issue | Severity | Impact | Effort to Fix |
|-------|----------|--------|---------------|
| Not saving messages first | 🔴 High | Retry failures, duplicate messages | Medium (2-3h) |
| Not using `contextOptions` | 🟡 Medium | Manual context building, less relevant context | Low (1h) |
| Manual threadId management | 🟢 Low | Maintenance burden | Low (1h) |
| Not using `asTextAction()` | 🟢 Low | Code duplication | Low (30min) |

---

## 🎯 Recommended Fixes (Priority Order)

### Priority 1: Save Messages First
- **Why**: Critical for idempotency and retries
- **Effort**: 2-3 hours
- **Files**: `convex/agents/main.ts`, `convex/agents/crisis.ts`, `convex/agents/assessment.ts`

### Priority 2: Use `contextOptions` for RAG
- **Why**: Better context relevance, less manual work
- **Effort**: 1 hour
- **Files**: `convex/agents/main.ts` (remove manual `enrichedContext` building)

### Priority 3: Use `listThreads()` Instead of Manual Storage
- **Why**: Single source of truth, better queries
- **Effort**: 1 hour
- **Files**: `convex/inbound.ts` (remove `getOrCreateThread`)

### Priority 4: Use `asTextAction()` Utility
- **Why**: Code simplification
- **Effort**: 30 minutes
- **Files**: All agent files (if we switch to async pattern)

---

## 📚 References

- [Getting Started with Agent](https://docs.convex.dev/agents/getting-started)
- [Agent Usage](https://docs.convex.dev/agents/agent-usage)
- [Threads](https://docs.convex.dev/agents/threads)
- [LLM Context](https://docs.convex.dev/agents/context)
- [Tools](https://docs.convex.dev/agents/tools)
- [Workflows](https://docs.convex.dev/agents/workflows)

---

## ✅ Next Steps

1. **Review this audit** with team
2. **Decide on async vs sync** pattern for SMS
3. **Implement Priority 1** (save messages first)
4. **Test thoroughly** before deploying
5. **Update ARCHITECTURE.md** with new patterns

