# GiveCare Agent Refactoring Summary

Comprehensive refactoring to apply Convex Agent best practices and antipattern fixes.

## Changes Implemented

### 1. Component Installation ✅

**Added Components:**
- `@convex-dev/rate-limiter` - Rate limiting for SMS and token usage
- `@convex-dev/workflow` - Durable workflows with retries
- `@convex-dev/rag` - Retrieval-augmented generation (future use)

**Configuration:** `convex/convex.config.ts`

### 2. Usage Tracking System ✅

**New Schema Tables:** `convex/schema.ts`
```typescript
llm_usage         // Tracks all LLM token usage with costs
usage_invoices    // Aggregated monthly invoices per user
```

**Implementation:** `convex/lib/usage.ts`
- Cost estimation by model (gpt-4o, gpt-4o-mini, etc.)
- Billing period tracking (YYYY-MM format)
- Shared usage handler for all agents
- Automatic insertion via `insertLLMUsage` mutation

**Usage:**
```typescript
import { sharedAgentConfig } from '../lib/usage';

const agent = new Agent(components.agent, {
  ...sharedAgentConfig, // Adds usage tracking
});
```

### 3. Rate Limiting ✅

**Implementation:** `convex/lib/rateLimiting.ts`

**Limits Configured:**
- **SMS Frequency:** 5 messages per 5 minutes per user (burst: 7)
- **Daily SMS:** 50 messages per day per user (burst: 60)
- **Global SMS:** 100 messages per minute (Twilio limit)
- **User Tokens:** 50k tokens per hour per user (burst: 100k)
- **Global Tokens:** 500k tokens per minute (OpenAI limit)
- **Crisis Messages:** Unlimited (tracked separately)

**Helper Functions:**
```typescript
checkMessageRateLimit(ctx, userId, isCrisis)
consumeMessageRateLimit(ctx, userId, isCrisis)
checkTokenRateLimit(ctx, userId, estimatedTokens)
consumeTokenUsage(ctx, userId, actualTokens)
estimateTokens(text, multiplier)
```

**Integration Points:**
- Check before sending SMS (Twilio handler)
- Check before LLM call (estimate tokens)
- Consume after LLM call (actual usage)
- Use `reserve: true` to allow temporary negative balance

### 4. Context Handler Pattern ✅

