# Migration Decisions - Finalized

**Decisions made for convex2 → convex migration (2025-01-14)**

---

## Summary

All open questions have been resolved. Migration will proceed with a **clean slate approach** using **latest stable Convex components** and **Agent Component's built-in patterns**.

---

## Key Decisions

### 1. ✅ Data Migration Strategy
**Decision**: Clean slate - Can safely ignore anything in convex prod, can be replaced

- Start fresh with Agent Component threads
- No migration script needed
- Old data in convex2 remains as-is (read-only reference if needed)
- Users get new threads automatically

**Impact**: Faster migration, simpler implementation, no data migration complexity

---

### 2. ✅ Migration Target
**Decision**: Only update convex, not convex2

- Migrate all features from convex2 → convex
- Leave convex2 as-is (reference/backup)
- convex becomes the new production system
- No dual-write needed

**Impact**: Clean separation, no interference between old and new systems

---

### 3. ✅ Environment Variables
**Decision**: Reference convex2 - All envs are in convex2 for reference, deployed in prod

- Copy env vars from convex2 to convex during migration
- No need to audit - use existing convex2 env vars as reference
- Includes: Twilio, Stripe, OpenAI, and any other API keys

**Action**: Copy env vars during Phase 1 setup

---

### 4. ✅ Component Versions
**Decision**: Latest stable versions

- Use latest stable versions from npm
- No version pinning needed
- Check npm for current stable versions at migration time

**Installation**:
```bash
npm install @convex-dev/agent@latest
npm install @convex-dev/workflow@latest
npm install @convex-dev/rate-limiter@latest
npm install @convex-dev/twilio@latest
```

---

### 5. ✅ Memory Migration
**Decision**: Ignore convex2 memories, focus on feature/goals, implement per best practices

- Use Agent Component's built-in memory via `contextOptions.searchOtherThreads`
- No migration needed - Agent Component will build memory from new conversations
- If structured memory queries needed, implement lightweight `memories` table for category queries only
- Focus on implementing memory features per FEATURES.md, not migrating old data

**Implementation**:
```typescript
// Use Agent Component's built-in memory
const result = await thread.generateText({
  prompt: input.text,
  contextOptions: {
    searchOtherThreads: true,  // ✅ Cross-thread memory
    recentMessages: 10,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      limit: 10,
    },
  },
});
```

---

### 6. ✅ Thread Continuity
**Decision**: Use Agent Component's built-in thread continuity

**Reference**: [Stack article on AI Agents](https://stack.convex.dev/ai-agents)

**Pattern**:
```typescript
// Continue existing thread - automatically includes message history
const { thread } = await agent.continueThread(ctx, { threadId });
const result = await thread.generateText({ prompt });

// Or create new thread
const { threadId, thread } = await agent.createThread(ctx, { userId });
```

**Key Points**:
- Agent Component automatically stores messages in user-specific threads
- `continueThread()` automatically includes previous message history
- Messages are queryable via `agent.listMessages()`
- Use `contextOptions.searchOtherThreads: true` for cross-thread memory

**Implementation**:
- Use `createThread()` for new conversations
- Use `continueThread()` for existing conversations
- Agent Component handles all message storage and retrieval automatically

---

## Migration Approach Summary

1. **Clean Slate**: Start fresh in `convex`, ignore old data
2. **Latest Components**: Use latest stable Convex components
3. **Agent Component Patterns**: Follow [Stack article patterns](https://stack.convex.dev/ai-agents)
4. **Feature-Focused**: Implement features per FEATURES.md, not migrate old data
5. **Reference convex2**: Use convex2 for env vars and feature reference only

---

## Updated Migration Checklist

### Week 1: Foundation
- [x] ✅ Decision: Clean slate approach
- [x] ✅ Decision: Latest stable components
- [x] ✅ Decision: Reference convex2 for env vars
- [ ] Create simplified schema (remove redundant tables)
- [ ] Set up Agent Component in `convex.config.ts`
- [ ] Copy env vars from convex2
- [ ] Migrate core utilities (simplified)
- [ ] Migrate Main Agent (use `contextOptions` + `continueThread`)
- [ ] Migrate Crisis Agent

### Week 2: Agents & Tools
- [ ] Migrate Assessment Agent
- [ ] Migrate all 6 tools
- [ ] Set up Workflow Component
- [ ] Migrate crisis escalation workflow

### Week 3: Integrations
- [ ] Install `@convex-dev/twilio` component (latest stable)
- [ ] Set up Twilio component (client + webhook registration)
- [ ] Migrate SMS sending to use component
- [ ] Migrate inbound message handling via callback
- [ ] Migrate Stripe webhook handler
- [ ] Migrate assessment system
- [ ] Migrate resource search

### Week 4: Polish
- [ ] Migrate prompts & policies
- [ ] Set up rate limiting (using component)
- [ ] Set up usage tracking (Agent Component built-in)
- [ ] Write tests
- [ ] Update documentation

---

## Key Implementation Patterns

### Thread Management (from Stack article)
```typescript
// Create new thread
const { threadId, thread } = await agent.createThread(ctx, {
  userId: user._id,
  metadata: { /* GiveCare-specific metadata */ },
});

// Continue existing thread (automatic message history)
const { thread } = await agent.continueThread(ctx, { threadId });

// Generate with memory search
const result = await thread.generateText({
  prompt: input.text,
  contextOptions: {
    searchOtherThreads: true,  // Cross-thread memory
    recentMessages: 10,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      limit: 10,
    },
  },
});
```

### Querying Messages (from Stack article)
```typescript
// List messages in thread
const messages = await agent.listMessages(ctx, {
  threadId,
  paginationOpts: { numItems: 20 },
});

// Fetch context messages manually
const contextMessages = await agent.fetchContextMessages(ctx, {
  userId,
  threadId,
  messages: [{ role: "user", content: text }],
  contextOptions: {
    searchOtherThreads: true,
    recentMessages: 10,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      limit: 10,
    },
  },
});
```

---

## References

- [Stack: AI Agents with Built-in Memory](https://stack.convex.dev/ai-agents)
- [Convex Components](https://www.convex.dev/components)
- [FEATURES.md](../FEATURES.md) - Feature requirements

---

**Last Updated**: 2025-01-14  
**Status**: ✅ All decisions finalized, ready to proceed

