import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentMetadataValidator, demographicsValidator, preferencesValidator } from './lib/validators';

// Validators
const consentValidator = v.object({
  emergency: v.boolean(),
  marketing: v.boolean(),
});

const addressValidator = v.object({
  line1: v.optional(v.string()),
  line2: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  country: v.optional(v.string()),
});

const lastAssessmentValidator = v.object({
  definitionId: v.string(),
  score: v.number(),
});

const crisisFlagsValidator = v.object({
  active: v.boolean(),
  terms: v.array(v.string()),
});

export default defineSchema({
  // Users (GiveCare-specific fields only)
  // Agent Component manages threads/messages automatically
  users: defineTable({
    externalId: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
    locale: v.string(),
    consent: v.optional(consentValidator),
    address: v.optional(addressValidator),
    metadata: v.optional(agentMetadataValidator), // ✅ Typed instead of v.any()
  })
    .index('by_externalId', ['externalId'])
    .index('by_phone', ['phone']),

  // Profiles (GiveCare-specific)
  profiles: defineTable({
    userId: v.id('users'),
    demographics: v.optional(demographicsValidator), // ✅ Typed instead of v.any()
    preferences: v.optional(preferencesValidator), // ✅ Typed instead of v.any()
  }).index('by_user', ['userId']),

  // Assessments (GiveCare-specific)
  assessments: defineTable({
    userId: v.id('users'),
    definitionId: v.string(), // 'ema', 'bsfc', 'reach2', 'sdoh'
    version: v.string(),
    answers: v.array(v.object({ questionId: v.string(), value: v.number() })),
    completedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_definition', ['userId', 'definitionId']),

  // Scores (GiveCare-specific)
  scores: defineTable({
    userId: v.id('users'),
    assessmentId: v.id('assessments'),
    composite: v.number(),
    band: v.string(), // 'crisis', 'moderate', 'stable', 'thriving'
    zones: v.object({
      emotional: v.number(),
      physical: v.number(),
      social: v.number(),
      time: v.number(),
      financial: v.optional(v.number()),
    }),
    confidence: v.number(),
  }).index('by_user', ['userId']),

  // Assessment sessions (in-progress assessments)
  assessment_sessions: defineTable({
    userId: v.id('users'),
    definitionId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('web')),
    questionIndex: v.number(),
    answers: v.array(v.object({ questionId: v.string(), value: v.number() })),
    status: v.union(v.literal('active'), v.literal('completed')),
  })
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_definition', ['userId', 'definitionId']),

  // Interventions (GiveCare-specific)
  interventions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetZones: v.array(v.string()), // Kept for backward compatibility, but use intervention_zones for queries
    evidenceLevel: v.string(), // 'high', 'moderate', 'low'
    duration: v.string(),
    tags: v.array(v.string()),
    content: v.string(),
  })
    .index('by_category', ['category'])
    .index('by_evidence', ['evidenceLevel']),

  // Intervention Zones (join table for efficient zone-based queries)
  // SPEED: Normalized for O(log n) queries instead of O(n) table scans
  intervention_zones: defineTable({
    interventionId: v.id('interventions'),
    zone: v.string(), // 'emotional', 'physical', 'social', 'time', 'financial'
  })
    .index('by_zone', ['zone']) // Fast zone lookups
    .index('by_intervention', ['interventionId']), // For cleanup/deletes

  // Intervention events (tracking user interactions with interventions)
  intervention_events: defineTable({
    userId: v.id('users'),
    interventionId: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  }).index('by_user', ['userId']),

  // Subscriptions (GiveCare-specific)
  subscriptions: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    planId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_customer', ['stripeCustomerId']),

  // Structured memories (lightweight, for category queries only)
  // Semantic search handled by Agent Component via contextOptions
  memories: defineTable({
    userId: v.id('users'),
    category: v.string(), // 'care_routine', 'preference', 'intervention_result', 'crisis_trigger', 'family_health'
    content: v.string(),
    importance: v.number(), // 1-10
    // No embedding - Agent Component handles semantic search
  }).index('by_user_category', ['userId', 'category']),

  // Tool calls (tracking for analytics)
  tool_calls: defineTable({
    userId: v.id('users'),
    agent: v.string(),
    name: v.string(),
    args: v.optional(v.any()),
    durationMs: v.number(),
    success: v.boolean(),
    cost: v.number(),
    traceId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_trace', ['traceId']),

  // Agent runs (tracking for analytics)
  agent_runs: defineTable({
    userId: v.id('users'),
    agent: v.string(),
    policyBundle: v.string(),
    budgetResult: v.object({
      usedInputTokens: v.number(),
      usedOutputTokens: v.number(),
      toolCalls: v.number(),
    }),
    latencyMs: v.number(),
    traceId: v.string(),
    timeout: v.optional(v.boolean()), // Track timeout occurrences
  })
    .index('by_user', ['userId'])
    .index('by_trace', ['traceId']),

  // Agent decisions (routing observability)
  agent_decisions: defineTable({
    userId: v.id('users'),
    inputText: v.string(),
    routingDecision: v.string(), // 'main' | 'crisis' | 'assessment'
    reasoning: v.optional(v.string()),
    confidence: v.optional(v.number()),
    alternatives: v.optional(v.array(v.string())),
    traceId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_trace', ['traceId'])
    .index('by_decision', ['routingDecision']),

  // Guardrail events (safety tracking)
  guardrail_events: defineTable({
    userId: v.optional(v.id('users')),
    ruleId: v.string(),
    action: v.string(),
    context: v.optional(v.any()),
    traceId: v.string(),
  }).index('by_rule', ['ruleId']),

  // Inbound message receipts (idempotency for Twilio retries)
  inbound_receipts: defineTable({
    messageSid: v.string(),
  }).index('by_sid', ['messageSid']),

  // Alerts (crisis alerts, notifications)
  alerts: defineTable({
    userId: v.id('users'),
    type: v.string(),
    severity: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    ),
    context: v.any(),
    message: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email')),
    payload: v.optional(v.any()),
    status: v.union(v.literal('pending'), v.literal('processed')),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type', 'severity']),

  // Triggers (scheduled check-ins, follow-ups)
  triggers: defineTable({
    userId: v.id('users'),
    userExternalId: v.string(),
    rrule: v.string(),
    timezone: v.string(),
    nextRun: v.number(),
    payload: v.any(),
    type: v.union(v.literal('recurring'), v.literal('one_off')),
    status: v.union(v.literal('active'), v.literal('paused')),
  })
    .index('by_user', ['userId'])
    .index('by_nextRun', ['nextRun']),

  // Resource cache (Google Maps results)
  resource_cache: defineTable({
    userId: v.optional(v.id('users')),
    category: v.string(),
    zip: v.string(),
    results: v.optional(v.any()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index('by_category_zip', ['category', 'zip', 'createdAt'])
    .index('by_expiresAt', ['expiresAt']), // For efficient cleanup sweeps

  // Emails (tracking)
  emails: defineTable({
    userId: v.optional(v.id('users')),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    traceId: v.string(),
  }).index('by_user', ['userId']),

  // Billing events (Stripe webhooks)
  billing_events: defineTable({
    userId: v.optional(v.id('users')),
    stripeEventId: v.string(),
    type: v.string(),
    data: v.any(),
  }).index('by_event', ['stripeEventId']),

  // Materialized metrics (pre-aggregated for dashboard performance)
  metrics_daily: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalUsers: v.number(),
    activeUsers: v.number(),
    newUsers: v.number(),
    totalMessages: v.number(),
    inboundMessages: v.optional(v.number()),
    outboundMessages: v.optional(v.number()),
    avgBurnoutScore: v.number(),
    crisisAlerts: v.number(),
    avgResponseLatencyMs: v.number(),
    p95ResponseLatencyMs: v.number(),
  }).index('by_date', ['date']),

  metrics_subscriptions: defineTable({
    updatedAt: v.number(),
    total: v.number(),
    active: v.number(),
    trialing: v.number(),
    pastDue: v.number(),
    canceled: v.number(),
    free: v.number(),
    plus: v.number(),
    enterprise: v.number(),
  }),

  metrics_journey_funnel: defineTable({
    updatedAt: v.number(),
    onboarding: v.number(),
    active: v.number(),
    maintenance: v.number(),
    crisis: v.number(),
    churned: v.number(),
  }),

  metrics_burnout_distribution: defineTable({
    updatedAt: v.number(),
    bucket: v.string(), // "0-20", "21-40", etc.
    count: v.number(),
  }).index('by_bucket', ['bucket']),

  watcher_state: defineTable({
    watcherName: v.string(),
    cursor: v.optional(v.id('users')),
    lastRun: v.number(),
  }).index('by_watcher', ['watcherName']),

  // LLM Usage tracking (Agent Component also tracks, but this is for custom tracking)
  llm_usage: defineTable({
    userId: v.optional(v.id('users')),
    agentName: v.optional(v.string()),
    threadId: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: v.any(),
    billingPeriod: v.string(), // YYYY-MM format
    providerMetadata: v.optional(v.any()),
    traceId: v.optional(v.string()),
  })
    .index('by_user_period', ['userId', 'billingPeriod'])
    .index('by_period', ['billingPeriod'])
    .index('by_trace', ['traceId']),

  // Usage invoices
  usage_invoices: defineTable({
    userId: v.id('users'),
    billingPeriod: v.string(), // YYYY-MM format
    totalTokens: v.number(),
    totalCost: v.number(), // in cents
    status: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('failed'),
      v.literal('waived')
    ),
    stripeInvoiceId: v.optional(v.string()),
    breakdown: v.object({
      byAgent: v.optional(v.any()),
      byModel: v.optional(v.any()),
    }),
  }).index('by_user_period', ['userId', 'billingPeriod']),
});
