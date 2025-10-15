import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Complete Convex schema mirroring Supabase production database.
 */
export default defineSchema({
  ...authTables,
  // Customize the users table from authTables to include both admin and caregiver fields
  users: defineTable({
    // Auth fields (for admin dashboard login)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Caregiver fields (for SMS users - all optional since admins won't have these)
    phoneNumber: v.optional(v.string()), // E.164 format for SMS users
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    journeyPhase: v.optional(v.string()), // onboarding | active | maintenance | churned | crisis
    burnoutScore: v.optional(v.number()), // 0-100
    burnoutBand: v.optional(v.string()), // crisis | high | moderate | mild | thriving
    burnoutConfidence: v.optional(v.number()), // 0-1
    assessmentInProgress: v.optional(v.boolean()),
    assessmentType: v.optional(v.string()), // ema | cwbs | reach_ii | sdoh
    assessmentCurrentQuestion: v.optional(v.number()),
    assessmentSessionId: v.optional(v.string()),
    pressureZones: v.optional(v.array(v.string())),
    pressureZoneScores: v.optional(v.any()),
    onboardingAttempts: v.optional(v.any()),
    onboardingCooldownUntil: v.optional(v.number()),
    rcsCapable: v.optional(v.boolean()),
    deviceType: v.optional(v.string()),
    consentAt: v.optional(v.number()),
    languagePreference: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    appState: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    lastContactAt: v.optional(v.number()),
    lastProactiveMessageAt: v.optional(v.number()),
    lastCrisisEventAt: v.optional(v.number()),
    crisisFollowupCount: v.optional(v.number()),
    reactivationMessageCount: v.optional(v.number()),

    // Conversation Summarization (Task 9)
    recentMessages: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    }))),
    historicalSummary: v.optional(v.string()),
    conversationStartDate: v.optional(v.number()),
    totalInteractionCount: v.optional(v.number()),
  })
    .index("email", ["email"]) // For admin login
    .index("by_phone", ["phoneNumber"]) // For SMS user lookup
    .index("by_journey", ["journeyPhase"])
    .index("by_burnout", ["burnoutScore"])
    .index("by_burnout_band", ["burnoutBand"])
    .index("by_subscription", ["subscriptionStatus"])
    .index("by_last_contact", ["lastContactAt"])
    .index("by_last_proactive", ["lastProactiveMessageAt"])
    .index("by_crisis_event", ["lastCrisisEventAt"])
    // Composite indexes for common dashboard queries
    .index("by_subscription_contact", ["subscriptionStatus", "lastContactAt"]) // Active users by recency
    .index("by_journey_contact", ["journeyPhase", "lastContactAt"]) // Onboarding users by recency
    .index("by_band_crisis", ["burnoutBand", "lastCrisisEventAt"]) // Crisis users needing follow-up
    .index("by_journey_subscription", ["journeyPhase", "subscriptionStatus"]), // Onboarding + active filter

  // WELLNESS_SCORES (maps to public.wellness_scores)
  wellnessScores: defineTable({
    userId: v.id("users"),

    // Core score (maps to overall_score)
    overallScore: v.number(), // 0-100

    // Source (maps to assessment_source, assessment_type, assessment_session_id)
    assessmentSource: v.optional(v.string()),
    assessmentType: v.optional(v.string()),
    assessmentSessionId: v.optional(v.id("assessmentSessions")),

    // Extended fields (not in Supabase, but needed for agent)
    confidence: v.optional(v.number()), // 0-1
    band: v.optional(v.string()), // crisis | high | moderate | mild | thriving
    pressureZones: v.array(v.string()),
    pressureZoneScores: v.any(), // domain -> score (flexible object structure)

    // Timestamp (maps to created_at)
    recordedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_user_recorded", ["userId", "recordedAt"])
    .index("by_source", ["assessmentSource"])
    .index("by_session", ["assessmentSessionId"]),

  // ASSESSMENT_RESPONSES (maps to public.assessment_responses)
  assessmentResponses: defineTable({
    // Foreign keys (maps to session_id)
    sessionId: v.id("assessmentSessions"),
    userId: v.id("users"), // Denormalized for faster queries

    // Question (maps to question_id)
    questionId: v.string(),
    questionText: v.optional(v.string()), // Not in Supabase, but useful

    // Response (maps to response_value)
    responseValue: v.string(),

    // Score (not in Supabase, but needed for burnout calculation)
    score: v.optional(v.number()),

    // Timestamps (maps to responded_at, created_at)
    respondedAt: v.number(),
    createdAt: v.number()
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_question", ["questionId"]),

  // ASSESSMENT_SESSIONS (not in Supabase, but needed for workflow)
  assessmentSessions: defineTable({
    userId: v.id("users"),
    type: v.string(), // ema | cwbs | reach_ii | sdoh

    // Progress
    completed: v.boolean(),
    currentQuestion: v.number(),
    totalQuestions: v.number(),

    // Responses (for quick access)
    responses: v.any(), // question_id -> response_value (flexible object)

    // Scoring (calculated on completion)
    overallScore: v.optional(v.union(v.number(), v.null())), // null if all questions skipped
    domainScores: v.optional(v.any()), // Flexible domain scores object

    // Timestamps
    startedAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_completed", ["completed"])
    .index("by_completion_date", ["completedAt"]),

  // KNOWLEDGE_BASE (maps to public.knowledge_base)
  knowledgeBase: defineTable({
    // Type (routine | resource | intervention | education)
    type: v.string(),
    category: v.optional(v.string()),

    // Content
    title: v.string(),
    description: v.string(),
    content: v.optional(v.string()),

    // Matching
    pressureZones: v.array(v.string()),
    tags: v.array(v.string()),

    // Evidence
    evidenceSource: v.optional(v.string()),
    evidenceLevel: v.optional(v.string()), // peer_reviewed | clinical_trial | expert_consensus | verified_directory | community_validated
    effectivenessPct: v.optional(v.number()), // 0-100

    // Delivery
    deliveryFormat: v.optional(v.string()), // sms_text | rcs_card | url | phone_number | interactive
    deliveryData: v.any(), // jsonb (flexible object)

    // Localization
    language: v.string(),
    culturalTags: v.array(v.string()),
    locationSpecific: v.boolean(),
    zipCodes: v.array(v.string()),

    // Usage tracking
    usageCount: v.number(),
    avgRating: v.optional(v.number()), // 1-5
    lastUsedAt: v.optional(v.number()),

    // Status (pending | active | archived | rejected)
    status: v.string(),
    createdBy: v.optional(v.string()),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    // Vector Search (Task 2)
    embedding: v.optional(v.array(v.number())), // 1536-dim vector (text-embedding-3-small)
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_evidence", ["evidenceLevel"])
    .index("by_language", ["language"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type", "status", "pressureZones"]
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["status", "type", "language"],
    }),

  // KNOWLEDGE_USAGE (maps to public.knowledge_usage)
  knowledgeUsage: defineTable({
    knowledgeId: v.id("knowledgeBase"),
    userId: v.optional(v.id("users")),

    // Context
    pressureZones: v.array(v.string()),
    userQuery: v.optional(v.string()),
    searchMethod: v.optional(v.string()), // semantic | keyword | web_search | direct

    // Engagement
    delivered: v.boolean(),
    userAction: v.optional(v.string()),
    rating: v.optional(v.number()), // 1-5

    // Timestamp
    createdAt: v.number()
  })
    .index("by_knowledge", ["knowledgeId"])
    .index("by_user", ["userId"])
    .index("by_method", ["searchMethod"])
    .index("by_delivered", ["delivered"]),

  // RESOURCE DIRECTORY (providers/programs/facilities/serviceAreas/resources)
  providers: defineTable({
    name: v.string(),
    sector: v.string(),
    operatorUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    license: v.optional(v.string()),
    tosAllowsScrape: v.optional(v.boolean()),
    robotsAllowed: v.optional(v.boolean()),
    lastCrawledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_name", ["name"]),

  programs: defineTable({
    providerId: v.id("providers"),
    name: v.string(),
    description: v.optional(v.string()),
    resourceCategory: v.array(v.string()),
    pressureZones: v.array(v.string()),
    fundingSource: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    languageSupport: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_provider", ["providerId"]),

  facilities: defineTable({
    providerId: v.id("providers"),
    name: v.string(),
    phoneE164: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    zip: v.optional(v.string()),
    geo: v.optional(v.object({ lat: v.number(), lon: v.number() })),
    hours: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_zip", ["zip"]),

  serviceAreas: defineTable({
    programId: v.id("programs"),
    type: v.string(), // county | city | zip_cluster | statewide | national
    geoCodes: v.array(v.string()), // e.g., ['36059', '11001'] or ['941', '946']
    jurisdictionLevel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_program", ["programId"]),

  resources: defineTable({
    programId: v.id("programs"),
    facilityId: v.optional(v.id("facilities")),
    primaryUrl: v.optional(v.string()),
    aggregatorSource: v.optional(v.string()), // eldercare | benefitscheckup | findhelp
    dataSourceType: v.string(), // manual_entry | scraped | aggregator | partner_api
    verificationStatus: v.string(), // unverified | verified_basic | verified_full
    jurisdictionLevel: v.optional(v.string()),
    lastVerifiedDate: v.optional(v.number()),
    scoreRbi: v.optional(v.number()),
    tosAllowsScrape: v.optional(v.boolean()),
    robotsAllowed: v.optional(v.boolean()),
    license: v.optional(v.string()),
    lastCrawledAt: v.optional(v.number()),
    brokenLink: v.optional(v.boolean()),
    bounceCount: v.optional(v.number()),
    successCount: v.optional(v.number()),
    issueCount: v.optional(v.number()),
    lastFeedbackAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_program", ["programId"])
    .index("by_score", ["scoreRbi"])
    .index("by_verified", ["verificationStatus", "lastVerifiedDate"]),

  resourceVersions: defineTable({
    resourceId: v.id("resources"),
    snapshot: v.any(),
    changeSummary: v.optional(v.string()),
    actorId: v.optional(v.string()), // admin user id or email
    createdAt: v.number()
  })
    .index("by_resource", ["resourceId"])
    .index("by_created_at", ["createdAt"]),

  resourceVerifications: defineTable({
    resourceId: v.id("resources"),
    verificationStatus: v.string(),
    method: v.string(), // phone_call | email | web_check | partner_api
    verifiedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    reviewedAt: v.number(),
    nextReviewAt: v.optional(v.number())
  })
    .index("by_resource", ["resourceId"])
    .index("by_status", ["verificationStatus"])
    .index("by_reviewed_at", ["reviewedAt"]),

  resourceFeedback: defineTable({
    resourceId: v.id("resources"),
    userId: v.optional(v.id("users")),
    type: v.string(), // success | issue
    band: v.optional(v.string()),
    pressureZones: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    submittedAt: v.number()
  })
    .index("by_resource", ["resourceId"])
    .index("by_type", ["type"])
    .index("by_submitted", ["submittedAt"]),

  // CONVERSATIONS (not in Supabase, but needed for dashboard)
  conversations: defineTable({
    userId: v.id("users"),
    role: v.string(), // user | assistant | system
    text: v.string(),
    mode: v.string(), // sms | rcs | voice | web

    // Metadata
    messageSid: v.optional(v.string()), // Twilio message ID
    sessionId: v.optional(v.string()), // OpenAI session ID for tracing
    toolCalls: v.optional(v.array(v.object({
      name: v.string(),
      args: v.any()
    }))),
    agentName: v.optional(v.string()), // main | crisis | assessment

    // Performance
    latency: v.optional(v.number()),
    serviceTier: v.optional(v.string()), // priority | default | auto | flex
    tokenUsage: v.optional(v.object({
      input: v.number(),
      output: v.number(),
      total: v.number()
    })),

    // Execution Trace (for admin dashboard trace viewer)
    executionTrace: v.optional(v.object({
      // Total duration breakdown
      totalMs: v.number(),
      phases: v.object({
        rateLimitMs: v.optional(v.number()),
        guardrailMs: v.optional(v.number()),
        contextBuildMs: v.optional(v.number()),
        agentMs: v.optional(v.number()),
        toolExecutionMs: v.optional(v.number()),
        persistenceMs: v.optional(v.number())
      }),

      // Linear span array (execution order)
      spans: v.array(v.object({
        id: v.string(),
        name: v.string(), // "Rate Limit Check", "Input Guardrails", "Main Agent", "updateProfile Tool", etc.
        type: v.string(), // "rate_limit" | "guardrail" | "agent" | "tool" | "database" | "external_api"
        startMs: v.number(), // Relative to request start
        durationMs: v.number(),
        status: v.string(), // "success" | "error" | "skipped"
        metadata: v.optional(v.any()), // Type-specific data (tool args, error messages, cache hits, etc.)
      })),

      // Resource usage
      model: v.optional(v.string()), // e.g., "gpt-5-nano"
      cacheHit: v.optional(v.boolean()),
      rateLimitRemaining: v.optional(v.object({
        smsUser: v.number(),
        smsGlobal: v.number(),
        openai: v.number()
      })),

      // Errors (if any)
      errors: v.optional(v.array(v.object({
        spanId: v.string(),
        message: v.string(),
        stack: v.optional(v.string())
      })))
    })),

    // Timestamp
    timestamp: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "timestamp"])
    .index("by_mode", ["mode"])
    .index("by_agent", ["agentName"])
    .index("by_service_tier", ["serviceTier"])
    .searchIndex("search_text", { searchField: "text" }),

  // CONVERSATION_FEEDBACK (for admin dashboard quality evaluations)
  conversationFeedback: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),

    // Rating
    rating: v.number(), // 1-5 stars
    dimension: v.string(), // empathy | clarity | trauma_informed | user_satisfaction
    feedbackText: v.optional(v.string()), // Optional user comment

    // Source
    source: v.string(), // user | gpt4_judge | manual_review

    // Timestamp
    timestamp: v.number()
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_dimension", ["dimension"])
    .index("by_conversation", ["conversationId"])
    .index("by_source", ["source"]),

  // NEWSLETTER SUBSCRIBERS (marketing site)
  newsletterSubscribers: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
    unsubscribed: v.boolean(),
    unsubscribedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_subscribed", ["unsubscribed"])
    .index("by_subscribed_at", ["subscribedAt"]),

  // ASSESSMENT RESULTS (marketing site BSFC assessments)
  assessmentResults: defineTable({
    email: v.string(),
    responses: v.array(v.number()),
    totalScore: v.number(),
    averageScore: v.number(),
    band: v.string(), // high | moderate | mild | thriving
    submittedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_submitted_at", ["submittedAt"])
    .index("by_band", ["band"]),

  // TRIGGERS (RRULE-based scheduling for personalized wellness check-ins)
  triggers: defineTable({
    userId: v.id("users"),
    recurrenceRule: v.string(), // RRULE format (RFC 5545) e.g., "FREQ=DAILY;BYHOUR=9;BYMINUTE=0"
    type: v.string(), // "wellness_checkin" | "assessment_reminder" | "crisis_followup"
    message: v.string(),
    timezone: v.string(), // IANA timezone (e.g., "America/Los_Angeles", "America/New_York")
    enabled: v.boolean(),
    nextOccurrence: v.number(), // Unix timestamp (milliseconds)
    createdAt: v.number(),
    lastTriggeredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_next_occurrence", ["nextOccurrence", "enabled"])
    .index("by_type", ["type"])
    .index("by_enabled", ["enabled"])
    .index("by_user_type", ["userId", "type"]),

  // MEMORIES (Working Memory System - Task 10)
  memories: defineTable({
    userId: v.id("users"),
    content: v.string(),
    category: v.string(), // "care_routine" | "preference" | "intervention_result" | "crisis_trigger"
    importance: v.number(), // 1-10
    createdAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
    accessCount: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())), // For future vector search (Task 2)
  })
    .index('by_user', ['userId'])
    .index('by_user_importance', ['userId', 'importance'])
    .index('by_category', ['category'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId'],
    }),

  // ALERTS (Engagement Watcher - Task 11)
  alerts: defineTable({
    userId: v.id("users"),
    type: v.string(), // "disengagement" | "high_stress" | "wellness_decline"
    pattern: v.string(), // "sudden_drop" | "crisis_burst" | "worsening_scores"
    severity: v.string(), // "low" | "medium" | "urgent"
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_severity', ['severity'])
    .index('by_created', ['createdAt']),

});
