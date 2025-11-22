/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
  AnyDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */

export type DataModel = {
  agent_runs: {
    document: {
      agent?: string;
      agentName?: "main" | "assessment" | "crisis";
      budgetResult?: any;
      createdAt?: number;
      latencyMs?: number;
      policyBundle?: string;
      threadId?: string;
      toolCalls?: Array<any>;
      traceId?: string;
      userId: Id<"users">;
      _id: Id<"agent_runs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agent"
      | "agentName"
      | "budgetResult"
      | "createdAt"
      | "latencyMs"
      | "policyBundle"
      | "threadId"
      | "toolCalls"
      | "traceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  alerts: {
    document: {
      channel: "sms" | "email";
      context: any;
      message: string;
      severity: "low" | "medium" | "high" | "critical";
      status: "pending" | "processed";
      type: string;
      userId: Id<"users">;
      _id: Id<"alerts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "channel"
      | "context"
      | "message"
      | "severity"
      | "status"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_severity: ["severity", "_creationTime"];
      by_type: ["type", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  assessment_sessions: {
    document: {
      answers: Array<{ questionId: string; value: number }>;
      channel: "sms" | "web";
      definitionId: string;
      questionIndex: number;
      status: "active" | "completed";
      userId: Id<"users">;
      _id: Id<"assessment_sessions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "answers"
      | "channel"
      | "definitionId"
      | "questionIndex"
      | "status"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user_and_type: ["userId", "definitionId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  assessments: {
    document: {
      answers: Array<{ questionId: string; value: number }>;
      completedAt: number;
      definitionId: "ema" | "sdoh";
      rawScores?: any;
      userId: Id<"users">;
      version: string;
      _id: Id<"assessments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "answers"
      | "completedAt"
      | "definitionId"
      | "rawScores"
      | "userId"
      | "version";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_and_type: ["userId", "definitionId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authAccounts: {
    document: {
      emailVerified?: string;
      phoneVerified?: string;
      provider: string;
      providerAccountId: string;
      secret?: string;
      userId: Id<"users">;
      _id: Id<"authAccounts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "emailVerified"
      | "phoneVerified"
      | "provider"
      | "providerAccountId"
      | "secret"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      providerAndAccountId: ["provider", "providerAccountId", "_creationTime"];
      userIdAndProvider: ["userId", "provider", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authRateLimits: {
    document: {
      attemptsLeft: number;
      identifier: string;
      lastAttemptTime: number;
      _id: Id<"authRateLimits">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "attemptsLeft"
      | "identifier"
      | "lastAttemptTime";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      identifier: ["identifier", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authRefreshTokens: {
    document: {
      expirationTime: number;
      firstUsedTime?: number;
      parentRefreshTokenId?: Id<"authRefreshTokens">;
      sessionId: Id<"authSessions">;
      _id: Id<"authRefreshTokens">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "expirationTime"
      | "firstUsedTime"
      | "parentRefreshTokenId"
      | "sessionId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      sessionId: ["sessionId", "_creationTime"];
      sessionIdAndParentRefreshTokenId: [
        "sessionId",
        "parentRefreshTokenId",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authSessions: {
    document: {
      expirationTime: number;
      userId: Id<"users">;
      _id: Id<"authSessions">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "expirationTime" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authVerificationCodes: {
    document: {
      accountId: Id<"authAccounts">;
      code: string;
      emailVerified?: string;
      expirationTime: number;
      phoneVerified?: string;
      provider: string;
      verifier?: string;
      _id: Id<"authVerificationCodes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accountId"
      | "code"
      | "emailVerified"
      | "expirationTime"
      | "phoneVerified"
      | "provider"
      | "verifier";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      accountId: ["accountId", "_creationTime"];
      code: ["code", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  authVerifiers: {
    document: {
      sessionId?: Id<"authSessions">;
      signature?: string;
      _id: Id<"authVerifiers">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "sessionId" | "signature";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      signature: ["signature", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  billing_events: {
    document: {
      data: any;
      stripeEventId: string;
      type: string;
      userId?: Id<"users">;
      _id: Id<"billing_events">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "data"
      | "stripeEventId"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_event: ["stripeEventId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  conversation_feedback: {
    document: {
      agentRunId?: Id<"agent_runs">;
      alertId?: Id<"alerts">;
      createdAt: number;
      helpful: boolean;
      reason?: string;
      userId: Id<"users">;
      _id: Id<"conversation_feedback">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agentRunId"
      | "alertId"
      | "createdAt"
      | "helpful"
      | "reason"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_alert: ["alertId", "_creationTime"];
      by_helpful: ["helpful", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  crisis_feedback: {
    document: {
      alertId: Id<"alerts">;
      connectedWith988?: boolean;
      createdAt: number;
      followUpResponse?: string;
      userId: Id<"users">;
      wasHelpful?: boolean;
      _id: Id<"crisis_feedback">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "alertId"
      | "connectedWith988"
      | "createdAt"
      | "followUpResponse"
      | "userId"
      | "wasHelpful";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_alert: ["alertId", "_creationTime"];
      by_connected: ["connectedWith988", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  entitlements: {
    document: {
      active: boolean;
      expiresAt?: number;
      feature: string;
      userId: Id<"users">;
      _id: Id<"entitlements">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "active"
      | "expiresAt"
      | "feature"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user_feature: ["userId", "feature", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  events: {
    document: {
      payload:
        | { helpful: boolean; resourceId: string; timestamp: number }
        | { query?: string; timestamp?: number; zip?: string; zone?: string }
        | {
            band?: string;
            completedAt?: number;
            definitionId?: string;
            score?: number;
          }
        | { fields?: Array<string>; timestamp?: number }
        | {
            category?: string;
            importance?: number;
            memoryId?: Id<"memories">;
            timestamp?: number;
          }
        | {
            assessmentId?: Id<"assessments">;
            band?: string;
            completedAt?: number;
            gcBurnout?: number;
          }
        | { context?: string; reason: "missing_phone"; timestamp: number };
      type:
        | "intervention.try"
        | "intervention.success"
        | "intervention.skip"
        | "resource.open"
        | "resource.search"
        | "assessment.completed"
        | "assessment.started"
        | "profile.updated"
        | "memory.recorded"
        | "check_in.completed"
        | "sms.missing_phone";
      userId: Id<"users">;
      _id: Id<"events">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "payload"
      | "payload.assessmentId"
      | "payload.band"
      | "payload.category"
      | "payload.completedAt"
      | "payload.context"
      | "payload.definitionId"
      | "payload.fields"
      | "payload.gcBurnout"
      | "payload.helpful"
      | "payload.importance"
      | "payload.memoryId"
      | "payload.query"
      | "payload.reason"
      | "payload.resourceId"
      | "payload.score"
      | "payload.timestamp"
      | "payload.zip"
      | "payload.zone"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_type: ["type", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  guardrail_events: {
    document: {
      context: any;
      createdAt: number;
      severity: "low" | "medium" | "high";
      type:
        | "crisis"
        | "false_positive"
        | "dv_hint"
        | "crisis_followup_sent"
        | "stress_spike_followup_sent"
        | "reassurance_loop"
        | "self_sacrifice";
      userId?: Id<"users">;
      _id: Id<"guardrail_events">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "context"
      | "createdAt"
      | "severity"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_severity: ["severity", "_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_createdAt: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  inbound_receipts: {
    document: {
      messageSid: string;
      receivedAt?: number;
      userId?: Id<"users">;
      _id: Id<"inbound_receipts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "messageSid"
      | "receivedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_messageSid: ["messageSid", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  intervention_events: {
    document: {
      interventionId: string;
      metadata?: any;
      status: string;
      userId: Id<"users">;
      _id: Id<"intervention_events">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "interventionId"
      | "metadata"
      | "status"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  intervention_zones: {
    document: {
      interventionId: Id<"interventions">;
      zone: string;
      _id: Id<"intervention_zones">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "interventionId" | "zone";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_intervention: ["interventionId", "_creationTime"];
      by_zone: ["zone", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  interventions: {
    document: {
      category: string;
      content: string;
      description: string;
      duration: string;
      evidenceLevel: "high" | "moderate" | "low";
      tags: Array<string>;
      targetZones: Array<string>;
      title: string;
      _id: Id<"interventions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "content"
      | "description"
      | "duration"
      | "evidenceLevel"
      | "tags"
      | "targetZones"
      | "title";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_evidence: ["evidenceLevel", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  llm_usage: {
    document: {
      agentName?: "main" | "assessment" | "crisis";
      completionTokens: number;
      createdAt: number;
      model: string;
      promptTokens: number;
      provider: string;
      totalTokens: number;
      userId?: Id<"users">;
      _id: Id<"llm_usage">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agentName"
      | "completionTokens"
      | "createdAt"
      | "model"
      | "promptTokens"
      | "provider"
      | "totalTokens"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_created: ["createdAt", "_creationTime"];
      by_user_created: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  memories: {
    document: {
      category:
        | "care_routine"
        | "preference"
        | "intervention_result"
        | "crisis_trigger"
        | "family_health";
      content: string;
      importance: number;
      userId: Id<"users">;
      _id: Id<"memories">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "content"
      | "importance"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user_and_importance: ["userId", "importance", "_creationTime"];
      by_user_category: ["userId", "category", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  prompt_versions: {
    document: {
      createdAt: number;
      name: string;
      prompt: string;
      version: string;
      _id: Id<"prompt_versions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "name"
      | "prompt"
      | "version";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name_version: ["name", "version", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resource_cache: {
    document: {
      category: string;
      createdAt: number;
      expiresAt?: number;
      placeIds?: Array<string>;
      results?: any;
      zip: string;
      _id: Id<"resource_cache">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "createdAt"
      | "expiresAt"
      | "placeIds"
      | "results"
      | "zip";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_expiresAt: ["expiresAt", "_creationTime"];
      by_zip_cat: ["zip", "category", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  score_history: {
    document: {
      newScore: number;
      oldScore: number;
      timestamp: number;
      trigger: "ema" | "sdoh" | "observation";
      userId: Id<"users">;
      zones: {
        P1?: number;
        P2?: number;
        P3?: number;
        P4?: number;
        P5?: number;
        P6?: number;
      };
      _id: Id<"score_history">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "newScore"
      | "oldScore"
      | "timestamp"
      | "trigger"
      | "userId"
      | "zones"
      | "zones.P1"
      | "zones.P2"
      | "zones.P3"
      | "zones.P4"
      | "zones.P5"
      | "zones.P6";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scores: {
    document: {
      answeredRatio: number;
      assessmentId: Id<"assessments">;
      band: "very_low" | "low" | "moderate" | "high";
      confidence: number;
      gcBurnout: number;
      instrument: "ema" | "sdoh";
      rawComposite: number;
      userId: Id<"users">;
      zones: {
        P1?: number;
        P2?: number;
        P3?: number;
        P4?: number;
        P5?: number;
        P6?: number;
      };
      _id: Id<"scores">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "answeredRatio"
      | "assessmentId"
      | "band"
      | "confidence"
      | "gcBurnout"
      | "instrument"
      | "rawComposite"
      | "userId"
      | "zones"
      | "zones.P1"
      | "zones.P2"
      | "zones.P3"
      | "zones.P4"
      | "zones.P5"
      | "zones.P6";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_and_assessment: ["userId", "assessmentId", "_creationTime"];
      by_user_and_type: ["userId", "instrument", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scores_composite: {
    document: {
      band: string;
      gcBurnout: number;
      userId: Id<"users">;
      _id: Id<"scores_composite">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "band" | "gcBurnout" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  session_metrics: {
    document: {
      assessmentCompleted?: boolean;
      avgResponseTimeMs?: number;
      crisisDetected?: boolean;
      endedAt?: number;
      messageCount: number;
      startedAt: number;
      threadId?: string;
      userId: Id<"users">;
      userReturnedNext24h?: boolean;
      _id: Id<"session_metrics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "assessmentCompleted"
      | "avgResponseTimeMs"
      | "crisisDetected"
      | "endedAt"
      | "messageCount"
      | "startedAt"
      | "threadId"
      | "userId"
      | "userReturnedNext24h";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_started: ["startedAt", "_creationTime"];
      by_thread: ["threadId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  subscriptions: {
    document: {
      canceledAt?: number;
      currentPeriodEnd: number;
      gracePeriodEndsAt?: number;
      planId: "monthly" | "annual";
      status: "active" | "canceled" | "past_due";
      stripeCustomerId: string;
      userId: Id<"users">;
      _id: Id<"subscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "canceledAt"
      | "currentPeriodEnd"
      | "gracePeriodEndsAt"
      | "planId"
      | "status"
      | "stripeCustomerId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_customer: ["stripeCustomerId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  tool_calls: {
    document: {
      agentName?: string;
      cost?: number;
      createdAt: number;
      durationMs?: number;
      name: string;
      success: boolean;
      userId?: Id<"users">;
      _id: Id<"tool_calls">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agentName"
      | "cost"
      | "createdAt"
      | "durationMs"
      | "name"
      | "success"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
      by_user_created: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  triggers: {
    document: {
      nextRun: number;
      payload: any;
      rrule: string;
      status: "active" | "paused";
      timezone: string;
      type: "recurring" | "one_off";
      userExternalId: string;
      userId: Id<"users">;
      _id: Id<"triggers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "nextRun"
      | "payload"
      | "rrule"
      | "status"
      | "timezone"
      | "type"
      | "userExternalId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_nextRun: ["nextRun", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  usage_invoices: {
    document: {
      billingPeriod: string;
      status: "open" | "paid" | "void";
      totalCost: number;
      totalTokens: number;
      userId: Id<"users">;
      _id: Id<"usage_invoices">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "billingPeriod"
      | "status"
      | "totalCost"
      | "totalTokens"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user_period: ["userId", "billingPeriod", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  users: {
    document: {
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        postalCode?: string;
        state?: string;
      };
      channel?: "sms" | "email" | "web";
      consent?: { emergency: boolean; marketing: boolean };
      emaEnabled?: boolean;
      email?: string;
      externalId: string;
      gcSdohScore?: number;
      lastEMA?: number;
      lastEngagementDate?: number;
      lastSDOH?: number;
      locale?: string;
      metadata?: {
        awaitingCrisisFollowUp?: { alertId: Id<"alerts">; timestamp: number };
        careRecipient?: string;
        careRecipientName?: string;
        checkInFrequency?: "daily" | "weekly";
        checkInTime?: string;
        contextUpdatedAt?: number;
        convex?: any;
        enrichedContext?: string;
        firstAssessmentCompletedAt?: number;
        firstBand?: string;
        firstName?: string;
        firstResourceSearchedAt?: number;
        firstScore?: number;
        gcBurnout?: number;
        gcSdohScore?: number;
        journeyPhase?: string;
        lastAssessmentScore?: number;
        lastEMA?: number;
        lastSDOH?: number;
        lastSpikeFollowUpAt?: number;
        latitude?: number;
        longitude?: number;
        onboardingCompletedAt?: number;
        onboardingMilestones?: Array<{
          completedAt: number;
          milestone: string;
        }>;
        onboardingStage?: string;
        primaryStressor?: string;
        proactiveOk?: boolean;
        profile?: {
          careRecipientName?: string;
          firstName?: string;
          relationship?: string;
        };
        reassuranceLoopFlag?: boolean;
        riskLevel?: "low" | "moderate" | "high" | "crisis";
        snoozeUntil?: number;
        threadId?: string;
        timezone?: string;
        totalInteractionCount?: number;
        zipCode?: string;
        zones?: {
          P1?: number;
          P2?: number;
          P3?: number;
          P4?: number;
          P5?: number;
          P6?: number;
        };
      };
      name?: string;
      phone?: string;
      riskLevel?: "low" | "moderate" | "high" | "crisis";
      zipCode?: string;
      zones?: {
        P1?: number;
        P2?: number;
        P3?: number;
        P4?: number;
        P5?: number;
        P6?: number;
      };
      _id: Id<"users">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "address"
      | "address.city"
      | "address.country"
      | "address.line1"
      | "address.postalCode"
      | "address.state"
      | "channel"
      | "consent"
      | "consent.emergency"
      | "consent.marketing"
      | "emaEnabled"
      | "email"
      | "externalId"
      | "gcSdohScore"
      | "lastEMA"
      | "lastEngagementDate"
      | "lastSDOH"
      | "locale"
      | "metadata"
      | "metadata.awaitingCrisisFollowUp"
      | "metadata.awaitingCrisisFollowUp.alertId"
      | "metadata.awaitingCrisisFollowUp.timestamp"
      | "metadata.careRecipient"
      | "metadata.careRecipientName"
      | "metadata.checkInFrequency"
      | "metadata.checkInTime"
      | "metadata.contextUpdatedAt"
      | "metadata.convex"
      | "metadata.enrichedContext"
      | "metadata.firstAssessmentCompletedAt"
      | "metadata.firstBand"
      | "metadata.firstName"
      | "metadata.firstResourceSearchedAt"
      | "metadata.firstScore"
      | "metadata.gcBurnout"
      | "metadata.gcSdohScore"
      | "metadata.journeyPhase"
      | "metadata.lastAssessmentScore"
      | "metadata.lastEMA"
      | "metadata.lastSDOH"
      | "metadata.lastSpikeFollowUpAt"
      | "metadata.latitude"
      | "metadata.longitude"
      | "metadata.onboardingCompletedAt"
      | "metadata.onboardingMilestones"
      | "metadata.onboardingStage"
      | "metadata.primaryStressor"
      | "metadata.proactiveOk"
      | "metadata.profile"
      | "metadata.profile.careRecipientName"
      | "metadata.profile.firstName"
      | "metadata.profile.relationship"
      | "metadata.reassuranceLoopFlag"
      | "metadata.riskLevel"
      | "metadata.snoozeUntil"
      | "metadata.threadId"
      | "metadata.timezone"
      | "metadata.totalInteractionCount"
      | "metadata.zipCode"
      | "metadata.zones"
      | "metadata.zones.P1"
      | "metadata.zones.P2"
      | "metadata.zones.P3"
      | "metadata.zones.P4"
      | "metadata.zones.P5"
      | "metadata.zones.P6"
      | "name"
      | "phone"
      | "riskLevel"
      | "zipCode"
      | "zones"
      | "zones.P1"
      | "zones.P2"
      | "zones.P3"
      | "zones.P4"
      | "zones.P5"
      | "zones.P6";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_externalId: ["externalId", "_creationTime"];
      by_phone: ["phone", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  watcher_state: {
    document: {
      cursor?: any;
      lastRun?: number;
      watcherName: string;
      _id: Id<"watcher_state">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "cursor" | "lastRun" | "watcherName";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_watcher: ["watcherName", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
};

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;
