import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { agentMetadataValidator } from "./lib/validators";
import { authTables } from "@convex-dev/auth/server";

// Validators
const consentValidator = v.object({
  emergency: v.boolean(),
  marketing: v.boolean(),
});

const addressValidator = v.object({
  line1: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  country: v.optional(v.string()),
});

// Zone scores validator (P1-P6)
const zonesValidator = v.object({
  P1: v.optional(v.number()),
  P2: v.optional(v.number()),
  P3: v.optional(v.number()),
  P4: v.optional(v.number()),
  P5: v.optional(v.number()),
  P6: v.optional(v.number()),
});

export default defineSchema({
  ...authTables,

  // Users - User profiles
  users: defineTable({
    externalId: v.string(), // Phone number or email
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.optional(v.union(v.literal("sms"), v.literal("email"), v.literal("web"))),
    locale: v.optional(v.string()),
    consent: v.optional(consentValidator),
    address: v.optional(addressValidator),
    metadata: v.optional(agentMetadataValidator),
    lastEngagementDate: v.optional(v.number()),
    // Score-centric fields (also stored in metadata for backward compatibility)
    gcSdohScore: v.optional(v.number()), // GC-SDOH Score (0-100)
    zones: v.optional(zonesValidator), // P1-P6 zone scores
    riskLevel: v.optional(v.union(v.literal("low"), v.literal("moderate"), v.literal("high"), v.literal("crisis"))),
    lastEMA: v.optional(v.number()),
    lastSDOH: v.optional(v.number()),
    emaEnabled: v.optional(v.boolean()),
    zipCode: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_phone", ["phone"]),

  // Assessments - Completed assessments (EMA + SDOH only)
  assessments: defineTable({
    userId: v.id("users"),
    definitionId: v.union(
      v.literal("ema"),
      v.literal("sdoh")
    ),
    version: v.string(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.number(),
      })
    ),
    rawScores: v.optional(v.any()), // Instrument-native scores per domain
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "definitionId"]),

  // Scores - Burnout scores (raw + normalized) - EMA + SDOH only
  scores: defineTable({
    userId: v.id("users"),
    assessmentId: v.id("assessments"),
    instrument: v.union(
      v.literal("ema"),
      v.literal("sdoh")
    ),
    rawComposite: v.number(), // Instrument-native score
    gcBurnout: v.number(), // Normalized GiveCare score (0-100)
    band: v.union(
      v.literal("very_low"),
      v.literal("low"),
      v.literal("moderate"),
      v.literal("high")
    ),
    zones: zonesValidator, // P1-P6 zone scores
    confidence: v.number(), // 0-1: answered_ratio for partial assessments
    answeredRatio: v.number(), // answered / total questions
  })
    .index("by_user_and_type", ["userId", "instrument"])
    .index("by_user", ["userId"])
    .index("by_user_and_assessment", ["userId", "assessmentId"]),

  // Score history - Track score changes over time
  score_history: defineTable({
    userId: v.id("users"),
    oldScore: v.number(), // Previous score
    newScore: v.number(), // New score
    zones: zonesValidator, // Zone snapshot at time of change
    trigger: v.union(v.literal("ema"), v.literal("sdoh"), v.literal("observation")),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Scores composite - Composite burnout score history (for trend charts)
  scores_composite: defineTable({
    userId: v.id("users"),
    gcBurnout: v.number(), // Composite score (0-100)
    band: v.string(), // very_low | low | moderate | high
  })
    .index("by_user", ["userId"]),

  // Assessment sessions - In-progress assessments
  assessment_sessions: defineTable({
    userId: v.id("users"),
    definitionId: v.string(),
    channel: v.union(v.literal("sms"), v.literal("web")),
    questionIndex: v.number(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.number(),
      })
    ),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_user_and_type", ["userId", "definitionId"]),

  // Interventions - Evidence-based interventions
  interventions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetZones: v.array(v.string()), // Kept for backward compatibility
    evidenceLevel: v.union(
      v.literal("high"),
      v.literal("moderate"),
      v.literal("low")
    ),
    duration: v.string(), // e.g., "2-5 min"
    tags: v.array(v.string()),
    content: v.string(), // Instructions
  })
    .index("by_category", ["category"])
    .index("by_evidence", ["evidenceLevel"]),

  // Intervention zones - Join table for zone-based queries
  intervention_zones: defineTable({
    interventionId: v.id("interventions"),
    zone: v.string(), // 'emotional', 'physical', 'social', 'time', 'financial'
  })
    .index("by_zone", ["zone"])
    .index("by_intervention", ["interventionId"]),

  // Intervention events - User interaction tracking (DEPRECATED: use events table)
  intervention_events: defineTable({
    userId: v.id("users"),
    interventionId: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  // Events - Generic event log for learning loop (replaces intervention_events)
  events: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("intervention.try"),
      v.literal("intervention.success"),
      v.literal("intervention.skip"),
      v.literal("resource.open"),
      v.literal("resource.search"),
      v.literal("assessment.completed"),
      v.literal("assessment.started"),
      v.literal("profile.updated"),
      v.literal("memory.recorded"),
      v.literal("check_in.completed")
    ),
    payload: v.any(), // Flexible payload for event-specific data
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // Subscriptions - Stripe subscriptions
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    planId: v.union(v.literal("monthly"), v.literal("annual")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due")
    ),
    currentPeriodEnd: v.number(),
    canceledAt: v.optional(v.number()),
    gracePeriodEndsAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_customer", ["stripeCustomerId"]),

  // Memories - User context memories
  memories: defineTable({
    userId: v.id("users"),
    category: v.union(
      v.literal("care_routine"),
      v.literal("preference"),
      v.literal("intervention_result"),
      v.literal("crisis_trigger"),
      v.literal("family_health")
    ),
    content: v.string(),
    importance: v.number(), // 1-10
  })
    .index("by_user_and_importance", ["userId", "importance"])
    .index("by_user_category", ["userId", "category"]),

  // Resource cache - Google Maps results cache (policy-compliant: place_id only)
  resource_cache: defineTable({
    category: v.string(),
    zip: v.string(),
    placeIds: v.optional(v.array(v.string())), // Only place_id, name, types, createdAt
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    // Legacy field
    results: v.optional(v.any()),
  })
    .index("by_zip_cat", ["zip", "category"])
    .index("by_expiresAt", ["expiresAt"]),

  // Triggers - Scheduled check-ins
  triggers: defineTable({
    userId: v.id("users"),
    userExternalId: v.string(),
    rrule: v.string(), // iCal RRULE
    timezone: v.string(),
    nextRun: v.number(),
    payload: v.any(),
    type: v.union(v.literal("recurring"), v.literal("one_off")),
    status: v.union(v.literal("active"), v.literal("paused")),
  })
    .index("by_user", ["userId"])
    .index("by_nextRun", ["nextRun"]),

  // Alerts - Crisis alerts and notifications
  alerts: defineTable({
    userId: v.id("users"),
    type: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    context: v.any(),
    message: v.string(),
    channel: v.union(v.literal("sms"), v.literal("email")),
    status: v.union(v.literal("pending"), v.literal("processed")),
  })
    .index("by_user", ["userId"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"]),

  // Billing events - Stripe webhook idempotency
  billing_events: defineTable({
    stripeEventId: v.string(),
    userId: v.optional(v.id("users")),
    type: v.string(),
    data: v.any(),
  }).index("by_event", ["stripeEventId"]),

  // Inbound receipts - Twilio message idempotency (fields optional for migration)
  inbound_receipts: defineTable({
    messageSid: v.string(), // Unique Twilio MessageSid
    userId: v.optional(v.id("users")),
    receivedAt: v.optional(v.number()),
  })
    .index("by_messageSid", ["messageSid"]) // Unique index
    .index("by_user", ["userId"]),

  // Agent runs - Agent execution tracking
  // Preferred fields: agentName, threadId, toolCalls, createdAt
  // Legacy fields (deprecated): agent, budgetResult, latencyMs, policyBundle, traceId
  // Note: Records are created via usageHandler in agents.ts (see internal/agentRuns.ts)
  agent_runs: defineTable({
    userId: v.id("users"),
    // Preferred: Use agentName instead of agent
    agentName: v.optional(v.union(v.literal("main"), v.literal("assessment"), v.literal("crisis"))),
    threadId: v.optional(v.string()), // Thread ID from Agent Component (managed separately)
    toolCalls: v.optional(v.array(v.any())),
    createdAt: v.optional(v.number()),
    // Legacy fields (deprecated - use agentName, createdAt instead)
    agent: v.optional(v.string()),
    budgetResult: v.optional(v.any()),
    latencyMs: v.optional(v.number()),
    policyBundle: v.optional(v.string()),
    traceId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Guardrail events - Safety guardrail triggers
  guardrail_events: defineTable({
    userId: v.optional(v.id("users")),
    type: v.union(
      v.literal("crisis"),
      v.literal("false_positive"),
      v.literal("dv_hint"),
      v.literal("crisis_followup_sent"),
      v.literal("stress_spike_followup_sent"),
      v.literal("reassurance_loop"),
      v.literal("self_sacrifice")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    context: v.any(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_severity", ["severity"]),

  // Conversation feedback - User feedback on AI responses
  conversation_feedback: defineTable({
    userId: v.id("users"),
    agentRunId: v.optional(v.id("agent_runs")),
    alertId: v.optional(v.id("alerts")), // Link to crisis alert if applicable
    helpful: v.boolean(),
    reason: v.optional(v.string()), // "too_generic", "didnt_understand", "perfect", "other"
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_alert", ["alertId"])
    .index("by_helpful", ["helpful"]),

  // Crisis feedback - Specific feedback for crisis interventions
  crisis_feedback: defineTable({
    userId: v.id("users"),
    alertId: v.id("alerts"), // Link to original crisis alert
    connectedWith988: v.optional(v.boolean()), // Did they connect with crisis hotline?
    wasHelpful: v.optional(v.boolean()), // Was the response helpful?
    followUpResponse: v.optional(v.string()), // Their verbatim response
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_alert", ["alertId"])
    .index("by_connected", ["connectedWith988"]),

  // Session metrics - Aggregate metrics per conversation session
  session_metrics: defineTable({
    userId: v.id("users"),
    threadId: v.optional(v.string()), // Agent thread ID if applicable
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    messageCount: v.number(),
    assessmentCompleted: v.optional(v.boolean()),
    crisisDetected: v.optional(v.boolean()),
    userReturnedNext24h: v.optional(v.boolean()), // Calculated retroactively
    avgResponseTimeMs: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"])
    .index("by_started", ["startedAt"]),

  // LLM usage - token accounting
  llm_usage: defineTable({
    userId: v.optional(v.id("users")),
    agentName: v.optional(v.union(v.literal("main"), v.literal("assessment"), v.literal("crisis"))),
    model: v.string(),
    provider: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_created", ["createdAt"]),

  // Usage invoices - rollups
  usage_invoices: defineTable({
    userId: v.id("users"),
    billingPeriod: v.string(), // e.g., 2025-01
    totalTokens: v.number(),
    totalCost: v.number(),
    status: v.union(v.literal("open"), v.literal("paid"), v.literal("void")),
  }).index("by_user_period", ["userId", "billingPeriod"]),

  // Entitlements
  entitlements: defineTable({
    userId: v.id("users"),
    feature: v.string(),
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
  }).index("by_user_feature", ["userId", "feature"]),

  // Prompt versions (for future A/B and audit)
  prompt_versions: defineTable({
    name: v.string(),
    version: v.string(),
    prompt: v.string(),
    createdAt: v.number(),
  }).index("by_name_version", ["name", "version"]),

  // Tool call telemetry
  tool_calls: defineTable({
    userId: v.optional(v.id("users")),
    agentName: v.optional(v.string()),
    name: v.string(),
    durationMs: v.optional(v.number()),
    success: v.boolean(),
    cost: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_name", ["name"]),

  // Watcher state - cron cursors
  watcher_state: defineTable({
    watcherName: v.string(),
    cursor: v.optional(v.any()),
    lastRun: v.optional(v.number()),
  }).index("by_watcher", ["watcherName"]),
});