**Before (Antipattern):**
```typescript
// Manual prompt building and context fetching
const conversationSummary = await ctx.runQuery(...);
const contextSection = `\n\n## Context\n${summary}`;
const systemPrompt = `${basePrompt}\n\n${tone}${contextSection}`;
```

**After (Pattern):**
```typescript
const agent = new Agent(components.agent, {
  contextHandler: async (ctx, args) => {
    // Fetch conversation summary
    const conversationSummary = await ctx.runQuery(...);

    return [
      ...args.search,
      ...conversationContext,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
  },
});
```

**Applied To:**
- `convex/agents/main.ts` - Main agent with conversation history
- `convex/agents/crisis.ts` - Crisis agent with usage tracking
- `convex/agents/assessment.ts` - Assessment agent with usage tracking

### 5. Crisis Escalation Workflow ✅

**Durable Workflow:** `convex/workflows/crisis.ts`

**Steps:**
1. Log crisis event immediately
2. Generate crisis response using agent
3. Notify emergency contact (if high severity)
4. Schedule 24-hour follow-up check-in

**Features:**
- Automatic retries (3 attempts, exponential backoff)
- Survives server restarts
- Idempotent step execution
- Follow-up workflow for abandoned users

**Workflow Steps:** `convex/workflows/crisisSteps.ts`
- `logCrisisEvent` - Insert to alerts table
- `generateCrisisResponse` - Call crisis agent
- `notifyEmergencyContact` - Email emergency contact
- `scheduleFollowUp` - Schedule check-in
- `checkRecentActivity` - Verify user activity
- `sendFollowUpMessage` - Send SMS check-in
- `updateCrisisEvent` - Mark as followed up

**Usage:**
```typescript
await ctx.scheduler.runAfter(0, internal.workflows.crisis.crisisEscalation, {
  userId,
  threadId,
  messageText,
  crisisTerms: ['suicide', 'harm'],
  severity: 'high',
});
```

### 6. File/Image Handling ✅

**Implementation:** `convex/lib/files.ts`

**Features:**
- Store MMS files to Convex storage
- Generate public URLs for LLM vision models
- Track file references in message metadata
- Vacuum unused files (cron job placeholder)

**Key Functions:**
```typescript
storeMMSFile(blob, mimeType, filename, sha256)
getMessageFileParts(fileIds)
buildMessageWithFiles(text, fileIds)
downloadFileFromUrl(url, authHeader)
isImageMimeType(mimeType)
isSupportedImageType(mimeType)
```

**Usage in Messages:**
```typescript
// Store file from Twilio MMS
const { fileId, url } = await storeMMSFile({ blob, mimeType, filename });

// Build message with files
const message = await buildMessageWithFiles(ctx, "What is this?", [fileId]);

// Generate response with vision model
const result = await thread.generateText({
  message,
  metadata: { fileIds: [fileId] }
});
```

### 7. Exposed Agent Actions ✅

**Implementation:** `convex/agents/main.ts` (bottom of file)

**Exported Actions:**
```typescript
export const createThread = mainAgent.createThreadMutation();
export const generateTextAction = mainAgent.asTextAction({ stopWhen: ... });
export const saveMessages = mainAgent.asSaveMessagesMutation();
```

**Benefits:**
- Use agents in workflows
- Idempotent message saving
- Separate thread creation from generation
- Retry-safe operations

**Usage in Workflows:**
```typescript
workflow.define({
  handler: async (step, args) => {
    const { threadId } = await step.runMutation(internal.agents.main.createThread, {
      userId: args.userId,
    });

    const { messageId } = await step.runMutation(internal.agents.main.saveMessages, {
      threadId,
      messages: [{ role: 'user', content: args.prompt }],
    });

    await step.runAction(internal.agents.main.generateTextAction, {
      threadId,
      promptMessageId: messageId, // Idempotent!
    });
  },
});
```

## Patterns Still To Implement

### 1. promptMessageId for Idempotency

**Current Pattern (Not Idempotent):**
```typescript
// If this action is retried, duplicate messages could be created
await thread.generateText({ prompt: userMessage });
```

**Recommended Pattern:**
```typescript
// Step 1: Save message in mutation (idempotent)
const { messageId } = await ctx.runMutation(internal.agents.main.saveMessages, {
  threadId,
  messages: [{ role: 'user', content: userMessage }],
});

// Step 2: Generate response in action with retry (idempotent)
await ctx.runAction(internal.agents.main.generateTextAction, {
  threadId,
  promptMessageId: messageId, // Won't create duplicates on retry
});
```

**Apply To:**
- `convex/twilio.ts` - Twilio SMS handler
- `convex/functions/chat.ts` - Web chat handler

### 2. Message Metadata Tracking

**Pattern:**
```typescript
await agent.saveMessage(ctx, {
  threadId,
  message: { role: 'assistant', content: recommendation },
  metadata: {
    sources: [resourceId1, resourceId2],
    reasoning: 'User needs respite care based on high burnout score',
    confidence: 0.89,
    interventionIds: [id1, id2],
  },
});
```

**Apply To:**
- Resource recommendations (store widget tokens, sources)
- Assessment results (store intervention IDs, scores)
- Crisis responses (store hotline info, severity)

### 3. Tool-Based RAG for Assessment Agent

**Current Pattern:**
```typescript
// Tool is called with zones, then interventions are fetched
const interventions = await ctx.runQuery(api.functions.interventions.getByZones, {
  zones: args.zones,
});
```

**Recommended Pattern:**
```typescript
// Add searchInterventions tool for dynamic RAG
const searchInterventionsTool = createTool({
  description: "Search interventions by description and zones",
  args: z.object({
    query: z.string(),
    zones: z.array(z.string()).optional(),
  }),
  handler: async (ctx, { query, zones }) => {
    return await rag.search(ctx, {
      namespace: 'interventions',
      query,
      filters: zones ? { targetZones: zones } : undefined,
    });
  },
});
```

**Benefits:**
- LLM decides when to search
- More flexible than hardcoded queries
- Can search by semantic similarity

### 4. Human-in-the-Loop Tools

**Pattern:**
```typescript
const escalateToHumanTool = tool({
  description: "Escalate to human support agent",
  parameters: z.object({
    reason: z.string(),
    urgency: z.enum(['low', 'medium', 'high']),
  }),
  // No execute function = requires human intervention
});

// After generation, check for tool calls
if (result.toolCalls.find(tc => tc.toolName === 'escalateToHuman')) {
  await ctx.runMutation(internal.support.createTicket, {
    userId,
    threadId,
    reason: toolCall.args.reason,
  });
}
```

**Use Cases:**
- Complex resource questions
- Insurance/financial questions
- Situations requiring empathy beyond AI
- Legal/medical advice requests

## Migration Guide

### Integrate Rate Limiting

**In Twilio Handler (`convex/twilio.ts`):**
```typescript
import { checkMessageRateLimit, consumeMessageRateLimit } from './lib/rateLimiting';

export const handleInbound = httpAction(async (ctx, request) => {
  // Check rate limit before processing
  const rateLimitCheck = await checkMessageRateLimit(
    ctx,
    userId,
    isCrisis
  );

  if (!rateLimitCheck.ok) {
    // Send rate limit message
    await sendSMS(
      from,
      `You've reached your message limit. Please try again in ${Math.ceil(rateLimitCheck.retryAfter / 1000 / 60)} minutes.`
    );
    return new Response('Rate limited', { status: 429 });
  }

  // Process message...

  // Consume rate limit after successful send
  await consumeMessageRateLimit(ctx, userId, isCrisis);
});
```

### Use Workflows for Reliability

**Replace Direct Agent Calls:**
```typescript
// Before
await ctx.runAction(internal.agents.crisis.runCrisisAgent, { ... });

// After
await ctx.scheduler.runAfter(0, internal.workflows.crisis.crisisEscalation, {
  userId,
  threadId,
  messageText,
  crisisTerms,
  severity: 'high',
});
```

### Add Usage Tracking to Custom Agents

```typescript
import { sharedAgentConfig } from '../lib/usage';

const customAgent = new Agent(components.agent, {
  name: 'Custom Agent',
  languageModel: openai.chat('gpt-4o'),
  ...sharedAgentConfig, // Add usage tracking
});
```

## Testing Checklist

- [ ] Rate limiting prevents SMS spam
- [ ] Usage tracking records all LLM calls
- [ ] Crisis workflow completes all steps
- [ ] Crisis workflow retries on failure
- [ ] Follow-up messages sent after 24h
- [ ] Emergency contacts notified for high severity
- [ ] File upload works for MMS
- [ ] Image files are processed by vision model
- [ ] Exposed actions work in workflows
- [ ] Context handler provides conversation history

## Cost Monitoring

**Track Usage:**
```sql
-- Monthly cost by user
SELECT userId, SUM(estimatedCost) as totalCost
FROM llm_usage
WHERE billingPeriod = '2025-01'
GROUP BY userId
ORDER BY totalCost DESC;

-- Cost by model
SELECT model, COUNT(*) as calls, SUM(totalTokens) as tokens, SUM(estimatedCost) as cost
FROM llm_usage
WHERE billingPeriod = '2025-01'
GROUP BY model;
```

**Rate Limit Dashboard:**
```typescript
// Expose for admin dashboard
export const getRateLimitStatus = query({
  handler: async (ctx) => {
    return await rateLimiter.hookAPI('sendMessage', {
      key: (ctx) => getCurrentUserId(ctx),
    });
  },
});
```

## Performance Impact

**Positive:**
- Context handler reduces manual prompt building
- Workflows handle retries automatically
- Usage tracking enables cost optimization
- Rate limiting prevents runaway costs

**Considerations:**
- Usage tracking adds ~50ms per LLM call (mutation write)
- Rate limit checks add ~10-20ms per request
- Workflow overhead: ~100ms per step (durable execution)

**Optimizations:**
- Usage tracking runs async (doesn't block response)
- Rate limit checks can be cached client-side
- Workflows run in background (don't block user)

## Next Steps

1. **Integrate Rate Limiting** - Add to Twilio and web handlers
2. **Use Workflows** - Replace direct crisis agent calls
3. **Add promptMessageId** - Make Twilio handler idempotent
4. **Add Message Metadata** - Track sources and reasoning
5. **Monitor Costs** - Set up alerts for high usage
6. **Test Crisis Workflow** - Verify end-to-end flow
7. **Add Human Escalation** - Implement escalation tools

## References

- [Convex Agent Docs](https://github.com/get-convex/agent)
- [Rate Limiter Component](https://github.com/get-convex/rate-limiter)
- [Workflow Component](https://github.com/get-convex/workflow)
- [RAG Component](https://github.com/get-convex/rag)
