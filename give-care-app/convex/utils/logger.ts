/**
 * HIPAA-Compliant Structured Logger
 *
 * Redacts PII/PHI from logs to prevent HIPAA violations
 * Use this instead of console.log for any user-facing data
 *
 * NOTE: This file uses Convex isolate runtime (no "use node" directive)
 * so it can be imported by mutations/queries. Uses simple hash instead of crypto.
 */

/**
 * Simple hash for phone number (for correlation without exposing PII)
 * Uses a basic string hash instead of crypto to avoid Node.js dependency
 */
export function hashPhone(phone: string): string {
  if (!phone) return 'null';
  // Use last 4 digits + simple hash for correlation while hiding full number
  const last4 = phone.slice(-4);

  // Simple string hash (FNV-1a-like)
  let hash = 2166136261;
  for (let i = 0; i < phone.length; i++) {
    hash ^= phone.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hashStr = (hash >>> 0).toString(16).slice(0, 8);

  return `***-***-${last4} (${hashStr})`;
}

/**
 * Redact message content (never log user messages or agent responses in production)
 */
export function redactMessage(message: string): string {
  if (!message) return '';
  const wordCount = message.split(/\s+/).length;
  const charCount = message.length;
  return `<REDACTED: ${wordCount} words, ${charCount} chars>`;
}

/**
 * Safe logger for SMS events
 */
export function logSMS(event: 'incoming' | 'outgoing', data: {
  phone: string;
  message?: string;
  messageSid?: string;
  userId?: string;
}) {
  const safeData = {
    event,
    phone: hashPhone(data.phone),
    messagePreview: data.message ? redactMessage(data.message) : undefined,
    messageSid: data.messageSid,
    userId: data.userId,
    timestamp: new Date().toISOString(),
  };

  console.log(`[SMS] ${event}:`, JSON.stringify(safeData, null, 2));
}

/**
 * Safe logger for agent execution
 */
export function logAgent(phase: 'start' | 'complete' | 'error', data: {
  userId: string;
  userMessage?: string;
  agentResponse?: string;
  latency?: number;
  error?: string;
  toolsUsed?: string[];
}) {
  const safeData = {
    phase,
    userId: data.userId,
    userMessagePreview: data.userMessage ? redactMessage(data.userMessage) : undefined,
    agentResponsePreview: data.agentResponse ? redactMessage(data.agentResponse) : undefined,
    latency: data.latency,
    error: data.error,
    toolsUsed: data.toolsUsed,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Agent] ${phase}:`, JSON.stringify(safeData, null, 2));
}

/**
 * Safe logger for scheduling/proactive messages
 */
export function logScheduling(event: string, data: {
  userId: string;
  phone?: string;
  messageType?: string;
  scheduledFor?: number;
  sent?: boolean;
}) {
  const safeData = {
    event,
    userId: data.userId,
    phone: data.phone ? hashPhone(data.phone) : undefined,
    messageType: data.messageType,
    scheduledFor: data.scheduledFor ? new Date(data.scheduledFor).toISOString() : undefined,
    sent: data.sent,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Scheduling] ${event}:`, JSON.stringify(safeData, null, 2));
}

/**
 * Safe logger for Stripe events
 */
export function logStripe(event: string, data: {
  customerId?: string;
  subscriptionId?: string;
  email?: string;
  amount?: number;
  status?: string;
}) {
  const safeData = {
    event,
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
    email: data.email ? `${data.email.slice(0, 3)}***@***` : undefined,
    amount: data.amount,
    status: data.status,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Stripe] ${event}:`, JSON.stringify(safeData, null, 2));
}

/**
 * Generic safe logger (use when specific logger doesn't fit)
 */
export function logSafe(category: string, message: string, metadata?: Record<string, any>) {
  const safeMetadata = metadata ? {
    ...metadata,
    // Automatically redact known PII fields
    phone: metadata.phone ? hashPhone(metadata.phone) : metadata.phone,
    phoneNumber: metadata.phoneNumber ? hashPhone(metadata.phoneNumber) : metadata.phoneNumber,
    message: metadata.message ? redactMessage(metadata.message) : metadata.message,
    body: metadata.body ? redactMessage(metadata.body) : metadata.body,
    email: metadata.email ? `${metadata.email.slice(0, 3)}***@***` : metadata.email,
  } : undefined;

  console.log(`[${category}] ${message}`, safeMetadata ? JSON.stringify(safeMetadata, null, 2) : '');
}
