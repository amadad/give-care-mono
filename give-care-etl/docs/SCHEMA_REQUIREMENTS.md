# ETL Pipeline Schema Requirements

## Target: IntermediateRecord (give-care-app/convex/ingestion/shared/types.ts)

All extracted resources MUST match this schema to be loaded into production.

## Required Fields

### 1. Program Details
```typescript
title: string                    // REQUIRED - Program name
description?: string             // Optional - What the program does
```

### 2. Provider Details
```typescript
providerName: string            // REQUIRED - Organization name
```

### 3. Contact Information (at least one REQUIRED)
```typescript
phones?: string[]               // Phone numbers (will be normalized to E.164)
website?: string                // Program website
email?: string                  // Contact email
```

### 4. Location (optional but strongly recommended for matching)
```typescript
address?: string                // Street address
city?: string                   // City name
state?: string                  // 2-letter state code (e.g., "NY")
zip?: string                    // ZIP code (5 or 9 digit)
lat?: number                    // Latitude
lng?: number                    // Longitude
```

### 5. Categorization (REQUIRED)
```typescript
serviceTypes: string[]          // REQUIRED - From 11 service types below
zones: string[]                 // REQUIRED - From 5 pressure zones below
```

**11 Service Types** (maps to caregiver needs):
1. `respite` - Temporary relief care
2. `support_group` - Peer support groups
3. `counseling` - Mental health counseling
4. `crisis_support` - Crisis hotlines/intervention
5. `financial_aid` - Financial assistance programs
6. `medicare_help` - Medicare/Medicaid navigation
7. `legal_planning` - Legal services (wills, POA, etc.)
8. `navigation` - System navigation/case management
9. `equipment_devices` - Medical equipment/assistive devices
10. `education_training` - Caregiver training programs
11. `caregiver_support` - General caregiver support services

**5 Pressure Zones** (maps to burnout assessment):
1. `physical_health` - Physical strain from caregiving
2. `emotional_wellbeing` - Mental/emotional stress
3. `financial_concerns` - Financial burden
4. `time_management` - Time constraints
5. `social_support` - Social isolation

**Service → Zone Mapping**:
- respite → physical_health, time_management
- support_group → social_support, emotional_wellbeing
- financial_aid → financial_concerns
- medicare_help → financial_concerns, time_management
- counseling → emotional_wellbeing
- crisis_support → emotional_wellbeing
- legal_planning → financial_concerns
- navigation → financial_concerns, social_support
- equipment_devices → physical_health, financial_concerns
- education_training → time_management, emotional_wellbeing
- caregiver_support → social_support, emotional_wellbeing

### 6. Coverage (REQUIRED)
```typescript
coverage: 'national' | 'state' | 'county' | 'zip' | 'radius'
```
- `national` - Available nationwide
- `state` - Specific state(s)
- `county` - Specific county/counties
- `zip` - Specific ZIP codes
- `radius` - Service area radius

### 7. Service Details (optional)
```typescript
hours?: string                  // Hours of operation
eligibility?: string            // Who can access this
languages?: string[]            // Languages supported
```

### 8. Metadata (REQUIRED)
```typescript
sourceUrl?: string              // URL where this was scraped
license?: string                // Data license
dataSourceType: 'scraped' | 'manual_entry' | 'api'
aggregatorSource: 'eldercare' | '211' | 'carelinq' | 'manual' | 'other'
fundingSource?: 'federal' | 'state' | 'nonprofit' | 'private'
lastVerified?: string           // ISO date string
```

## Extraction Agent Instructions

When scraping a resource page, look for:

### Critical Data (must extract):
1. **Program Name** (title)
2. **Organization Name** (providerName)
3. **Phone Number(s)** OR **Website** (at least one)
4. **What Services They Offer** → Map to serviceTypes
5. **Location** (state, city, zip if available)
6. **Coverage Area** (who can use this service)

### High-Value Data (extract if present):
- Program description
- Eligibility requirements
- Hours of operation
- Languages supported
- Street address (for exact matching)
- Email contact

### Service Type Keywords to Look For:

| Service Type | Keywords to Detect |
|--------------|-------------------|
| respite | "respite", "temporary care", "relief care", "short-term care" |
| support_group | "support group", "peer support", "caregiver group", "community" |
| counseling | "counseling", "therapy", "mental health", "psychologist" |
| crisis_support | "crisis", "hotline", "emergency", "24/7", "immediate help" |
| financial_aid | "financial assistance", "grants", "subsidies", "funding" |
| medicare_help | "medicare", "medicaid", "insurance", "benefits counseling" |
| legal_planning | "legal", "attorney", "will", "power of attorney", "estate" |
| navigation | "navigation", "case management", "coordination", "referrals" |
| equipment_devices | "equipment", "devices", "wheelchair", "walker", "assistive" |
| education_training | "training", "education", "workshop", "class", "learn" |
| caregiver_support | "caregiver support", "family support", "caregiver services" |

## Validator Agent Requirements

### Phone Validation:
- Normalize to E.164 format: +1XXXXXXXXXX
- Remove formatting: (555) 123-4567 → +15551234567
- Validate area code exists
- Mark as valid/invalid

### URL Validation:
- Check URL is reachable (HEAD request)
- Follow redirects (max 3)
- Check status code 200-399 = valid
- Record final URL after redirects

### Quality Scoring (0-10):
- Has phone + website + email: +3
- Has complete address (street, city, state, zip): +2
- Has description: +1
- Has hours: +1
- Has eligibility info: +1
- Has multiple languages: +1
- Valid phone: +1 (or -2 if invalid)
- Valid URL: +1 (or -2 if broken)

## Example Complete Record

```json
{
  "title": "New York Caregiver Resource Center",
  "description": "Free support and training for family caregivers in New York",
  "providerName": "NY Department for the Aging",
  "phones": ["800-555-1234", "(212) 555-5678"],
  "website": "https://aging.ny.gov/caregivers",
  "email": "info@aging.ny.gov",
  "address": "2 Lafayette Street",
  "city": "New York",
  "state": "NY",
  "zip": "10007",
  "serviceTypes": ["respite", "support_group", "education_training"],
  "zones": ["physical_health", "time_management", "social_support", "emotional_wellbeing"],
  "coverage": "state",
  "hours": "Mon-Fri 9am-5pm",
  "eligibility": "Family caregivers of adults 18+",
  "languages": ["en", "es", "zh"],
  "sourceUrl": "https://aging.ny.gov/programs/caregiver-support",
  "license": "public",
  "dataSourceType": "scraped",
  "aggregatorSource": "eldercare",
  "fundingSource": "state",
  "lastVerified": "2025-10-16T00:00:00Z"
}
```

## Discovery Agent Target Sources

### Federal/Government:
- eldercare.acl.gov (Eldercare Locator)
- va.gov (VA Caregiver Support)
- medicare.gov/caregiver-support
- nia.nih.gov/health/caregiving

### State/Local:
- State aging departments (e.g., aging.ny.gov)
- Area Agencies on Aging (AAA)
- State 211 services

### Nonprofit:
- caregiver.org (Family Caregiver Alliance)
- aarp.org/caregiving
- alz.org (Alzheimer's Association)
- caregiving.org (National Alliance for Caregiving)

### Quality Criteria:
- Trust score 7+ (government, established nonprofits)
- Recently updated (within 1 year)
- Clear service descriptions
- Complete contact information
