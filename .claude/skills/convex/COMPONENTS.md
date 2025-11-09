# Convex Components Reference

Quick reference for official Convex components. Install from npm and configure in `convex.config.ts`.

## Installation

```bash
npm install @convex-dev/rate-limiter
npm install @convex-dev/workflow
npm install @convex-dev/rag
```

## Rate Limiter

**Purpose:** Token bucket rate limiting for API endpoints, user actions

**Setup:**
```typescript
// convex.config.ts
import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';

const app = defineApp();
app.use(rateLimiter);
export default app;
```

**Usage:**
```typescript
import { RateLimiter, MINUTE, HOUR } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';

const rateLimiter = new RateLimiter(components.rateLimiter, {
  apiLimit: { kind: 'token bucket', period: MINUTE, rate: 100 },
  userLimit: { kind: 'token bucket', period: HOUR, rate: 1000 },
});

export const myMutation = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    // Throws error if limit exceeded
    await rateLimiter.limit(ctx, 'userLimit', {
      key: userId,
      throws: true,
    });

    // Or check without throwing
    const { ok } = await rateLimiter.limit(ctx, 'apiLimit', {
      key: 'global',
      throws: false,
    });
    if (!ok) return { error: 'Rate limit exceeded' };

    // ... rest of logic
  },
});
```

**Rate types:**
- `token bucket`: Allows bursts, refills over time
- `fixed window`: Hard limit per time window

**Common patterns:**
```typescript
// Per-user limits
{ key: userId, throws: true }

// Per-IP limits
{ key: request.ip, throws: false }

// Global API limits
{ key: 'api', throws: true }

// Feature-specific limits
{ key: `${userId}:sendMessage`, throws: true }
```

## Workflow

**Purpose:** Multi-step background jobs, retries, scheduling

**Setup:**
```typescript
// convex.config.ts
import { defineApp } from 'convex/server';
import workflow from '@convex-dev/workflow/convex.config';

const app = defineApp();
app.use(workflow);
export default app;
```

**Usage:**
```typescript
import { WorkflowManager } from '@convex-dev/workflow';
import { components } from './_generated/api';

const workflowManager = new WorkflowManager(components.workflow);

// Define workflow
export const onboardUser = workflowManager.define({
  args: { userId: v.id('users') },
  handler: async (step, { userId }) => {
    // Step 1: Send welcome email
    await step.runAction(internal.emails.sendWelcome, { userId });

    // Step 2: Wait 1 day
    await step.sleep('wait-1-day', 24 * 60 * 60 * 1000);

    // Step 3: Send follow-up
    await step.runAction(internal.emails.sendFollowUp, { userId });

    // Step 4: Run mutation
    await step.runMutation(internal.users.markOnboarded, { userId });
  },
});

// Start workflow
export const createUser = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await ctx.db.insert('users', { name });

    // Trigger workflow
    await workflowManager.start(ctx, internal.workflows.onboardUser, { userId });

    return userId;
  },
});

// Cancel workflow
export const cancelOnboarding = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await workflowManager.cancel(ctx, `onboardUser-${userId}`);
  },
});
```

**Key features:**
- Automatic retries on failure
- Sleep between steps
- Cancel workflows
- Persist state between steps
- Safe across deployments

**Common patterns:**
```typescript
// Retry with exponential backoff
await step.runAction('fetch-api', internal.api.fetch, { url }, {
  maxAttempts: 3,
});

// Conditional steps
const result = await step.runQuery('check', internal.users.isActive, { userId });
if (result.active) {
  await step.runMutation('notify', internal.notifications.send, { userId });
}

// Parallel steps (careful: not truly parallel, runs sequentially)
await step.runAction('email', internal.emails.send, { userId });
await step.runAction('sms', internal.sms.send, { userId });
```

## RAG (Retrieval-Augmented Generation)

**Purpose:** Vector search, embeddings, semantic search for AI context

**Setup:**
```typescript
// convex.config.ts
import { defineApp } from 'convex/server';
import rag from '@convex-dev/rag/convex.config';

const app = defineApp();
app.use(rag);
export default app;
```

**Usage:**
```typescript
import { Rag } from '@convex-dev/rag';
import { components } from './_generated/api';
import { action } from './_generated/server';
import { embed } from '@convex-dev/rag/embeddings';

const rag = new Rag(components.rag);

// Index documents
export const indexDocument = action({
  args: {
    documentId: v.id('documents'),
    text: v.string(),
  },
  handler: async (ctx, { documentId, text }) => {
    const embedding = await embed(text);

    await rag.insert(ctx, {
      id: documentId,
      embedding,
      metadata: { type: 'document' },
    });
  },
});

// Search documents
export const searchDocuments = action({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const queryEmbedding = await embed(query);

    const results = await rag.search(ctx, {
      embedding: queryEmbedding,
      limit: 5,
    });

    // results = [{ id, score, metadata }, ...]
    return results;
  },
});

// Use with LLM
export const askQuestion = action({
  args: { question: v.string() },
  handler: async (ctx, { question }) => {
    const queryEmbedding = await embed(question);
    const docs = await rag.search(ctx, {
      embedding: queryEmbedding,
      limit: 3,
    });

    // Get full document text
    const context = await Promise.all(
      docs.map(d => ctx.runQuery(internal.documents.get, { id: d.id }))
    );

    // Send to LLM with context
    const response = await generateText({
      prompt: `Context: ${context.join('\n\n')}\n\nQuestion: ${question}`,
    });

    return response;
  },
});
```

**Embedding providers:**
- OpenAI: `embed(text, { model: 'text-embedding-3-small' })`
- Custom: Provide your own embedding function

**Common patterns:**
```typescript
// Chunking long documents
const chunks = splitIntoChunks(document, 500); // 500 words per chunk
for (const chunk of chunks) {
  const embedding = await embed(chunk);
  await rag.insert(ctx, {
    id: `${documentId}-${chunk.index}`,
    embedding,
    metadata: { documentId, chunkIndex: chunk.index },
  });
}

// Filter by metadata
const results = await rag.search(ctx, {
  embedding: queryEmbedding,
  limit: 10,
  filter: (metadata) => metadata.type === 'faq',
});

// Update embeddings
await rag.delete(ctx, documentId);
await rag.insert(ctx, { id: documentId, embedding: newEmbedding });
```

## Tips

- **Rate Limiter**: Use `throws: false` for graceful degradation
- **Workflow**: Keep steps idempotent (safe to retry)
- **RAG**: Chunk documents < 8k tokens for better retrieval
- **All components**: Check Dashboard → Data tab for component tables

## Resources

- [Rate Limiter docs](https://labs.convex.dev/rate-limiter)
- [Workflow docs](https://labs.convex.dev/workflow)
- [RAG docs](https://labs.convex.dev/rag)
- [Components overview](https://docs.convex.dev/production/components)
