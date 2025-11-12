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
      agentName?: "main" | "assessment";
      budgetResult?: any;
      createdAt?: number;
      latencyMs?: number;
      policyBundle?: string;
      threadId?: Id<"threads">;
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
      definitionId: "ema" | "cwbs" | "reach2" | "sdoh";
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
  events: {
    document: {
      payload: any;
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
        | "check_in.completed";
      userId: Id<"users">;
      _id: Id<"events">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "payload" | "type" | "userId";
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
      type: "crisis" | "false_positive" | "dv_hint";
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
  scores: {
    document: {
      answeredRatio: number;
      assessmentId: Id<"assessments">;
      band: "very_low" | "low" | "moderate" | "high";
      confidence: number;
      gcBurnout: number;
      instrument: "ema" | "cwbs" | "reach2" | "sdoh";
      rawComposite: number;
      reach2Domains?: {
        burden?: number;
        depression?: number;
        problemBehaviors?: number;
        safety?: number;
        selfCare?: number;
        socialSupport?: number;
      };
      userId: Id<"users">;
      zones: {
        zone_emotional?: number;
        zone_financial?: number;
        zone_physical?: number;
        zone_social?: number;
        zone_time?: number;
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
      | "reach2Domains"
      | "reach2Domains.burden"
      | "reach2Domains.depression"
      | "reach2Domains.problemBehaviors"
      | "reach2Domains.safety"
      | "reach2Domains.selfCare"
      | "reach2Domains.socialSupport"
      | "userId"
      | "zones"
      | "zones.zone_emotional"
      | "zones.zone_financial"
      | "zones.zone_physical"
      | "zones.zone_social"
      | "zones.zone_time";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
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
  subscriptions: {
    document: {
      canceledAt?: number;
      currentPeriodEnd: number;
      gracePeriodEndsAt?: number;
      planId: "free" | "plus" | "enterprise";
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
  users: {
    document: {
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        postalCode?: string;
        state?: string;
      };
      channel: "sms" | "email" | "web";
      consent?: { emergency: boolean; marketing: boolean };
      email?: string;
      engagementFlags?: {
        escalationLevel?: "none" | "day5" | "day7" | "day14";
        lastNudgeDate?: number;
        nudgeCount?: number;
      };
      externalId: string;
      lastEngagementDate?: number;
      locale: string;
      metadata?: {
        careRecipient?: string;
        checkInFrequency?: "daily" | "weekly";
        checkInTime?: string;
        contextUpdatedAt?: number;
        convex?: any;
        enrichedContext?: string;
        firstAssessmentCompletedAt?: number;
        firstBand?: string;
        firstResourceSearchedAt?: number;
        firstScore?: number;
        gcBurnout?: number;
        onboardingCompletedAt?: number;
        onboardingMilestones?: Array<{
          completedAt: number;
          milestone: string;
        }>;
        onboardingStage?: string;
        primaryStressor?: string;
        threadId?: string;
        timezone?: string;
        zipCode?: string;
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
      | "address.postalCode"
      | "address.state"
      | "channel"
      | "consent"
      | "consent.emergency"
      | "consent.marketing"
      | "email"
      | "engagementFlags"
      | "engagementFlags.escalationLevel"
      | "engagementFlags.lastNudgeDate"
      | "engagementFlags.nudgeCount"
      | "externalId"
      | "lastEngagementDate"
      | "locale"
      | "metadata"
      | "metadata.careRecipient"
      | "metadata.checkInFrequency"
      | "metadata.checkInTime"
      | "metadata.contextUpdatedAt"
      | "metadata.convex"
      | "metadata.enrichedContext"
      | "metadata.firstAssessmentCompletedAt"
      | "metadata.firstBand"
      | "metadata.firstResourceSearchedAt"
      | "metadata.firstScore"
      | "metadata.gcBurnout"
      | "metadata.onboardingCompletedAt"
      | "metadata.onboardingMilestones"
      | "metadata.onboardingStage"
      | "metadata.primaryStressor"
      | "metadata.threadId"
      | "metadata.timezone"
      | "metadata.zipCode"
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
