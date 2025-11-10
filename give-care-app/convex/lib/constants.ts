/**
 * Shared Constants
 *
 * Application-wide constants for timeouts, limits, and magic numbers
 */

// Time constants
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

// Timeout constants
export const RACE_TIMEOUT_MS = 1500; // 1.5s cap for fast-first response
export const FACT_EXTRACTION_TIMEOUT_MS = 2000; // 2s timeout for fact extraction
export const CONTEXT_BUILDING_TIMEOUT_MS = 2000; // 2s timeout for context building

// Memory constants
export const DEFAULT_MEMORY_LIMIT = 5;
export const DEFAULT_MEMORY_IMPORTANCE = 5;

// Phone validation
export const MIN_PHONE_DIGITS = 10;

// Email validation (RFC 5322 simplified)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
