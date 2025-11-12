import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { agentMetadataValidator } from "./lib/validators";

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

const reach2DomainsValidator = v.object({
  depression: v.optional(v.number()),
  burden: v.optional(v.number()),
  selfCare: v.optional(v.number()),
  socialSupport: v.optional(v.number()),
  safety: v.optional(v.number()),
  problemBehaviors: v.optional(v.number()),
});

export default defineSchema({
  // Users - User profiles
  users: defineTable({
    externalId: v.string(), // Phone number or email
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.union(v.literal("sms"), v.literal("email"), v.literal("web")),
    locale: v.string(),
    consent: v.optional(consentValidator),
    address: v.optional(addressValidator),
    metadata: v.optional(agentMetadataValidator),
    lastEngagementDate: v.optional(v.number()),
    engagementFlags: v.optional(
      v.object({
        lastNudgeDate: v.optional(v.number()),
        nudgeCount: v.optional(v.number()),
        escalationLevel: v.optional(
          v.union(
            v.literal("none"),
            v.literal("day5"),
            v.literal("day7"),
            v.literal("day14")
          )
        ),
      })
    ),
  })
    .index("by_externalId", ["externalId"])
    .index("by_phone", ["phone"]),

  // Assessments - Completed assessments
  assessments: defineTable({
    userId: v.id("users"),
    definitionId: v.union(
      v.literal("ema"),
      v.literal("cwbs"),
      v.literal("reach2"),
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

  // Scores - Burnout scores (raw + normalized)
  scores: defineTable({
    userId: v.id("users"),
    assessmentId: v.id("assessments"),
    instrument: v.union(
      v.literal("ema"),
      v.literal("cwbs"),
      v.literal("reach2"),
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
    zones: v.object({
      zone_emotional: v.optional(v.number()),
      zone_physical: v.optional(v.number()),
      zone_social: v.optional(v.number()),
      zone_time: v.optional(v.number()),
      zone_financial: v.optional(v.number()),
    }),
    reach2Domains: v.optional(reach2DomainsValidator), // REACH II canonical domains
    confidence: v.number(), // 0-1: answered_ratio for partial assessments
    answeredRatio: v.number(), // answered / total questions
  }).index("by_user_and_type", ["userId", "instrument"]),

  // Scores composite - Composite burnout score history (for trend charts)
  scores_composite: defineTable({
    userId: v.id("users"),
    gcBurnout: v.number(), // Composite score (0-100)
    band: v.string(), // very_low | low | moderate | high
  }).index("by_user", ["userId"]),

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
  }).index("by_user_and_importance", ["userId", "importance"]),

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
  // Note: Records are created automatically by Convex Agent Component
  agent_runs: defineTable({
    userId: v.id("users"),
    // Preferred: Use agentName instead of agent
    agentName: v.optional(v.union(v.literal("main"), v.literal("assessment"))),
    threadId: v.optional(v.id("threads")),
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
      v.literal("dv_hint")
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
    .index("by_severity", ["severity"]),
});
