/**
 * Validator Agent (gpt-5-nano)
 *
 * Responsible for:
 * - Phone normalization to E.164 format
 * - URL HEAD request validation
 * - Quality scoring (0-100)
 * - Approval status determination
 *
 * This agent uses gpt-5-nano for simple validation checks.
 */

"use node";

import { Agent } from '@openai/agents';
import type { ValidatedRecord, CategorizedRecord } from '../shared/types';
import { validatePhones } from '../utils/phoneValidator';
import { validateUrlWithHeadRequest } from '../utils/urlValidator';
import { createLogger } from '../utils/logger';

const logger = createLogger({ agentName: 'validator' });

/**
 * Validator Agent instructions
 */
const VALIDATOR_INSTRUCTIONS = `You are the Validator Agent for the GiveCare resource discovery pipeline.

Your job is to verify data quality before human review.

## Validation Checks

### 1. Phone Normalization
- Convert to E.164 format (+1XXXXXXXXXX)
- Support 10-digit US numbers → +1XXXXXXXXXX
- Support 11-digit with country code → +1XXXXXXXXXX
- Support 3-digit hotlines (988, 211, 311) → unchanged
- Support toll-free (1-800-xxx-xxxx) → +18XXXXXXXXXX

### 2. URL Validation
- Perform HEAD request to check accessibility
- Check HTTP status code (200 OK?)
- Detect redirects and record final URL
- Verify SSL certificate (https://)
- 5-second timeout

### 3. Quality Scoring (0-100)
- **Contact info** (0-40 points):
  - Has phone AND website: +40
  - Has phone OR website: +25
  - Has email only: +15
  - No contact info: 0

- **Source credibility** (0-20 points):
  - Federal government: +20
  - State/local government: +15
  - Verified nonprofit: +12
  - Community organization: +8
  - Unknown: 0

- **Contact diversity** (0-15 points):
  - 3+ contact methods: +15
  - 2 contact methods: +10
  - 1 contact method: +5

- **Address completeness** (0-15 points):
  - Street + City + State + ZIP: +15
  - City + State + ZIP: +12
  - State + ZIP: +8
  - State only: +5
  - No address: 0

- **Freshness** (0-10 points):
  - Last verified within 30 days: +10
  - Within 90 days: +8
  - Within 180 days: +5
  - Within 1 year: +3
  - Older or unknown: 0

**Total**: 0-100 points

### 4. Approval Status
- **approved** (≥70 points) - High quality, minimal review needed
- **pending_review** (40-69 points) - Requires human QA
- **rejected** (<40 points) - Low quality, needs significant fixes

## Output Format
Return ValidatedRecord with:
- All fields from CategorizedRecord
- **phoneE164** (array) - Normalized phones
- **urlValid** (boolean) - URL accessibility
- **urlRedirects** (string) - Final URL after redirects
- **qualityScore** (number) - 0-100 score
- **validationErrors** (array) - Fatal errors
- **validationWarnings** (array) - Non-fatal issues
- **status** (enum) - approved|pending_review|rejected

## Error Handling
- Missing required fields → Error
- Invalid phone format → Warning (try to normalize)
- URL not accessible → Warning (might be temporary)
- Quality score < 40 → Error (reject)
`;

/**
 * Validator Agent definition
 */
export const validatorAgent = new Agent({
  name: 'Validator',
  model: 'gpt-5-nano', // Simple validation checks
  instructions: VALIDATOR_INSTRUCTIONS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'normalize_phone_e164',
        description: 'Normalize phone to E.164 format',
        parameters: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Phone number to normalize'
            }
          },
          required: ['phone']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'check_url_head',
        description: 'Perform HEAD request to validate URL',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to check'
            }
          },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'calculate_quality_score',
        description: 'Calculate quality score (0-100)',
        parameters: {
          type: 'object',
          properties: {
            record: {
              type: 'object',
              description: 'CategorizedRecord to score'
            }
          },
          required: ['record']
        }
      }
    }
  ]
});

/**
 * Calculate quality score for a record
 */
