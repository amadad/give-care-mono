/**
 * Eldercare Locator API Adapter
 *
 * Parses JSON responses from eldercare.acl.gov API
 * Only 40 lines of source-specific logic!
 */

import { IntermediateRecord } from "../shared/types";

interface EldercareApiResponse {
  Organizations: Array<{
    Name: string;
    OrgType: string;
    Website: string;
    Address1: string;
    City: string;
    State: string;
    Zip: string;
    Phone: string;
    Email: string;
    Services: string;
  }>;
}

/**
 * Parse Eldercare Locator API response
 */
export function parseEldercareLocator(
  apiResponse: EldercareApiResponse
): IntermediateRecord[] {
  return apiResponse.Organizations.map(org => ({
    title: org.Services || org.Name, // Use service name as title
    description: `Services provided by ${org.Name}`,
    providerName: org.Name,
    providerUrl: org.Website,
    address: org.Address1,
    city: org.City,
    state: org.State,
    zip: org.Zip,
    phone: org.Phone,
    email: org.Email,
    website: org.Website,
    sourceId: undefined, // Eldercare Locator doesn't provide IDs
    sourceUrl: "https://eldercare.acl.gov"
  }));
}
