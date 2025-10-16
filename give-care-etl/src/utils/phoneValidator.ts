/**
 * Phone number validation and E.164 normalization
 *
 * Matches validation logic from give-care-app/convex/ingestion/shared/validation.ts
 */

import type { PhoneValidationResult } from '../schemas/validation';

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 *
 * Supports:
 * - 10-digit US numbers → +1XXXXXXXXXX
 * - 11-digit with country code → +1XXXXXXXXXX
 * - 3-digit hotlines (988, 211, 311) → unchanged
 * - Toll-free numbers (1-800-xxx-xxxx) → +18XXXXXXXXXX
 */
export function normalizePhoneE164(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Special case: 3-digit hotlines (988, 211, 311)
  if (digits.length === 3 && ['988', '211', '311'].includes(digits)) {
    return digits;
  }

  // 10-digit number (assume US)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11-digit with country code 1
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  // Invalid length
  return null;
}

/**
 * Validate phone number and return result
 */
export function validatePhone(phone: string): PhoneValidationResult {
  const e164 = normalizePhoneE164(phone);

  if (!e164) {
    return {
      original: phone,
      e164: null,
      valid: false,
      error: 'Invalid phone number format'
    };
  }

  return {
    original: phone,
    e164,
    valid: true
  };
}

/**
 * Validate multiple phone numbers
 */
export function validatePhones(phones: string[]): PhoneValidationResult[] {
  return phones.map(validatePhone);
}

/**
 * Get first valid phone in E.164 format
 */
export function getFirstValidPhone(phones: string[]): string | undefined {
  for (const phone of phones) {
    const e164 = normalizePhoneE164(phone);
    if (e164) return e164;
  }
  return undefined;
}

/**
 * Check if phone is a toll-free number
 */
export function isTollFree(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');

  // Toll-free prefixes: 800, 888, 877, 866, 855, 844, 833
  const tollFreePrefixes = ['800', '888', '877', '866', '855', '844', '833'];

  if (digits.length === 10) {
    return tollFreePrefixes.includes(digits.slice(0, 3));
  }

  if (digits.length === 11 && digits[0] === '1') {
    return tollFreePrefixes.includes(digits.slice(1, 4));
  }

  return false;
}

/**
 * Check if phone is a hotline (3 digits)
 */
export function isHotline(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 3 && ['988', '211', '311'].includes(digits);
}

/**
 * Format phone for display
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Hotlines
  if (digits.length === 3) {
    return digits;
  }

  // 10-digit US number
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 11-digit with country code
  if (digits.length === 11 && digits[0] === '1') {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const suffix = digits.slice(7);
    return `+1 (${areaCode}) ${prefix}-${suffix}`;
  }

  // Fallback: return original
  return phone;
}
