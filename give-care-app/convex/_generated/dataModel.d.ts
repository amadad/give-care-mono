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
  agent_decisions: {
    document: {
      alternatives?: Array<string>;
      confidence?: number;
      inputText: string;
      reasoning?: string;
      routingDecision: string;
      traceId: string;
      userId: Id<"users">;
      _id: Id<"agent_decisions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "alternatives"
      | "confidence"
      | "inputText"
      | "reasoning"
      | "routingDecision"
      | "traceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_decision: ["routingDecision", "_creationTime"];
      by_trace: ["traceId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  agent_runs: {
    document: {
      agent: string;
      budgetResult: {
        toolCalls: number;
        usedInputTokens: number;
        usedOutputTokens: number;
      };
      latencyMs: number;
      policyBundle: string;
      timeout?: boolean;
      traceId: string;
      userId: Id<"users">;
      _id: Id<"agent_runs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agent"
      | "budgetResult"
      | "budgetResult.toolCalls"
      | "budgetResult.usedInputTokens"
      | "budgetResult.usedOutputTokens"
      | "latencyMs"
      | "policyBundle"
      | "timeout"
      | "traceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_trace: ["traceId", "_creationTime"];
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
      payload?: any;
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
      | "payload"
      | "severity"
      | "status"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_type: ["type", "severity", "_creationTime"];
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
      by_user_definition: ["userId", "definitionId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  assessments: {
    document: {
      answers: Array<{ questionId: string; value: number }>;
      completedAt: number;
      definitionId: string;
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
      | "userId"
      | "version";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_definition: ["userId", "definitionId", "_creationTime"];
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
  emails: {
    document: {
      status: string;
      subject: string;
      to: string;
      traceId: string;
      userId?: Id<"users">;
      _id: Id<"emails">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "status"
      | "subject"
      | "to"
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
  guardrail_events: {
    document: {
      action: string;
      context?: any;
      ruleId: string;
      traceId: string;
      userId?: Id<"users">;
      _id: Id<"guardrail_events">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "action"
      | "context"
      | "ruleId"
      | "traceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_rule: ["ruleId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  inbound_receipts: {
    document: {
      messageSid: string;
      _id: Id<"inbound_receipts">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "messageSid";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_sid: ["messageSid", "_creationTime"];
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
      evidenceLevel: string;
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
      agentName?: string;
      billingPeriod: string;
      model: string;
      provider: string;
      providerMetadata?: any;
      threadId?: string;
      traceId?: string;
      usage: any;
      userId?: Id<"users">;
      _id: Id<"llm_usage">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agentName"
      | "billingPeriod"
      | "model"
      | "provider"
      | "providerMetadata"
      | "threadId"
      | "traceId"
      | "usage"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_period: ["billingPeriod", "_creationTime"];
      by_trace: ["traceId", "_creationTime"];
      by_user_period: ["userId", "billingPeriod", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  memories: {
    document: {
      category: string;
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
      by_user_category: ["userId", "category", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  metrics_burnout_distribution: {
    document: {
      bucket: string;
      count: number;
      updatedAt: number;
      _id: Id<"metrics_burnout_distribution">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "bucket" | "count" | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_bucket: ["bucket", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  metrics_daily: {
    document: {
      activeUsers: number;
      avgBurnoutScore: number;
      avgResponseLatencyMs: number;
      crisisAlerts: number;
      date: string;
      inboundMessages?: number;
      newUsers: number;
      outboundMessages?: number;
      p95ResponseLatencyMs: number;
      totalMessages: number;
      totalUsers: number;
      _id: Id<"metrics_daily">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "activeUsers"
      | "avgBurnoutScore"
      | "avgResponseLatencyMs"
      | "crisisAlerts"
      | "date"
      | "inboundMessages"
      | "newUsers"
      | "outboundMessages"
      | "p95ResponseLatencyMs"
      | "totalMessages"
      | "totalUsers";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_date: ["date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  metrics_journey_funnel: {
    document: {
      active: number;
      churned: number;
      crisis: number;
      maintenance: number;
      onboarding: number;
      updatedAt: number;
      _id: Id<"metrics_journey_funnel">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "active"
      | "churned"
      | "crisis"
      | "maintenance"
      | "onboarding"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  metrics_subscriptions: {
    document: {
      active: number;
      canceled: number;
      enterprise: number;
      free: number;
      pastDue: number;
      plus: number;
      total: number;
      trialing: number;
      updatedAt: number;
      _id: Id<"metrics_subscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "active"
      | "canceled"
      | "enterprise"
      | "free"
      | "pastDue"
      | "plus"
      | "total"
      | "trialing"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  profiles: {
    document: {
      demographics?: {
        age?: number;
        education?: string;
        ethnicity?: string;
        gender?: string;
      };
      preferences?: {
        notificationFrequency?: string;
        preferredCheckInHour?: number;
        preferredContactTime?: string;
        timezone?: string;
      };
      userId: Id<"users">;
      _id: Id<"profiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "demographics"
      | "demographics.age"
      | "demographics.education"
      | "demographics.ethnicity"
      | "demographics.gender"
      | "preferences"
      | "preferences.notificationFrequency"
      | "preferences.preferredCheckInHour"
      | "preferences.preferredContactTime"
      | "preferences.timezone"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resource_cache: {
    document: {
      category: string;
      createdAt: number;
      expiresAt?: number;
      results?: any;
      userId?: Id<"users">;
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
      | "results"
      | "userId"
      | "zip";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category_zip: ["category", "zip", "createdAt", "_creationTime"];
      by_expiresAt: ["expiresAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scores: {
    document: {
      assessmentId: Id<"assessments">;
      band: string;
      composite: number;
      confidence: number;
      userId: Id<"users">;
      zones: {
        emotional: number;
        financial?: number;
        physical: number;
        social: number;
        time: number;
      };
      _id: Id<"scores">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "assessmentId"
      | "band"
      | "composite"
      | "confidence"
      | "userId"
      | "zones"
      | "zones.emotional"
      | "zones.financial"
      | "zones.physical"
      | "zones.social"
      | "zones.time";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  subscriptions: {
    document: {
      currentPeriodEnd: number;
      planId: string;
      status: string;
      stripeCustomerId: string;
      userId: Id<"users">;
      _id: Id<"subscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "currentPeriodEnd"
      | "planId"
      | "status"
      | "stripeCustomerId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_customer: ["stripeCustomerId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  tool_calls: {
    document: {
      agent: string;
      args?: any;
      cost: number;
      durationMs: number;
      name: string;
      success: boolean;
      traceId: string;
      userId: Id<"users">;
      _id: Id<"tool_calls">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agent"
      | "args"
      | "cost"
      | "durationMs"
      | "name"
      | "success"
      | "traceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_trace: ["traceId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
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
      breakdown: { byAgent?: any; byModel?: any };
      status: "pending" | "paid" | "failed" | "waived";
      stripeInvoiceId?: string;
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
      | "breakdown"
      | "breakdown.byAgent"
      | "breakdown.byModel"
      | "status"
      | "stripeInvoiceId"
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
        line2?: string;
        postalCode?: string;
        state?: string;
      };
      channel: "sms" | "email" | "web";
      consent?: { emergency: boolean; marketing: boolean };
      email?: string;
      externalId: string;
      locale: string;
      metadata?:
        | {
            contextUpdatedAt?: number;
            convex?: { threadId?: string; userId?: Id<"users"> };
            enrichedContext?: string;
            journeyPhase?: string;
            pressureZones?: Array<string>;
            profile?: {
              careRecipientName?: string;
              clinicalCoordination?: "good" | "poor";
              communityAccess?: "good" | "poor";
              financialStatus?: "struggling" | "stable" | "comfortable";
              firstName?: string;
              housingStability?: "stable" | "at_risk";
              preferredCheckInHour?: number;
              relationship?: string;
              transportationReliability?: "reliable" | "unreliable";
              zipCode?: string;
            };
            timezone?: string;
            totalInteractionCount?: number;
            wellnessScore?: number;
          }
        | {
            contextUpdatedAt?: number;
            convex?: { threadId?: string; userId?: Id<"users"> };
            enrichedContext?: string;
            journeyPhase?: string;
            pressureZones?: Array<string>;
            profile?: {
              careRecipientName?: string;
              clinicalCoordination?: "good" | "poor";
              communityAccess?: "good" | "poor";
              financialStatus?: "struggling" | "stable" | "comfortable";
              firstName?: string;
              housingStability?: "stable" | "at_risk";
              preferredCheckInHour?: number;
              relationship?: string;
              transportationReliability?: "reliable" | "unreliable";
              zipCode?: string;
            };
            threadId?: string;
            timezone?: string;
            totalInteractionCount?: number;
            wellnessScore?: number;
          };
      name?: string;
      phone?: string;
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
      | "address.line2"
      | "address.postalCode"
      | "address.state"
      | "channel"
      | "consent"
      | "consent.emergency"
      | "consent.marketing"
      | "email"
      | "externalId"
      | "locale"
      | "metadata"
      | "metadata.contextUpdatedAt"
      | "metadata.convex"
      | "metadata.convex.threadId"
      | "metadata.convex.userId"
      | "metadata.enrichedContext"
      | "metadata.journeyPhase"
      | "metadata.pressureZones"
      | "metadata.profile"
      | "metadata.profile.careRecipientName"
      | "metadata.profile.clinicalCoordination"
      | "metadata.profile.communityAccess"
      | "metadata.profile.financialStatus"
      | "metadata.profile.firstName"
      | "metadata.profile.housingStability"
      | "metadata.profile.preferredCheckInHour"
      | "metadata.profile.relationship"
      | "metadata.profile.transportationReliability"
      | "metadata.profile.zipCode"
      | "metadata.threadId"
      | "metadata.timezone"
      | "metadata.totalInteractionCount"
      | "metadata.wellnessScore"
      | "name"
      | "phone";
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
      cursor?: Id<"users">;
      lastRun: number;
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
