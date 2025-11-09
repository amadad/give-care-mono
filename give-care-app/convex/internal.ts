/**
 * Internal Convex surface area.
 *
 * Keep this file as a simple barrel so api.internal.* stays the single server-only
 * entry point. Domain modules export their own queries/mutations; actions host Node
 * side effects.
 */

export * from './domains/metrics';
export * from './domains/scheduler';
export * from './domains/interventions';
export * from './domains/alerts';
export * from './domains/wellness';
export * from './domains/memories';
export * from './domains/logs';
export * from './domains/watchers';
export * from './domains/subscriptions';
export * from './domains/assessments';
export * from './domains/analytics';
export * from './domains/admin';

// Exports from core.ts (moved from thin wrapper domains)
export {
  getByExternalIdQuery as getByExternalId,
  recordInboundMutation as recordInbound,
  recordOutboundMutation as recordOutbound,
  logDelivery,
  createComponentThread,
} from './core';

export { sendWelcomeSms } from './actions/sms.actions';
export { newsletterSignup } from './actions/newsletter.actions';
export { submit } from './actions/assessments.actions';
