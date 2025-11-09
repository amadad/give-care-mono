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
export * from './domains/threads';
export * from './domains/messages';
export * from './domains/users';
export * from './domains/email';
export * from './domains/alerts';
export * from './domains/wellness';
export * from './domains/memories';
export * from './domains/logs';
export * from './domains/watchers';
export * from './domains/subscriptions';
export * from './domains/assessments';
export * from './domains/analytics';
export * from './domains/admin';

export { sendWelcomeSms } from './actions/sms.actions';
export { newsletterSignup } from './actions/newsletter.actions';
export { submit } from './actions/assessments.actions';
