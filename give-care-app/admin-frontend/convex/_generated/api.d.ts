/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as functions_admin from "../functions/admin.js";
import type * as functions_analytics from "../functions/analytics.js";
import type * as functions_assessments from "../functions/assessments.js";
import type * as functions_cleanup from "../functions/cleanup.js";
import type * as functions_conversations from "../functions/conversations.js";
import type * as functions_rateLimitMonitoring from "../functions/rateLimitMonitoring.js";
import type * as functions_scheduling from "../functions/scheduling.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_wellness from "../functions/wellness.js";
import type * as http from "../http.js";
import type * as test from "../test.js";
import type * as twilio from "../twilio.js";

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
  crons: typeof crons;
  "functions/admin": typeof functions_admin;
  "functions/analytics": typeof functions_analytics;
  "functions/assessments": typeof functions_assessments;
  "functions/cleanup": typeof functions_cleanup;
  "functions/conversations": typeof functions_conversations;
  "functions/rateLimitMonitoring": typeof functions_rateLimitMonitoring;
  "functions/scheduling": typeof functions_scheduling;
  "functions/users": typeof functions_users;
  "functions/wellness": typeof functions_wellness;
  http: typeof http;
  test: typeof test;
  twilio: typeof twilio;
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
};
