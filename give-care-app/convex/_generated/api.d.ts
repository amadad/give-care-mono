/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as etl from "../etl.js";
import type * as functions_admin from "../functions/admin.js";
import type * as functions_analytics from "../functions/analytics.js";
import type * as functions_assessmentResults from "../functions/assessmentResults.js";
import type * as functions_assessments from "../functions/assessments.js";
import type * as functions_cleanup from "../functions/cleanup.js";
import type * as functions_conversations from "../functions/conversations.js";
import type * as functions_embeddings from "../functions/embeddings.js";
import type * as functions_memories from "../functions/memories.js";
import type * as functions_newsletter from "../functions/newsletter.js";
import type * as functions_rateLimitMonitoring from "../functions/rateLimitMonitoring.js";
import type * as functions_resources from "../functions/resources.js";
import type * as functions_resourcesGeoLite from "../functions/resourcesGeoLite.js";
import type * as functions_scheduling from "../functions/scheduling.js";
import type * as functions_seedKnowledgeBase from "../functions/seedKnowledgeBase.js";
import type * as functions_seedResources from "../functions/seedResources.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_vectorSearch from "../functions/vectorSearch.js";
import type * as functions_wellness from "../functions/wellness.js";
import type * as http from "../http.js";
import type * as ingestion_adapters_eldercareLocatorAdapter from "../ingestion/adapters/eldercareLocatorAdapter.js";
import type * as ingestion_adapters_nysOaaAdapter from "../ingestion/adapters/nysOaaAdapter.js";
import type * as ingestion_adapters_openReferralAdapter from "../ingestion/adapters/openReferralAdapter.js";
import type * as ingestion_eldercare_scraper from "../ingestion/eldercare_scraper.js";
import type * as ingestion_federalPrograms from "../ingestion/federalPrograms.js";
import type * as ingestion_federalProgramsSeed from "../ingestion/federalProgramsSeed.js";
import type * as ingestion_importResources from "../ingestion/importResources.js";
import type * as ingestion_nys_oaa_parser from "../ingestion/nys_oaa_parser.js";
import type * as ingestion_nys_oaa_parser_verbose from "../ingestion/nys_oaa_parser_verbose.js";
import type * as ingestion_shared_load from "../ingestion/shared/load.js";
import type * as ingestion_shared_normalize from "../ingestion/shared/normalize.js";
import type * as ingestion_shared_registry from "../ingestion/shared/registry.js";
import type * as ingestion_shared_scoring from "../ingestion/shared/scoring.js";
import type * as ingestion_shared_types from "../ingestion/shared/types.js";
import type * as ingestion_shared_validation from "../ingestion/shared/validation.js";
import type * as resources_matchResources from "../resources/matchResources.js";
import type * as services_MessageHandler from "../services/MessageHandler.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as summarization from "../summarization.js";
import type * as summarizationActions from "../summarizationActions.js";
import type * as test from "../test.js";
import type * as triggers from "../triggers.js";
import type * as twilio from "../twilio.js";
import type * as watchers from "../watchers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  etl: typeof etl;
  "functions/admin": typeof functions_admin;
  "functions/analytics": typeof functions_analytics;
  "functions/assessmentResults": typeof functions_assessmentResults;
  "functions/assessments": typeof functions_assessments;
  "functions/cleanup": typeof functions_cleanup;
  "functions/conversations": typeof functions_conversations;
  "functions/embeddings": typeof functions_embeddings;
  "functions/memories": typeof functions_memories;
  "functions/newsletter": typeof functions_newsletter;
  "functions/rateLimitMonitoring": typeof functions_rateLimitMonitoring;
  "functions/resources": typeof functions_resources;
  "functions/resourcesGeoLite": typeof functions_resourcesGeoLite;
  "functions/scheduling": typeof functions_scheduling;
  "functions/seedKnowledgeBase": typeof functions_seedKnowledgeBase;
  "functions/seedResources": typeof functions_seedResources;
  "functions/users": typeof functions_users;
  "functions/vectorSearch": typeof functions_vectorSearch;
  "functions/wellness": typeof functions_wellness;
  http: typeof http;
  "ingestion/adapters/eldercareLocatorAdapter": typeof ingestion_adapters_eldercareLocatorAdapter;
  "ingestion/adapters/nysOaaAdapter": typeof ingestion_adapters_nysOaaAdapter;
  "ingestion/adapters/openReferralAdapter": typeof ingestion_adapters_openReferralAdapter;
  "ingestion/eldercare_scraper": typeof ingestion_eldercare_scraper;
  "ingestion/federalPrograms": typeof ingestion_federalPrograms;
  "ingestion/federalProgramsSeed": typeof ingestion_federalProgramsSeed;
  "ingestion/importResources": typeof ingestion_importResources;
  "ingestion/nys_oaa_parser": typeof ingestion_nys_oaa_parser;
  "ingestion/nys_oaa_parser_verbose": typeof ingestion_nys_oaa_parser_verbose;
  "ingestion/shared/load": typeof ingestion_shared_load;
  "ingestion/shared/normalize": typeof ingestion_shared_normalize;
  "ingestion/shared/registry": typeof ingestion_shared_registry;
  "ingestion/shared/scoring": typeof ingestion_shared_scoring;
  "ingestion/shared/types": typeof ingestion_shared_types;
  "ingestion/shared/validation": typeof ingestion_shared_validation;
  "resources/matchResources": typeof resources_matchResources;
  "services/MessageHandler": typeof services_MessageHandler;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  summarization: typeof summarization;
  summarizationActions: typeof summarizationActions;
  test: typeof test;
  triggers: typeof triggers;
  twilio: typeof twilio;
  watchers: typeof watchers;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  twilio: {
    messages: {
      create: FunctionReference<
        "action",
        "internal",
        {
          account_sid: string;
          auth_token: string;
          body: string;
          callback?: string;
          from: string;
          status_callback: string;
          to: string;
        },
        {
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }
      >;
      getByCounterparty: FunctionReference<
        "query",
        "internal",
        { account_sid: string; counterparty: string; limit?: number },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      getBySid: FunctionReference<
        "query",
        "internal",
        { account_sid: string; sid: string },
        {
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        } | null
      >;
      getFrom: FunctionReference<
        "query",
        "internal",
        { account_sid: string; from: string; limit?: number },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      getFromTwilioBySidAndInsert: FunctionReference<
        "action",
        "internal",
        {
          account_sid: string;
          auth_token: string;
          incomingMessageCallback?: string;
          sid: string;
        },
        {
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }
      >;
      getTo: FunctionReference<
        "query",
        "internal",
        { account_sid: string; limit?: number; to: string },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      list: FunctionReference<
        "query",
        "internal",
        { account_sid: string; limit?: number },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      listIncoming: FunctionReference<
        "query",
        "internal",
        { account_sid: string; limit?: number },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      listOutgoing: FunctionReference<
        "query",
        "internal",
        { account_sid: string; limit?: number },
        Array<{
          account_sid: string;
          api_version: string;
          body: string;
          counterparty?: string;
          date_created: string;
          date_sent: string | null;
          date_updated: string | null;
          direction: string;
          error_code: number | null;
          error_message: string | null;
          from: string;
          messaging_service_sid: string | null;
          num_media: string;
          num_segments: string;
          price: string | null;
          price_unit: string | null;
          rest?: any;
          sid: string;
          status: string;
          subresource_uris: { feedback?: string; media: string } | null;
          to: string;
          uri: string;
        }>
      >;
      updateStatus: FunctionReference<
        "mutation",
        "internal",
        { account_sid: string; sid: string; status: string },
        null
      >;
    };
    phone_numbers: {
      create: FunctionReference<
        "action",
        "internal",
        { account_sid: string; auth_token: string; number: string },
        any
      >;
      updateSmsUrl: FunctionReference<
        "action",
        "internal",
        {
          account_sid: string;
          auth_token: string;
          sid: string;
          sms_url: string;
        },
        any
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
