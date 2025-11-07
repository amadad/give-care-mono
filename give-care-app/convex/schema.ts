import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const budgetValidator = v.object({
  maxInputTokens: v.number(),
  maxOutputTokens: v.number(),
  maxTools: v.number(),
});

const promptHistoryValidator = v.object({
  fieldId: v.string(),
  text: v.string(),
});

const consentValidator = v.object({
  emergency: v.boolean(),
  marketing: v.boolean(),
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
  users: defineTable({
    // Old fields (from pre-refactor schema)
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    // New fields
    externalId: v.optional(v.string()),
    phone: v.optional(v.string()),
    channel: v.optional(v.union(v.literal('sms'), v.literal('web'))),
    locale: v.optional(v.string()),
    createdByHarness: v.optional(v.boolean()),
  })
    .index('by_externalId', ['externalId'])
    .index('by_phone', ['phone']),

  profiles: defineTable({
    userId: v.id('users'),
    demographics: v.optional(v.any()),
    preferences: v.optional(v.any()),
  }).index('by_user', ['userId']),

  sessions: defineTable({
    userId: v.id('users'),
    channel: v.union(v.literal('sms'), v.literal('web')),
    locale: v.string(),
    policyBundle: v.string(),
    budget: budgetValidator,
    promptHistory: v.array(promptHistoryValidator),
    consent: consentValidator,
    metadata: v.any(),
    lastAssessment: v.optional(lastAssessmentValidator),
    crisisFlags: v.optional(crisisFlagsValidator),
    lastSeen: v.number(),
  }).index('by_user_channel', ['userId', 'channel']),

  messages: defineTable({
    userId: v.id('users'),
    channel: v.union(v.literal('sms'), v.literal('web')),
    direction: v.union(v.literal('inbound'), v.literal('outbound')),
    text: v.string(),
    meta: v.optional(v.any()),
    traceId: v.string(),
    redactionFlags: v.array(v.string()),
  })
    .index('by_user_created', ['userId'])
    .index('by_user_direction', ['userId', 'direction']),

  assessments: defineTable({
    userId: v.id('users'),
    definitionId: v.string(),
    version: v.string(),
    answers: v.array(v.object({ questionId: v.string(), value: v.number() })),
  })
    .index('by_user', ['userId'])
    .index('by_user_definition', ['userId', 'definitionId']),

  scores: defineTable({
    userId: v.id('users'),
    assessmentId: v.id('assessments'),
    composite: v.number(),
    band: v.string(),
    confidence: v.number(),
  }).index('by_user', ['userId']),

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

  interventions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetZones: v.array(v.string()),
    evidenceLevel: v.string(),
    duration: v.string(),
    tags: v.array(v.string()),
    content: v.string(),
  })
    .index('by_category', ['category'])
    .index('by_evidence', ['evidenceLevel']),

  intervention_events: defineTable({
    userId: v.id('users'),
    interventionId: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  }).index('by_user', ['userId']),

  tool_calls: defineTable({
    userId: v.id('users'),
    agent: v.string(),
    name: v.string(),
    args: v.optional(v.object({})),
    durationMs: v.number(),
    success: v.boolean(),
    cost: v.number(),
    traceId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_trace', ['traceId']),

  agent_runs: defineTable({
    userId: v.id('users'),
    agent: v.string(),
    policyBundle: v.string(),
    budgetResult: v.object({ usedInputTokens: v.number(), usedOutputTokens: v.number(), toolCalls: v.number() }),
    latencyMs: v.number(),
    traceId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_trace', ['traceId']),

  guardrail_events: defineTable({
    userId: v.optional(v.id('users')),
    ruleId: v.string(),
    action: v.string(),
    context: v.optional(v.any()),
    traceId: v.string(),
  }).index('by_rule', ['ruleId']),

  policies: defineTable({
    name: v.string(),
    version: v.string(),
    bundle: v.object({}),
  }).index('by_name', ['name', 'version']),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index('by_key', ['key']),

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

  alerts: defineTable({
    userId: v.id('users'),
    type: v.string(),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    context: v.any(),
    message: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email')),
    payload: v.optional(v.any()),
    status: v.union(v.literal('pending'), v.literal('processed')),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type', 'severity']),

  memories: defineTable({
    userId: v.id('users'),
    externalId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
    embedding: v.optional(v.array(v.float64())),
    lastAccessedAt: v.number(),
    accessCount: v.number(),
  }).index('by_user', ['userId']),

  emails: defineTable({
    userId: v.optional(v.id('users')),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    traceId: v.string(),
  }).index('by_user', ['userId']),

  subscriptions: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    planId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_customer', ['stripeCustomerId']),

  entitlements: defineTable({
    userId: v.id('users'),
    feature: v.string(),
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  billing_events: defineTable({
    userId: v.optional(v.id('users')),
    stripeEventId: v.string(),
    type: v.string(),
    data: v.any(),
  }).index('by_event', ['stripeEventId']),

  // Materialized metrics (pre-aggregated for dashboard performance)
  // Updated daily by cron job to avoid full table scans
  metrics_daily: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalUsers: v.number(),
    activeUsers: v.number(), // users with activity in last 24h
    newUsers: v.number(),
    totalMessages: v.number(),
    inboundMessages: v.number(),
    outboundMessages: v.number(),
    avgBurnoutScore: v.number(),
    crisisAlerts: v.number(),
    avgResponseLatencyMs: v.number(),
    p95ResponseLatencyMs: v.number(),
  })
    .index('by_date', ['date']),

  metrics_subscriptions: defineTable({
    updatedAt: v.number(), // timestamp of last update
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
  })
    .index('by_bucket', ['bucket']),

  watcher_state: defineTable({
    watcherName: v.string(),
    cursor: v.optional(v.id('users')),
    lastRun: v.number(),
  }).index('by_watcher', ['watcherName']),
});
