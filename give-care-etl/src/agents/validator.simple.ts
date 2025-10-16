"use node";

/**
 * Validator Agent
 *
 * Validates phone numbers, URLs, and assigns quality scores
 */

import { CategorizedRecord, ValidatedRecord } from "../shared/types";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "validator" });

/**
 * Validate a categorized record
 */
export async function validateRecord(record: CategorizedRecord): Promise<ValidatedRecord> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate phones
  const phoneE164: string[] = [];
  let phoneValid = false;

  if (record.phones && record.phones.length > 0) {
    for (const phone of record.phones) {
      const normalized = normalizePhone(phone);
      if (normalized) {
        phoneE164.push(normalized);
        phoneValid = true;
      } else {
        warnings.push(`Invalid phone format: ${phone}`);
      }
    }
  }

  // Validate URL
  let urlValid = false;
  let urlRedirects: string | undefined;

  if (record.website) {
    try {
      const urlCheck = await validateUrl(record.website);
      urlValid = urlCheck.valid;
      urlRedirects = urlCheck.finalUrl;

      if (!urlValid) {
        errors.push(`Website unreachable: ${record.website}`);
      }
    } catch (error) {
      warnings.push(`Could not validate URL: ${record.website}`);
    }
  }

  // Calculate quality score (0-100)
  let qualityScore = 0;

  // Contact info (up to 30 points)
  if (phoneE164.length > 0) qualityScore += 10;
  if (record.website && urlValid) qualityScore += 10;
  if (record.email) qualityScore += 10;

  // Location info (up to 20 points)
  if (record.zip) qualityScore += 10;
  if (record.address && record.city && record.state) qualityScore += 10;

  // Description & details (up to 30 points)
  if (record.description && record.description.length > 50) qualityScore += 10;
  if (record.eligibility) qualityScore += 5;
  if (record.hours) qualityScore += 5;
  if (record.languages && record.languages.length > 1) qualityScore += 5;
  if (record.serviceTypes.length >= 2) qualityScore += 5;

  // Categorization (up to 20 points)
  if (record.zones.length > 0) qualityScore += 10;
  if (record.categoryConfidence >= 80) qualityScore += 10;

  // Penalties
  if (errors.length > 0) qualityScore -= 10;
  if (warnings.length > 2) qualityScore -= 5;

  // Clamp to 0-100
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  // Determine status
  let status: "approved" | "pending_review" | "rejected" = "pending_review";

  if (qualityScore >= 70 && errors.length === 0) {
    status = "approved";
  } else if (qualityScore < 30 || errors.length > 2) {
    status = "rejected";
  }

  const validated: ValidatedRecord = {
    ...record,
    phoneE164: phoneE164.length > 0 ? phoneE164 : undefined,
    urlValid,
    urlRedirects,
    qualityScore,
    validationErrors: errors,
    validationWarnings: warnings,
    status
  };

  logger.info("Validated record", {
    title: record.title,
    qualityScore,
    status,
    errors: errors.length,
    warnings: warnings.length
  });

  return validated;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle different formats
  if (digits.length === 10) {
    // US number without country code
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // US number with country code
    return `+${digits}`;
  } else if (digits.length > 11) {
    // International number
    return `+${digits}`;
  }

  return null; // Invalid format
}

/**
 * Validate URL by making a HEAD request
 */
async function validateUrl(url: string): Promise<{ valid: boolean; finalUrl?: string }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "GiveCareBot/1.0 (+https://givecareapp.com)"
      }
    });

    return {
      valid: response.ok,
      finalUrl: response.url !== url ? response.url : undefined
    };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Batch validate multiple records
 */
export async function validateRecords(records: CategorizedRecord[]): Promise<ValidatedRecord[]> {
  const validated: ValidatedRecord[] = [];

  for (const record of records) {
    const result = await validateRecord(record);
    validated.push(result);
  }

  return validated;
}
