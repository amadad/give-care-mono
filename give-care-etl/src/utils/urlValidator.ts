/**
 * URL validation and HEAD request checks
 */

import type { UrlValidationResult } from '../schemas/validation';

/**
 * Normalize URL (add https:// if missing)
 */
export function normalizeUrl(url: string): string | null {
  if (!url || url === 'N/A' || url.trim() === '') {
    return null;
  }

  try {
    // Add https:// if missing protocol
    const normalized = url.startsWith('http') ? url : `https://${url}`;

    // Validate with URL constructor
    new URL(normalized);

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Validate URL format (without HTTP request)
 */
export function validateUrlFormat(url: string): UrlValidationResult {
  const normalized = normalizeUrl(url);

  if (!normalized) {
    return {
      original: url,
      valid: false,
      error: 'Invalid URL format'
    };
  }

  return {
    original: url,
    valid: true
  };
}

/**
 * Perform HEAD request to check URL accessibility
 *
 * This version is for Cloudflare Workers environment.
 * Uses fetch() with HEAD method to check if URL is reachable.
 */
export async function validateUrlWithHeadRequest(url: string): Promise<UrlValidationResult> {
  const normalized = normalizeUrl(url);

  if (!normalized) {
    return {
      original: url,
      valid: false,
      error: 'Invalid URL format'
    };
  }

  try {
    const response = await fetch(normalized, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    const finalUrl = response.url;
    const redirected = finalUrl !== normalized;

    return {
      original: url,
      valid: response.ok,
      statusCode: response.status,
      redirectUrl: redirected ? finalUrl : undefined,
      sslValid: finalUrl.startsWith('https://')
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      original: url,
      valid: false,
      error: `HEAD request failed: ${errorMessage}`
    };
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if URL is from a trusted domain
 */
export function isTrustedDomain(url: string): boolean {
  const trustedDomains = [
    'eldercare.acl.gov',
    'medicare.gov',
    'va.gov',
    'ssa.gov',
    'benefits.gov',
    'samhsa.gov',
    'nia.nih.gov',
    'alz.org',
    'caregiver.org',
    'caregiveraction.org',
    'archrespite.org',
    '211.org',
    'caregiver.va.gov',
    'shiphelp.org',
    // State government patterns
    '.gov',
    '.mil',
    // Common nonprofits
    'alzheimers.org',
    'aarp.org'
  ];

  const domain = extractDomain(url);
  if (!domain) return false;

  return trustedDomains.some(trusted => domain.endsWith(trusted));
}

/**
 * Check if URL is likely a resource directory
 */
export function isResourceDirectory(url: string): boolean {
  const directoryPatterns = [
    '/directory',
    '/resources',
    '/services',
    '/programs',
    '/find-help',
    '/search',
    '/locator'
  ];

  const lowerUrl = url.toLowerCase();
  return directoryPatterns.some(pattern => lowerUrl.includes(pattern));
}

/**
 * Batch validate URLs (for multiple resources)
 */
export async function validateUrls(urls: string[]): Promise<UrlValidationResult[]> {
  const results = await Promise.all(
    urls.map(url => validateUrlWithHeadRequest(url))
  );

  return results;
}
