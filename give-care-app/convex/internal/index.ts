/**
 * Internal Convex surface area.
 *
 * Keep this file as a simple barrel so api.internal.* stays the single server-only
 * entry point.
 */

// Exports from core.ts
export {
  getByExternalIdQuery as getByExternalId,
  recordInboundMutation as recordInbound,
  recordOutboundMutation as recordOutbound,
  logDelivery,
  createComponentThread,
} from '../core';
