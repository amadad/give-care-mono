/**
 * Structured logging utility with PII redaction
 *
 * SECURITY: Never log sensitive data (phone numbers, messages, names, emails)
 * COMPLIANCE: HIPAA-compliant logging (no PHI/PII in logs)
 *
 * Usage:
 * ```typescript
 * import { logger } from './logger';
 *
 * logger.info('User authenticated', { userId: user._id });
 * logger.error('SMS delivery failed', { error: err.message, userId: user._id });
 * logger.debug('Rate limit checked', { userId: user._id, limited: false });
 * ```
 */

/**
 * Log levels (aligned with standard severity)
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured log entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * PII fields that must be redacted (NEVER log these raw)
 *
 * SAFE TO LOG (NOT PII):
 * - userId (internal Convex ID like "j9x7k2p4m8n5q1r3")
 * - sessionId (internal identifier)
 * - assessmentType (e.g., "ema", "cwbs")
 * - timestamps, latency, error messages
 *
 * NEVER LOG (PII/PHI):
 * - Phone numbers, email addresses
 * - Message content (could contain health info)
 * - Names (first, last, full)
 * - Addresses, SSN, DOB
 */
const PII_FIELDS = new Set([
  'phoneNumber',
  'phone',
  'from',
  'to',
  'body',
  'message',
  'messageSid',
  'email',
  'name',
  'fullName',
  'firstName',
  'lastName',
  'address',
  'ssn',
  'dob',
  'dateOfBirth',
]);

/**
 * Hash a string (for PII redaction) using simple hash
 * Note: This is NOT cryptographic - just for log correlation
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Redact PII from metadata
 * - Phone numbers → hash (for correlation)
 * - Message bodies → '[REDACTED]'
 * - Names/emails → '[REDACTED]'
 */
function redactPII(metadata: Record<string, any>): Record<string, any> {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (PII_FIELDS.has(key)) {
      // Special case: phoneNumber gets hashed (for log correlation)
      if (key === 'phoneNumber' || key === 'phone' || key === 'from' || key === 'to') {
        redacted[`${key}Hash`] = typeof value === 'string' ? simpleHash(value) : '[INVALID]';
      } else {
        // Everything else gets redacted
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      redacted[key] = redactPII(value);
    } else {
      // Safe to log
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Format log entry as JSON (for structured logging)
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata: metadata ? redactPII(metadata) : undefined,
  };

  // In production, send to logging service (e.g., Datadog, Sentry)
  // For now, use console with structured format
  const formatted = formatLog(entry);

  switch (level) {
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted);
      }
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
      console.error(formatted);
      break;
  }
}

/**
 * Logger API (public interface)
 */
export const logger = {
  debug: (message: string, metadata?: Record<string, any>) => log(LogLevel.DEBUG, message, metadata),
  info: (message: string, metadata?: Record<string, any>) => log(LogLevel.INFO, message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => log(LogLevel.WARN, message, metadata),
  error: (message: string, metadata?: Record<string, any>) => log(LogLevel.ERROR, message, metadata),
};

/**
 * Example usage:
 *
 * BEFORE (PII exposed):
 * console.log('[MessageHandler] Incoming SMS from +15551234567:', message.body);
 *
 * AFTER (PII redacted):
 * logger.info('Incoming SMS', { phoneNumberHash: simpleHash('+15551234567'), bodyLength: message.body.length });
 */