function calculateQualityScore(record: CategorizedRecord): {
  score: number;
  breakdown: Record<string, number>;
} {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // Contact info (0-40 points)
  const hasPhone = record.phones && record.phones.length > 0;
  const hasWebsite = !!record.website;
  const hasEmail = !!record.email;

  if (hasPhone && hasWebsite) {
    breakdown.contactInfo = 40;
  } else if (hasPhone || hasWebsite) {
    breakdown.contactInfo = 25;
  } else if (hasEmail) {
    breakdown.contactInfo = 15;
  } else {
    breakdown.contactInfo = 0;
  }
  score += breakdown.contactInfo;

  // Source credibility (0-20 points)
  const isFederal = record.fundingSource === 'federal';
  const isState = record.fundingSource === 'state';
  const isLocal = record.fundingSource === 'local';
  const isNonprofit = record.fundingSource === 'nonprofit';

  if (isFederal) {
    breakdown.sourceCredibility = 20;
  } else if (isState || isLocal) {
    breakdown.sourceCredibility = 15;
  } else if (isNonprofit) {
    breakdown.sourceCredibility = 12;
  } else {
    breakdown.sourceCredibility = 0;
  }
  score += breakdown.sourceCredibility;

  // Contact diversity (0-15 points)
  const contactMethods = [hasPhone, hasWebsite, hasEmail].filter(Boolean).length;
  if (contactMethods >= 3) {
    breakdown.contactDiversity = 15;
  } else if (contactMethods === 2) {
    breakdown.contactDiversity = 10;
  } else if (contactMethods === 1) {
    breakdown.contactDiversity = 5;
  } else {
    breakdown.contactDiversity = 0;
  }
  score += breakdown.contactDiversity;

  // Address completeness (0-15 points)
  const hasAddress = !!record.address;
  const hasCity = !!record.city;
  const hasState = !!record.state;
  const hasZip = !!record.zip;

  if (hasAddress && hasCity && hasState && hasZip) {
    breakdown.addressComplete = 15;
  } else if (hasCity && hasState && hasZip) {
    breakdown.addressComplete = 12;
  } else if (hasState && hasZip) {
    breakdown.addressComplete = 8;
  } else if (hasState) {
    breakdown.addressComplete = 5;
  } else {
    breakdown.addressComplete = 0;
  }
  score += breakdown.addressComplete;

  // Freshness (0-10 points)
  if (record.lastVerified) {
    const verifiedDate = new Date(record.lastVerified);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= 30) {
      breakdown.freshness = 10;
    } else if (daysSince <= 90) {
      breakdown.freshness = 8;
    } else if (daysSince <= 180) {
      breakdown.freshness = 5;
    } else if (daysSince <= 365) {
      breakdown.freshness = 3;
    } else {
      breakdown.freshness = 0;
    }
  } else {
    breakdown.freshness = 0;
  }
  score += breakdown.freshness;

  return { score, breakdown };
}

/**
 * Execute validation workflow
 *
 * @param record - CategorizedRecord to validate
 * @returns ValidatedRecord with quality score and status
 */
export async function executeValidationWorkflow(
  record: CategorizedRecord
): Promise<ValidatedRecord> {
  const sessionId = `validator-${Date.now()}`;

  logger.info('Starting validation workflow', {
    sessionId,
    title: record.title
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Validate phones
    const phoneResults = record.phones
      ? validatePhones(record.phones)
      : [];
    const phoneE164 = phoneResults
      .filter(r => r.valid)
      .map(r => r.e164!)
      .filter((p): p is string => p !== null);

    if (record.phones && record.phones.length > 0 && phoneE164.length === 0) {
      warnings.push('No valid phone numbers found');
    }

    // 2. Validate URL
    let urlValid = false;
    let urlRedirects: string | undefined;

    if (record.website) {
      const urlResult = await validateUrlWithHeadRequest(record.website);
      urlValid = urlResult.valid;
      urlRedirects = urlResult.redirectUrl;

      if (!urlValid) {
        warnings.push(`URL validation failed: ${urlResult.error || 'Unknown error'}`);
      }
    }

    // 3. Calculate quality score
    const { score: qualityScore, breakdown } = calculateQualityScore(record);

    // 4. Determine status
    let status: 'approved' | 'pending_review' | 'rejected';
    if (qualityScore >= 70) {
      status = 'approved';
    } else if (qualityScore >= 40) {
      status = 'pending_review';
    } else {
      status = 'rejected';
      errors.push(`Quality score too low: ${qualityScore}/100`);
    }

    logger.info('Validation workflow completed', {
      sessionId,
      qualityScore,
      status,
      breakdown
    });

    return {
      ...record,
      phoneE164: phoneE164.length > 0 ? phoneE164 : undefined,
      urlValid,
      urlRedirects,
      qualityScore,
      validationErrors: errors,
      validationWarnings: warnings,
      status
    };
  } catch (error) {
    logger.error('Validation workflow failed', error, {
      sessionId,
      title: record.title
    });

    return {
      ...record,
      urlValid: false,
      qualityScore: 0,
      validationErrors: [error instanceof Error ? error.message : String(error)],
      validationWarnings: warnings,
      status: 'rejected'
    };
  }
}
