# Migration Open Questions & Considerations

**Outstanding questions and considerations for the convex2 → convex migration.**

---

## Critical Questions

### 1. Data Migration Strategy

**Question**: How do we migrate existing data from `convex2` tables to the new simplified schema?

**Considerations**:
- **Messages**: `convex2` has custom `messages` table. Agent Component will create new threads/messages. Do we:
  - Migrate old messages to Agent Component threads? (Complex - need to create threads, map messages)
  - Keep old messages read-only for historical reference?
  - Archive old messages and start fresh?

- **Threads**: `convex2` has custom `threads` table. Agent Component manages threads internally. Do we:
  - Create Agent Component threads from existing threads?
  - Map old thread IDs to new thread IDs?
  - Start fresh with new threads?

- **Sessions**: `convex2` has `sessions` table with promptHistory, budget, etc. Do we:
  - Migrate session data to thread metadata?
  - Keep sessions table for GiveCare-specific state only?
  - How to map session → thread?

**Decision**: ✅ **Clean Slate Approach**
- Can safely ignore anything in convex prod, can be replaced
- Start fresh with Agent Component threads
- No migration script needed
- Old data in convex2 remains as-is (read-only reference if needed)

**Action Needed**: ✅ None - Clean slate approach confirmed.

---

### 2. Dual-Write Period Implementation

**Question**: How exactly do we implement the dual-write period mentioned in the rollback plan?

**Considerations**:
- Write to both `convex2` and `convex` simultaneously?
- How long to run dual-write? (Suggested: 1-2 weeks)
- How to compare outputs?
- What if outputs differ?

**Decision**: ✅ **Not Needed**
- Clean slate approach means no dual-write required
- Only updating `convex`, leaving `convex2` as-is
- No comparison needed - fresh start

**Action Needed**: ✅ None - Dual-write not required.

---

### 3. Environment Variables

**Question**: What environment variables are needed for the migration?

**Decision**: ✅ **Reference convex2**
- All envs are in convex2 for reference, deployed in prod
- Copy env vars from convex2 to convex during migration
- No need to audit - use existing convex2 env vars as reference

**Action Needed**: ✅ Copy env vars from convex2 to convex during setup.

---

### 4. Component Versions & Compatibility

**Question**: What versions of Convex components should we use?

**Considerations**:
- Latest stable versions?
- Specific versions for compatibility?
- How to handle component updates during migration?

**Decision**: ✅ **Latest Stable Versions**
- Use latest stable versions from npm
- No version pinning needed - use latest stable
- Check npm for current stable versions at migration time

**Action Needed**: ✅ Use `npm install @convex-dev/agent@latest` etc. (latest stable).

---

### 5. Memory Migration

**Question**: How do we migrate existing memories from `convex2` custom table to Agent Component's system?

**Considerations**:
- `convex2` has `memories` table with embeddings
- Agent Component uses thread messages for memory (via `contextOptions`)
- Do we:
  - Keep lightweight `memories` table for category queries?
  - Migrate important memories to thread messages?
  - Start fresh and let Agent Component build memory over time?

**Decision**: ✅ **Ignore convex2 memories**
- Focus on feature/goals, implement per best practices
- Use Agent Component's built-in memory via `contextOptions.searchOtherThreads`
- No migration needed - Agent Component will build memory from new conversations
- If structured memory queries needed, implement lightweight `memories` table for category queries only

**Action Needed**: ✅ None - Ignore old memories, use Agent Component's built-in system.

---

### 6. Thread Continuity

**Question**: How do we ensure users don't lose conversation history?

**Considerations**:
- Old conversations in `convex2` messages table
- New conversations in Agent Component threads
- Users expect continuity

