/**
 * Open Referral (HSDS) Adapter
 *
 * Parses Open Referral's Human Services Data Specification (HSDS) format
 * Used by 211, findhelp.org, and other major directories
 * Only 50 lines!
 */

import { IntermediateRecord } from "../shared/types";

interface HsdsService {
  id: string;
  name: string;
  description: string;
  url?: string;
  organization: {
    id: string;
    name: string;
    url?: string;
  };
  locations: Array<{
    name: string;
    address_1: string;
    city: string;
    state_province: string;
    postal_code: string;
    latitude?: number;
    longitude?: number;
  }>;
  phones: Array<{
    number: string;
    type: string;
  }>;
  eligibility?: {
    description: string;
  };
  languages?: string[];
}

/**
 * Parse HSDS (Open Referral) format
 */
export function parseOpenReferral(services: HsdsService[]): IntermediateRecord[] {
  return services.map(service => {
    const primaryLocation = service.locations[0];
    const primaryPhone = service.phones.find(p => p.type === "voice")?.number;

    return {
      title: service.name,
      description: service.description,
      providerName: service.organization.name,
      providerUrl: service.organization.url,
      address: primaryLocation?.address_1,
      city: primaryLocation?.city,
      state: primaryLocation?.state_province,
      zip: primaryLocation?.postal_code,
      phone: primaryPhone,
      website: service.url,
      eligibility: service.eligibility?.description,
      languages: service.languages,
      sourceId: service.id,
      sourceUrl: service.url
    };
  });
}
