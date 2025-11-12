/**
 * SMS Utilities
 * Helper functions for SMS segment enforcement
 */

/**
 * Enforce SMS segment limit (single segment = 160 characters)
 * Pure function
 */
export function enforceSmsSegments(message: string, maxSegments = 1): string {
  const maxLength = maxSegments * 160;
  if (message.length <= maxLength) {
    return message;
  }

  // Truncate to fit within segment limit
  return message.substring(0, maxLength - 3) + "...";
}