**Decision**: ✅ **Use Agent Component's Built-in Thread Continuity**
- See [Stack article on AI Agents](https://stack.convex.dev/ai-agents) for `continueThread` pattern
- Agent Component automatically handles thread continuity via `continueThread()`
- Messages are automatically stored and retrieved per thread
- Use `contextOptions.searchOtherThreads: true` for cross-thread memory

**Pattern from Stack**:
```typescript
// Continue existing thread - automatically includes message history
const { thread } = await agent.continueThread(ctx, { threadId });
const result = await thread.generateText({ prompt });

// Or create new thread
const { threadId, thread } = await agent.createThread(ctx, { userId });
```

**Action Needed**: ✅ Implement using Agent Component's `continueThread` pattern.

---

### 7. Testing Strategy Details

**Question**: How do we test the migration without breaking production?

**Considerations**:
- Can we run both systems in parallel?
- How to test with real users?
- What's the rollback procedure if tests fail?

**Recommendation**:
1. **Staging environment**: Full migration in staging first
2. **Feature flags**: Gradual rollout (10% → 50% → 100%)
3. **Shadow mode**: Run new system alongside old, compare outputs
4. **Canary deployment**: Route small % of traffic to new system

**Action Needed**: Set up staging environment and feature flags.

---

### 8. Monitoring & Metrics

**Question**: What metrics should we track during migration?

**Suggested Metrics**:
- Response latency (p50, p95, p99)
- Error rates (by endpoint)
- Message delivery success rate
- Agent response quality (user satisfaction?)
- Database write volume (should decrease)
- Cost per user (should decrease)

**Action Needed**: Set up monitoring dashboard before migration starts.

---

### 9. Error Handling & Rollback

**Question**: What are the specific error scenarios and rollback procedures?

**Error Scenarios**:
- Agent Component fails to create thread
- Twilio component fails to send message
- Workflow fails to execute
- Data migration fails mid-process

**Rollback Procedures**:
- Feature flag: Switch back to `convex2` immediately
- Database: Restore from backup if needed
- Code: Revert deployment

**Action Needed**: Document specific error scenarios and rollback steps.

---

### 10. User Impact & Communication

**Question**: Will users experience any downtime or changes?

**Considerations**:
- Zero-downtime migration possible?
- Do users need to know about migration?
- What if they notice differences?

**Recommendation**:
- Aim for zero-downtime migration
- No user communication needed if seamless
- Monitor user feedback for issues

**Action Needed**: Plan for zero-downtime migration.

---

### 11. Performance Benchmarks

**Question**: How do we measure the performance improvements?

**Baseline Metrics** (from `convex2`):
- Context hydration time: ~X ms
- Message storage time: ~Y ms
- Memory retrieval time: ~Z ms
- Database writes per message: 2 (custom + Agent Component)

**Target Metrics** (after migration):
- Context hydration time: 30% faster
- Message storage time: 50% faster (single write)
- Memory retrieval time: Use Agent Component's optimized search
- Database writes per message: 1 (Agent Component only)

**Action Needed**: Measure baseline metrics before migration starts.

---

### 12. Documentation Updates

**Question**: What documentation needs updating?

**Documents to Update**:
- `ARCHITECTURE.md` - New architecture
- `CLAUDE.md` - Updated patterns
- `CHANGELOG.md` - Migration notes
- API documentation (if public)
- Internal runbooks

**Action Needed**: Create documentation update checklist.

---

## Decision Log

| Question | Decision | Date | Owner |
|----------|----------|------|-------|
| Data migration strategy | **Clean slate** - Can safely ignore anything in convex prod, can be replaced | 2025-01-14 | - |
| Dual-write period length | **Not needed** - Clean slate approach, no dual-write required | 2025-01-14 | - |
| Memory migration approach | **Ignore convex2 memories** - Focus on feature/goals, implement per best practices using Agent Component | 2025-01-14 | - |
| Thread continuity approach | **Use Agent Component's built-in** - See [Stack article](https://stack.convex.dev/ai-agents) for `continueThread` pattern | 2025-01-14 | - |
| Component versions | **Latest stable versions** - Use latest stable from npm | 2025-01-14 | - |
| Migration target | **Only update convex** - Leave convex2 as-is, migrate features to convex | 2025-01-14 | - |
| Environment variables | **Reference convex2** - All envs are in convex2 for reference, deployed in prod | 2025-01-14 | - |

---

## Next Steps

1. **Review these questions** with team
2. **Make decisions** on each question
3. **Update MIGRATION_PLAN.md** with decisions
4. **Create implementation tasks** for each decision
5. **Set up monitoring** before migration starts

---

**Last Updated**: 2025-01-14

