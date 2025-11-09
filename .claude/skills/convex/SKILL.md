---
name: convex
description: Work with Convex backend development including mutations, queries, actions, components, and CLI commands. Use when working with Convex projects, debugging Convex functions, running Convex CLI commands, or using the Agent Component.
allowed-tools: Read, Grep, Glob, Bash
---

# Convex Development Skill

This skill provides quick reference and best practices for Convex backend development.

## Quick Reference

### CLI Command Syntax (CRITICAL)

**Correct format:**
```bash
npx convex run directory/file:functionName
#                ↓        ↓      ↓
#              slash    slash  colon
```

**Common mistakes:**
```bash
# ❌ WRONG - using colons in path
npx convex run functions:admin:getAllUsers

# ✅ CORRECT - slashes for path, colon for function
npx convex run functions/admin:getAllUsers
```

### Essential Commands

```bash
# Development
npx convex dev                          # Start dev server, generate types
npx convex deploy                       # Deploy to production

# Running functions
npx convex run functions/admin:getAllUsers
npx convex run migrations/myMigration:runMigration
npx convex run internal/metrics:aggregateDailyMetrics

# Component management
npx convex run --component agent apiKeys:issue '{name:"key1"}'

# Type generation
npx convex codegen --typecheck enable --once
```

## Common Errors & Solutions

### "Could not find function for 'functions:admin'"

**Cause:** Using colon (`:`) instead of slash (`/`) in file path

**Solution:** Change `functions:admin:getAllUsers` to `functions/admin:getAllUsers`

### Thread ID validation error: `v.id("threads")`

**Cause:** Mixing app-level thread IDs with Agent Component thread IDs

**Example error:**
```
ArgumentValidationError: Value does not match validator.
Path: .threadId
Value: "t572x6qq20w9fderwrbse9d5e17v2616"
Validator: v.id("threads")
```

**Solution:**
- Agent Component has its own `threads` table (separate namespace)
- Use `createThread` from `@convex-dev/agent` for component threads
- Store component threadId in user metadata for future lookups
- Never pass app thread IDs to `saveMessage()` or agent functions

**Pattern:**
```typescript
import { createThread } from '@convex-dev/agent';
import { components } from './_generated/api';

// Get or create component thread
const threadId = await createThread(ctx, components.agent, {
  userId: externalId,
});

// Save message to component thread
await saveMessage(ctx, components.agent, {
  threadId,  // Must be component threadId
  prompt: text,
});
```

### Type errors on `components.agent`

**Cause:** Generated types are out of sync

**Solution:**
```bash
npx convex dev  # Regenerates types in convex/_generated/
```

### EventTarget error in agent files

**Cause:** Missing `"use node"` directive

**Solution:** Add to top of file:
```typescript
"use node";

import { action } from '../_generated/server';
// ...rest of imports
```

## Function Types

### Queries (Read-only, deterministic)
```typescript
export const myQuery = query({
  args: { id: v.id('users') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
```

### Mutations (Write, deterministic)
```typescript
export const myMutation = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db.insert('users', { name });
  },
});
```

### Actions (Non-deterministic, can call external APIs)
```typescript
export const myAction = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    // Can call LLMs, external APIs, etc
    const result = await generateText({ prompt });
    // Use runMutation/runQuery to interact with DB
    await ctx.runMutation(internal.foo.bar, { result });
  },
});
```

## Agent Component Patterns

### Thread Management
```typescript
import { Agent } from '@convex-dev/agent';
import { components } from './_generated/api';

const myAgent = new Agent(components.agent, {
  languageModel,
  instructions: 'You are a helpful assistant',
});

// In an action
if (threadId) {
  const { thread } = await myAgent.continueThread(ctx, { threadId });
} else {
  const { thread, threadId } = await myAgent.createThread(ctx, { userId });
}

const result = await thread.generateText({ prompt });
```

### Creating Tools
```typescript
import { createTool } from '@convex-dev/agent';
import { z } from 'zod';

const myTool = createTool({
  description: 'Search for ideas in the database',
  args: z.object({
    query: z.string().describe('The search query'),
  }),
  handler: async (ctx, args) => {
    return await ctx.runQuery(api.ideas.search, { query: args.query });
  },
});
```

## Validators

Use Convex validators (`v.`) NOT Zod for function arguments:

```typescript
import { v } from 'convex/values';

export const myFunction = mutation({
  args: {
    id: v.id('users'),
    name: v.string(),
    age: v.optional(v.number()),
    tags: v.array(v.string()),
    metadata: v.object({
      key: v.string(),
      value: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    // ...
  },
});
```

## Debugging Tips

### View available functions
```bash
npx convex run --help  # Shows available functions in deployment
```

### Check Convex logs
- Go to Convex Dashboard → Logs
- Filter by function name or error type
- Use `console.log()` for debugging (appears in logs)

### Inspect component data
- Dashboard → Data tab
- Select component (e.g., "agent") above table list
- View `threads`, `messages`, `files` tables

## Best Practices

1. **Always use indexes** - Never query without an index
2. **Paginate large results** - Use `.paginate()` for queries
3. **Keep mutations small** - Break complex logic into multiple functions
4. **Use internal functions** - Prefix with `internal` for backend-only functions
5. **Validate all inputs** - Use `v.` validators on all exported functions
6. **Type return values** - Explicitly type handler return values for complex functions

## Additional Resources

- [PLAYBOOK.md](PLAYBOOK.md) - Comprehensive best practices and patterns
- [AGENTS.md](AGENTS.md) - Full Agent Component reference
- [COMPONENTS.md](COMPONENTS.md) - Rate Limiter, Workflow, RAG components

## Common Component Commands

### Rate Limiter
```typescript
import { RateLimiter, MINUTE } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';

const rateLimiter = new RateLimiter(components.rateLimiter, {
  myLimit: { kind: 'token bucket', period: MINUTE, rate: 1000 },
});

// Check limit
await rateLimiter.limit(ctx, 'myLimit', { key: userId, throws: true });
```

### Workflow
```typescript
import { WorkflowManager } from '@convex-dev/workflow';
import { components } from './_generated/api';

const workflow = new WorkflowManager(components.workflow);

export const myWorkflow = workflow.define({
  args: { userId: v.string() },
  handler: async (step, { userId }) => {
    await step.runMutation(internal.foo.bar, { userId });
    await step.runAction(internal.foo.baz, { userId });
  },
});
```

## Troubleshooting Checklist

- [ ] Using correct CLI syntax (`/` not `:` in paths)?
- [ ] Generated types up to date (`npx convex dev`)?
- [ ] Using component threadIds with agent functions?
- [ ] Added `"use node"` directive to agent files?
- [ ] Using Convex validators (`v.`) not Zod for args?
- [ ] Checked Convex Dashboard logs for errors?
