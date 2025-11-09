# Convex Agent Quick Reference

**Purpose:** Token-efficient cheat sheet for the `@convex-dev/agent` component

---

## Core Concepts

| Concept | Summary |
|---------|---------|
| **Threads** | Linear history of user + agent messages; identified by `threadId`, optional `userId`, metadata (`title`, `summary`). |
| **Messages** | Stored automatically when you pass prompts to `agent.generateText/streamText`; can be listed as raw docs or converted to UI messages. |
| **Orders / stepOrder** | `order` increments per user turn, `stepOrder` increments within the same turn (tool calls/results). Used for context stitching + deletion. |
| **Agent vs Thread vs Call** | Defaults cascade: Agent options → thread overrides (`createThread/continueThread`) → per-call overrides (`thread.generateText({...}, options)`). |

---

## Getting Started

```bash
# install + typegen
npm install @convex-dev/agent
npx convex dev

# optional playground API for quick manual testing
npx convex run --component agent apiKeys:issue '{name:"local"}'
npx @convex-dev/agent-playground
```

Construct an agent:

```ts
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const supportAgent = new Agent(components.agent, {
  languageModel: openai("gpt-4o-mini"),
  textEmbeddingModel: openai.embedding("text-embedding-3-large"),
  tools,
  usageHandler,
});
```

---

## Threads & Messages

| Task | Snippet |
|------|---------|
| **Create thread** | `const threadId = await createThread(ctx, components.agent, { userId, metadata });` |
| **Continue thread** | `const { thread } = await agent.continueThread(ctx, { threadId });` → call `thread.generateText({ prompt })`. |
| **List messages** | `await listUIMessages(ctx, components.agent, { threadId, paginationOpts });` or `useUIMessages(api.chat.listMessages, { threadId }, { initialNumItems: 10, stream: true })`. |
| **Convert docs** | `const uiMessages = toUIMessages(messageDocs);` |
| **Optimistic send** | `optimisticallySendMessage(api.chat.listMessages)` inside `.withOptimisticUpdate`. |
| **Save manually** | `await agent.saveMessage(ctx, { threadId, message, metadata, skipEmbeddings });` |
| **Storage options** | Per call: `{ storageOptions: { saveMessages: "all" | "promptAndOutput" | "none" } }`. |
| **Delete** | `await agent.deleteMessage(ctx, { messageId })` or range-based `deleteMessageRange({ threadId, startOrder, endOrder })`. |

Metadata helpers: `thread.getMetadata()`, `thread.updateMetadata({ patch })`.

---

## Context & Retrieval

| Tool | Purpose |
|------|---------|
| `contextOptions` | Tweak automatic context: `recentMessages`, `excludeToolMessages`, `searchOptions` (text/vector, limits, `messageRange`), `searchOtherThreads`. |
| `contextHandler` | Full control—receives `{ search, recent, inputMessages, inputPrompt, existingResponses, allMessages }`; return custom `ModelMessage[]`. Perfect for injecting RAG snippets, memories, sample replies, or filtering noise. |
| `fetchContextMessages` | Standalone helper to pull recent/search messages when building your own prompts or doing token estimation. |
| `promptMessageId` | Ensures follow-up generations include all content from a specific user turn (same `order`). |

For RAG, preprocess files (PDF via pdf.js, images via `generateText` describing, etc.) before inserting into the search index.

---

## Streaming Patterns

```ts
// Save stream deltas for fan-out subscriptions
await agent.streamText(
  ctx,
  { threadId },
  { prompt },
  { saveStreamDeltas: { chunking: "line", throttleMs: 1000 } },
);

// Query deltas+messages
await syncStreams(ctx, components.agent, { threadId, streamArgs, paginationOpts });
```

Client side:
- `useUIMessages(..., { stream: true })` auto-subscribes to deltas.
- `useSmoothText(message.text, { startStreaming: message.status === "streaming" })` for incremental rendering.
- Need raw iteration? `for await (const part of result.textStream) { ... }` or `result.toUIMessageStreamResponse()`.
- Advanced (no Agent wrapper): use `DeltaStreamer` + AI SDK `streamText`, then `useStreamingUIMessages` to consume.

---

