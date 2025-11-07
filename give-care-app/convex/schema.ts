import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

/**
 * PHASE 1 Denormalized Schema
 *
 * Users table now holds identity + caregiver profile + billing + conversation state.
 * Legacy tables remain temporarily for migration/backfill and are marked for removal
 * in PHASE 2 once data has been copied and reads are moved to the users table.
 */
export default defineSchema({
  ...authTables,

  // ============================================================================
  // JOBS - Idempotent Side-Effects (outbox pattern)
  // ============================================================================
  jobs: defineTable({
    key: v.string(), // Unique idempotency key (e.g., 'twilio:SMxxxxx', 'stripe:evt_xxx')
    type: v.string(), // Job type: 'send_sms', 'send_email', 'process_webhook', etc.
    payload: v.any(), // Job-specific data
    status: v.string(), // 'pending', 'processing', 'completed', 'failed'
    attempts: v.number(), // Retry count
    maxAttempts: v.optional(v.number()), // Max retries (default 3)
    nextAttemptAt: v.number(), // When to process (for scheduling + backoff)
    lastError: v.optional(v.string()), // Last failure reason
    result: v.optional(v.any()), // Result data when completed
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_key', ['key']) // UNIQUE constraint enforcement
    .index('by_status_next', ['status', 'nextAttemptAt']) // Worker query
    .index('by_type_status', ['type', 'status']) // Monitoring
    .index('by_created', ['createdAt']),

  // ============================================================================
  // USERS - Auth Identity Only (minimal for fast webhook lookup)
  // ============================================================================
  users: defineTable({
    // Auth fields (from @convex-dev/auth)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()), // For admin auth
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // SMS identifier (E.164 format) - CRITICAL for webhook performance
    phoneNumber: v.optional(v.string()),

    // Admin roles (DB-driven, not hardcoded)
    roles: v.optional(v.array(v.string())), // ['admin', 'support', etc.]

    // DEPRECATED - Will be removed after migration to userProfiles/conversationState/billingAccounts
    // Keep temporarily for backward compatibility during migration period
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    languagePreference: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    burnoutScore: v.optional(v.number()),
    burnoutBand: v.optional(v.string()),
    burnoutConfidence: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    pressureZoneScores: v.optional(v.any()),
    lastContactAt: v.optional(v.number()),
    lastProactiveMessageAt: v.optional(v.number()),
    lastCrisisEventAt: v.optional(v.number()),
    crisisFollowupCount: v.optional(v.number()),
    reactivationMessageCount: v.optional(v.number()),
    onboardingAttempts: v.optional(v.any()),
    onboardingCooldownUntil: v.optional(v.number()),
    assessmentInProgress: v.optional(v.boolean()),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.optional(v.number()),
    assessmentSessionId: v.optional(v.string()),
    rcsCapable: v.optional(v.boolean()),
    deviceType: v.optional(v.string()),
    consentAt: v.optional(v.number()),
    appState: v.optional(v.any()),
    recentMessages: v.optional(v.any()),
    historicalSummary: v.optional(v.string()),
    historicalSummaryVersion: v.optional(v.string()),
    conversationStartDate: v.optional(v.number()),
    totalInteractionCount: v.optional(v.number()),
    historicalSummaryTokenUsage: v.optional(v.any()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    canceledAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index('email', ['email']) // Admin login
    .index('by_phone', ['phoneNumber']) // SMS lookup (CRITICAL: webhook performance)
    .index('by_created', ['createdAt']),

  // ============================================================================
  // USER_PROFILES - Mostly Static Profile Data
  // ============================================================================
  userProfiles: defineTable({
    userId: v.id('users'),

    // Profile
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    languagePreference: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),

    // Burnout (updated occasionally)
    burnoutScore: v.optional(v.number()),
    burnoutBand: v.optional(v.string()),
    burnoutConfidence: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    pressureZoneScores: v.optional(
      v.object({
        physical_health: v.optional(v.number()),
        emotional_wellbeing: v.optional(v.number()),
        financial_concerns: v.optional(v.number()),
        time_management: v.optional(v.number()),
        social_support: v.optional(v.number()),
      })
    ),

    // Activity timestamps
    lastContactAt: v.optional(v.number()),
    lastProactiveMessageAt: v.optional(v.number()),
    lastCrisisEventAt: v.optional(v.number()),
    crisisFollowupCount: v.optional(v.number()),
    reactivationMessageCount: v.optional(v.number()),

    // Onboarding & assessments
    onboardingAttempts: v.optional(v.record(v.string(), v.number())),
    onboardingCooldownUntil: v.optional(v.number()),
    assessmentInProgress: v.optional(v.boolean()),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.optional(v.number()),
    assessmentSessionId: v.optional(v.string()),

    // Device & consent
    rcsCapable: v.optional(v.boolean()),
    deviceType: v.optional(v.string()),
    consentAt: v.optional(v.number()),

    // Flexible app metadata
    appState: v.optional(
      v.object({
        lastActivity: v.optional(v.number()),
        sessionCount: v.optional(v.number()),
        metadata: v.optional(v.string()),
      })
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_journey', ['journeyPhase'])
    .index('by_burnout', ['burnoutScore'])
    .index('by_burnout_band', ['burnoutBand'])
    .index('by_last_contact', ['lastContactAt'])
    .index('by_journey_contact', ['journeyPhase', 'lastContactAt'])
    .index('by_band_journey', ['burnoutBand', 'journeyPhase'])
    .index('by_band_contact', ['burnoutBand', 'lastContactAt'])
    .index('by_band_crisis', ['burnoutBand', 'lastCrisisEventAt']),

  // ============================================================================
  // CONVERSATION_STATE - High-Churn Conversation Data
  // ============================================================================
  conversationState: defineTable({
    userId: v.id('users'),

    // Recent message window (performance optimization)
    recentMessages: v.optional(
      v.array(
        v.object({
          role: v.string(),
          content: v.string(),
          timestamp: v.number(),
        })
      )
    ),

    // Historical summary (updated periodically)
    historicalSummary: v.optional(v.string()),
    historicalSummaryVersion: v.optional(v.string()),
    conversationStartDate: v.optional(v.number()),
    totalInteractionCount: v.optional(v.number()),
    historicalSummaryTokenUsage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        costUsd: v.number(),
        recordedAt: v.number(),
      })
    ),

    // Timestamps
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_updated', ['updatedAt']),

  // ============================================================================
  // BILLING_ACCOUNTS - Subscription Data
  // ============================================================================
  billingAccounts: defineTable({
    userId: v.id('users'),

    // Stripe identifiers
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),

    // Subscription state
    subscriptionStatus: v.optional(v.string()), // 'active', 'trialing', 'canceled', etc.
    canceledAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_stripe_customer', ['stripeCustomerId'])
    .index('by_stripe_subscription', ['stripeSubscriptionId'])
    .index('by_status', ['subscriptionStatus']),

  // ============================================================================
  // ASSESSMENT SESSIONS - Enhanced with in-progress state
  // ============================================================================
  assessmentSessions: defineTable({
    userId: v.id('users'),
    type: v.string(), // ema | cwbs | reach_ii | sdoh

    // Progress
    completed: v.boolean(),
    currentQuestion: v.number(),
    totalQuestions: v.number(),

    // Responses (for quick access)
    responses: v.any(), // question_id -> response_value

    // Scoring (calculated on completion)
    overallScore: v.optional(v.union(v.number(), v.null())), // null if all skipped
    domainScores: v.optional(v.any()),

    // Timestamps
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'type'])
    .index('by_completed', ['completed']) // Find in-progress assessments
    .index('by_completion_date', ['completedAt']),

  // ============================================================================
  // EXISTING TABLES (Unchanged)
  // ============================================================================

  // WELLNESS_SCORES
  wellnessScores: defineTable({
    userId: v.id('users'),
    overallScore: v.number(),
    assessmentSource: v.optional(v.string()),
    assessmentType: v.optional(v.string()),
    assessmentSessionId: v.optional(v.id('assessmentSessions')),
    confidence: v.optional(v.number()),
    band: v.optional(v.string()),
    pressureZones: v.array(v.string()),
    pressureZoneScores: v.any(),
    recordedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_recorded', ['userId', 'recordedAt'])
    .index('by_source', ['assessmentSource'])
    .index('by_session', ['assessmentSessionId']),

  // ASSESSMENT_RESPONSES
  assessmentResponses: defineTable({
    sessionId: v.id('assessmentSessions'),
    userId: v.id('users'),
    questionId: v.string(),
    questionText: v.optional(v.string()),
    responseValue: v.string(),
    score: v.optional(v.number()),
    respondedAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_user', ['userId'])
    .index('by_question', ['questionId']),

  // KNOWLEDGE_BASE
  knowledgeBase: defineTable({
    type: v.string(),
    category: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    content: v.optional(v.string()),
    pressureZones: v.array(v.string()),
    tags: v.array(v.string()),
    evidenceSource: v.optional(v.string()),
    evidenceLevel: v.optional(v.string()),
    effectivenessPct: v.optional(v.number()),
    deliveryFormat: v.optional(v.string()),
    deliveryData: v.any(),
    emailBlockType: v.optional(v.string()),
    tone: v.optional(v.string()),
    length: v.optional(v.string()),
    componentHint: v.optional(v.string()),
    emailSubject: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaHref: v.optional(v.string()),
    language: v.string(),
    culturalTags: v.array(v.string()),
    locationSpecific: v.boolean(),
    zipCodes: v.array(v.string()),
    usageCount: v.number(),
    avgRating: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    status: v.string(),
    createdBy: v.optional(v.string()),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    embedding: v.optional(v.array(v.number())),
  })
    .index('by_type', ['type'])
    .index('by_status', ['status'])
    .index('by_evidence', ['evidenceLevel'])
    .index('by_language', ['language'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['type', 'status', 'pressureZones'],
    })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['status', 'type', 'language'],
    }),

  // KNOWLEDGE_USAGE
  knowledgeUsage: defineTable({
    knowledgeId: v.id('knowledgeBase'),
    userId: v.optional(v.id('users')),
    pressureZones: v.array(v.string()),
    userQuery: v.optional(v.string()),
    searchMethod: v.optional(v.string()),
    delivered: v.boolean(),
    userAction: v.optional(v.string()),
    rating: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_knowledge', ['knowledgeId'])
    .index('by_user', ['userId'])
    .index('by_method', ['searchMethod'])
    .index('by_delivered', ['delivered']),

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
    updatedAt: v.number(),
  }).index('by_name', ['name']),

  programs: defineTable({
    providerId: v.id('providers'),
    name: v.string(),
    description: v.optional(v.string()),
    resourceCategory: v.array(v.string()),
    pressureZones: v.array(v.string()),
    fundingSource: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    languageSupport: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_provider', ['providerId']),

  facilities: defineTable({
    providerId: v.id('providers'),
    name: v.string(),
    phoneE164: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    geo: v.optional(v.object({ lat: v.number(), lon: v.number() })),
    hours: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_zip', ['zip']),

  serviceAreas: defineTable({
    programId: v.id('programs'),
    type: v.string(),
    geoCodes: v.array(v.string()),
    jurisdictionLevel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_program', ['programId']),

  resources: defineTable({
    programId: v.id('programs'),
    facilityId: v.optional(v.id('facilities')),
    primaryUrl: v.optional(v.string()),
    aggregatorSource: v.optional(v.string()),
    dataSourceType: v.string(),
    verificationStatus: v.string(),
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
    updatedAt: v.number(),
  })
    .index('by_program', ['programId'])
    .index('by_score', ['scoreRbi'])
    .index('by_verified', ['verificationStatus', 'lastVerifiedDate']),

  resourceVersions: defineTable({
    resourceId: v.id('resources'),
    snapshot: v.any(),
    changeSummary: v.optional(v.string()),
    actorId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_resource', ['resourceId'])
    .index('by_created_at', ['createdAt']),

  resourceVerifications: defineTable({
    resourceId: v.id('resources'),
    verificationStatus: v.string(),
    method: v.string(),
    verifiedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    reviewedAt: v.number(),
    nextReviewAt: v.optional(v.number()),
  })
    .index('by_resource', ['resourceId'])
    .index('by_status', ['verificationStatus'])
    .index('by_reviewed_at', ['reviewedAt']),

  resourceFeedback: defineTable({
    resourceId: v.id('resources'),
    userId: v.optional(v.id('users')),
    type: v.string(),
    band: v.optional(v.string()),
    pressureZones: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index('by_resource', ['resourceId'])
    .index('by_type', ['type'])
    .index('by_submitted', ['submittedAt']),

  // CONVERSATIONS
  conversations: defineTable({
    userId: v.id('users'),
    role: v.string(),
    text: v.string(),
    mode: v.string(),
    messageSid: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          name: v.string(),
          args: v.any(),
        })
      )
    ),
    agentName: v.optional(v.string()),
    latency: v.optional(v.number()),
    serviceTier: v.optional(v.string()),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })
    ),
    executionTrace: v.optional(
      v.object({
        totalMs: v.number(),
        phases: v.object({
          rateLimitMs: v.optional(v.number()),
          guardrailMs: v.optional(v.number()),
          contextBuildMs: v.optional(v.number()),
          agentMs: v.optional(v.number()),
          toolExecutionMs: v.optional(v.number()),
          persistenceMs: v.optional(v.number()),
        }),
        spans: v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            type: v.string(),
            startMs: v.number(),
            durationMs: v.number(),
            status: v.string(),
            metadata: v.optional(v.any()),
          })
        ),
        model: v.optional(v.string()),
        cacheHit: v.optional(v.boolean()),
        rateLimitRemaining: v.optional(
          v.object({
            smsUser: v.number(),
            smsGlobal: v.number(),
            openai: v.number(),
          })
        ),
        errors: v.optional(
          v.array(
            v.object({
              spanId: v.string(),
              message: v.string(),
              stack: v.optional(v.string()),
            })
          )
        ),
      })
    ),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_time', ['userId', 'timestamp'])
    .index('by_timestamp', ['timestamp'])
    .index('by_mode', ['mode'])
    .index('by_agent', ['agentName'])
    .index('by_service_tier', ['serviceTier'])
    .searchIndex('search_text', { searchField: 'text' }),

  // CONVERSATION_FEEDBACK
  conversationFeedback: defineTable({
    conversationId: v.id('conversations'),
    userId: v.id('users'),
    rating: v.number(),
    dimension: v.string(),
    feedbackText: v.optional(v.string()),
    source: v.string(),
    timestamp: v.number(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_user', ['userId'])
    .index('by_dimension', ['dimension'])
    .index('by_conversation', ['conversationId'])
    .index('by_source', ['source']),

  // EMAIL CONTACTS
  emailContacts: defineTable({
    email: v.string(),
    tags: v.array(v.string()),
    latestAssessmentScore: v.optional(v.number()),
    latestAssessmentBand: v.optional(v.string()),
    latestAssessmentDate: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    preferences: v.object({
      newsletter: v.boolean(),
      assessmentFollowup: v.boolean(),
      productUpdates: v.boolean(),
    }),
    resendContactId: v.optional(v.string()),
    resendAudienceId: v.optional(v.string()),
    lastSyncedToResend: v.optional(v.number()),
    emailsSentCount: v.number(),
    lastEmailSentAt: v.optional(v.number()),
    lastEmailOpenedAt: v.optional(v.number()),
    lastEmailClickedAt: v.optional(v.number()),
    status: v.string(),
    unsubscribedAt: v.optional(v.number()),
    unsubscribeReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_tags', ['tags'])
    .index('by_band', ['latestAssessmentBand'])
    .index('by_created', ['createdAt']),

  // NEWSLETTER SUBSCRIBERS (DEPRECATED)
  newsletterSubscribers: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
    unsubscribed: v.boolean(),
    unsubscribedAt: v.optional(v.number()),
    resubscribedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_subscribed', ['unsubscribed'])
    .index('by_subscribed_at', ['subscribedAt']),

  // ASSESSMENT RESULTS
  assessmentResults: defineTable({
    email: v.string(),
    responses: v.array(v.number()),
    totalScore: v.number(),
    band: v.string(),
    pressureZones: v.optional(v.any()),
    submittedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_submitted_at', ['submittedAt'])
    .index('by_band', ['band']),

  // EMAIL FAILURES
  emailFailures: defineTable({
    email: v.string(),
    error: v.string(),
    context: v.any(),
    failedAt: v.number(),
    retried: v.boolean(),
  })
    .index('by_email', ['email'])
    .index('by_failed_at', ['failedAt'])
    .index('by_retried', ['retried']),

  // TRIGGERS (RRULE scheduling)
  triggers: defineTable({
    userId: v.id('users'),
    recurrenceRule: v.string(),
    type: v.string(),
    message: v.string(),
    timezone: v.string(),
    enabled: v.boolean(),
    nextOccurrence: v.number(),
    createdAt: v.number(),
    lastTriggeredAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_next_occurrence', ['nextOccurrence', 'enabled'])
    .index('by_enabled_next', ['enabled', 'nextOccurrence'])
    .index('by_type', ['type'])
    .index('by_enabled', ['enabled'])
    .index('by_user_type', ['userId', 'type']),

  // MEMORIES (Working Memory System)
  memories: defineTable({
    userId: v.id('users'),
    content: v.string(),
    category: v.string(),
    importance: v.number(),
    createdAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
    accessCount: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
  })
    .index('by_user', ['userId'])
    .index('by_user_importance', ['userId', 'importance'])
    .index('by_category', ['category'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId'],
    }),

  // ALERTS (Engagement Watcher)
  alerts: defineTable({
    userId: v.id('users'),
    type: v.string(),
    pattern: v.string(),
    severity: v.string(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'type'])
    .index('by_severity', ['severity'])
    .index('by_created', ['createdAt']),

  // BATCH JOBS
  batchJobs: defineTable({
    batchId: v.string(),
    status: v.string(),
    endpoint: v.string(),
    inputFileId: v.optional(v.string()),
    outputFileId: v.optional(v.string()),
    errorFileId: v.optional(v.string()),
    requestCounts: v.object({
      total: v.number(),
      completed: v.number(),
      failed: v.number(),
    }),
    userIds: v.array(v.id('users')),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index('by_batch_id', ['batchId'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),

  // ETL WORKFLOWS
  etlWorkflows: defineTable({
    sessionId: v.string(),
    task: v.string(),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
    currentStep: v.string(),
    status: v.string(),
    trigger: v.optional(v.string()),
    sourcesCount: v.number(),
    extractedCount: v.number(),
    categorizedCount: v.optional(v.number()),
    validatedCount: v.number(),
    errorCount: v.number(),
    errors: v.array(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  })
    .index('by_session', ['sessionId'])
    .index('by_status', ['status'])
    .index('by_started', ['startedAt'])
    .index('by_task', ['task']),

  // ETL SOURCES
  etlSources: defineTable({
    workflowId: v.id('etlWorkflows'),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sourceType: v.string(),
    trustScore: v.number(),
    discoveredAt: v.number(),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_url', ['url'])
    .index('by_trust_score', ['trustScore']),

  // ETL EXTRACTED RECORDS
  etlExtractedRecords: defineTable({
    workflowId: v.id('etlWorkflows'),
    sourceId: v.id('etlSources'),
    title: v.string(),
    providerName: v.string(),
    phones: v.array(v.string()),
    website: v.string(),
    serviceTypes: v.array(v.string()),
    coverage: v.string(),
    state: v.optional(v.string()),
    county: v.optional(v.string()),
    zipCodes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    cost: v.optional(v.string()),
    extractedAt: v.number(),
    validationStatus: v.optional(v.string()),
    validationErrors: v.optional(v.array(v.string())),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_source', ['sourceId'])
    .index('by_validation_status', ['validationStatus']),

  // ETL VALIDATED RECORDS
  etlValidatedRecords: defineTable({
    workflowId: v.id('etlWorkflows'),
    extractedRecordId: v.optional(v.id('etlExtractedRecords')),
    title: v.string(),
    providerName: v.string(),
    phones: v.array(v.string()),
    website: v.string(),
    serviceTypes: v.array(v.string()),
    zones: v.array(v.string()),
    coverage: v.string(),
    state: v.optional(v.string()),
    county: v.optional(v.string()),
    zipCodes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    cost: v.optional(v.string()),
    qualityScore: v.number(),
    phoneValidation: v.object({
      valid: v.boolean(),
      normalized: v.array(v.string()),
    }),
    urlValidation: v.object({
      valid: v.boolean(),
      statusCode: v.optional(v.number()),
    }),
    validatedAt: v.number(),
    qaStatus: v.string(),
    qaReviewedAt: v.optional(v.number()),
    qaReviewedBy: v.optional(v.id('users')),
    qaFeedback: v.optional(v.string()),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_qa_status', ['qaStatus'])
    .index('by_quality_score', ['qualityScore'])
    .index('by_validated', ['validatedAt']),

  // FEEDBACK (Poke-style implicit feedback)
  feedback: defineTable({
    userId: v.id('users'),
    conversationId: v.optional(v.id('conversations')),
    signal: v.string(),
    value: v.number(),
    context: v.object({
      agentResponse: v.optional(v.string()),
      userMessage: v.optional(v.string()),
      toolUsed: v.optional(v.string()),
      timeSincePrevious: v.optional(v.number()),
      sessionLength: v.optional(v.number()),
    }),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_signal', ['signal'])
    .index('by_value', ['value'])
    .index('by_timestamp', ['timestamp'])
    .index('by_conversation', ['conversationId']),
})