## Tools & Nested Agents

1. **Define**
```ts
export const ideaSearch = createTool({
  description: "Search stored ideas",
  args: z.object({ query: z.string().describe("Free-text query") }),
  handler: async (ctx, args) => ctx.runQuery(api.ideas.search, args),
});
```
2. **Wire** tools via Agent constructor, `createThread`, `thread.generateText`, or per-call overrides. Merging order: call args → thread → agent defaults.
3. **Custom ctx**: extend `ToolCtx` (contains Convex `ActionCtx`, plus `agent`, `threadId`, `messageId`, `userId`). Pass extra fields via `agent.generateText(ctx as ToolCtx & { orgId: string }, ...)` and annotate tool handler types.
4. **LLM-as-tool**: inside `handler` call another Agent or direct `generateText`; save child thread output with `{ storageOptions: { saveMessages: "all" } }` if you want durable audit trails.
5. **stopWhen**: Use `stopWhen: stepCountIs(2)` to let the agent call a tool then continue automatically.

---

## Files & Rich Content

| Step | Notes |
|------|------|
| **Upload** | `const { file } = await storeFile(ctx, components.agent, blob, { filename, sha256 });` (actions only). |
| **Send later** | `const { filePart } = await getFile(...); await agent.saveMessage(ctx, { content: [filePart, { type: "text", text: "Question" }], metadata: { fileIds: [fileId] } });` |
| **Inline send** | From an action: include `{ type: "image", data: bytes | url, mimeType }` directly in `message.content`; oversized payloads auto-save + reference by URL. |
| **Vacuum** | Use `files/vacuum.ts` pattern to delete storage objects not referenced by any message. |

Generated images: `files/generateImage.ts` demonstrates piping DALL·E output back into a thread.

---

## Workflows & Playground

- Chain agents inside actions or durable workflows: e.g. weather agent → fashion agent, each writing to the same `threadId` so UI auto-updates.
- For long-lived multi-step runs, pair Agent calls with the Workflows component (retry, idempotency) or Workpool/Action Retrier for job queues.
- `definePlaygroundAPI` exposes `listAgents`, `createThread`, `generateText`, etc. Issue API keys with `npx convex run --component agent apiKeys:issue` and point the hosted playground (or `npx @convex-dev/agent-playground`) at your deployment.

---

## Rate Limiting & Usage Tracking

| Feature | How |
|---------|-----|
| **Message throttling** | `const rateLimiter = new RateLimiter(components.rateLimiter, { sendMessage: { kind: "fixed window", period: 5*SECOND, rate: 1 } })`; call `await rateLimiter.check(ctx, "sendMessage", { key: userId })` before accepting input. |
| **Token quotas** | Configure `tokenUsagePerUser` / `globalTokenUsage` buckets; estimate prepaid usage via `estimateTokens` helper using `fetchContextMessages`. |
| **Usage handler** | Pass `usageHandler` when constructing an Agent to log `{ userId, threadId, model, usage }` to analytics/billing tables. Sample schema: `rawUsage` table indexed by `(billingPeriod, userId)` plus `invoices` table for aggregation. |

---

## Debugging & Observability

- **rawRequestResponseHandler**: capture model payloads for audit.
- **contextHandler logging**: inspect final prompt composition.
- **Dashboard tables**: `threads`, `messages`, `streamingMessages`, `files` inside the Agent component namespace.
- **Type gotchas**: run `npx convex dev` whenever component schemas change; annotate handler return types to avoid workflow circular deps.
- **Playground logs**: combine with Convex log streaming or external collectors.

---

## Reference Demos

| Scenario | Path / Command |
|----------|----------------|
| Streaming chat | `chat/streaming.ts`, `ChatStreaming.tsx` |
| File Q&A | `files/*.ts`, `FilesImages.tsx` |
| Tooling & MPC | `tools/*.ts`, `MCP` examples |
| RAG ingestion | `rag/` repo (`git clone https://github.com/get-convex/rag.git && npm run example`) |
| Rate limiting + usage | `rateLimiting.ts`, `usage_tracking/*` |
| Workflows | `workflows/*.ts` |

Use these samples as blueprints, then customize threads, tools, and storage policies per app.
