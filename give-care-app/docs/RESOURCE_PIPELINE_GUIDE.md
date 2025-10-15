# Resource Directory Pipeline Guide

**Complete walkthrough from data sourcing → user sees relevant resource**

Last updated: 2025-10-14

---

## Overview

This guide explains the **end-to-end data pipeline** for the GiveCare resource directory:

```
Data Sources → ETL Pipeline → Database → Matching Algorithm → User Receives Resource
```

**Key principle**: No vector embeddings needed - uses **structured scoring** based on pressure zones, geography, and quality signals.

---

## Part 1: Data Sourcing

### Recommended Sources (Tiered by Quality)

#### **Tier 1: Government/Public Aggregators** (FREE, structured)

| Source | API | Coverage | License |
|--------|-----|----------|---------|
| [Eldercare Locator](https://eldercare.acl.gov/) | Yes + scraping | National (US) | Public domain |
| [BenefitsCheckUp](https://benefitscheckup.org/) | Yes (request key) | National (US) | NCOA license |
| [VA Caregiver Support](https://www.caregiver.va.gov/) | No (scrape) | National (veterans) | Public domain |
| [211 Network](https://www.211.org/) | Varies by region | US + Canada | Varies |
| [findhelp.org](https://findhelp.org/) | Yes (paid $500/mo) | National (US) | Commercial |

#### **Tier 2: State/Regional** (Medium quality, manual)

- State Units on Aging (e.g., CalGrows in CA, NYSOFA in NY)
- County aging services
- Health plan directories

#### **Tier 3: Grassroots** (High quality, low scale)

- Support group directories (Alzheimer's Association, Parkinson's Foundation)
- Faith-based ministries
- Caregiver coalitions

### MVP Strategy (Phase 1)

**Goal**: 50-100 high-quality resources covering all 5 pressure zones

**Timeline**: Month 1-2

**Sources**:
1. Eldercare Locator (top 20 AAAs)
2. 988 Suicide & Crisis Lifeline
3. Family Caregiver Alliance resources
4. VA Caregiver Support Line
5. 10 local resources per pilot city (manual entry)

**Output**: 20 providers → 50 programs → 30 facilities → 100 resources

---

## Part 2: ETL Pipeline

### Step 1: Extract (Scraping Example)

```typescript
// Example: Scraping eldercare.acl.gov with Playwright
import { chromium } from "playwright";

async function scrapeEldercareLocator(zipCode: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`https://eldercare.acl.gov/Public/Index.aspx`);
  await page.fill("#zipCode", zipCode);
  await page.click("#searchButton");
  await page.waitForSelector(".result-item");

  const results = await page.$$eval(".result-item", items =>
    items.map(item => ({
      name: item.querySelector(".org-name")?.textContent || "",
      address: item.querySelector(".address")?.textContent || "",
      phone: item.querySelector(".phone")?.textContent || "",
      website: item.querySelector(".website a")?.getAttribute("href") || "",
      services: item.querySelector(".services")?.textContent || "",
      counties_served: item.querySelector(".coverage")?.textContent || ""
    }))
  );

  await browser.close();
  return results;
}

// Usage:
const rawData = await scrapeEldercareLocator("94102"); // San Francisco
```

### Step 2: Transform (Normalization)

**File**: `convex/ingestion/eldercare_scraper.ts`

**Key transformations**:
1. **Phone numbers** → E.164 format (`+15105773530`)
2. **Services string** → Array of categories (`["respite", "caregiver_support"]`)
3. **Categories** → Pressure zones (`["time_management", "physical_health"]`)
4. **County names** → FIPS codes (`"Alameda County" → "06001"`)
5. **URLs** → Add `https://`, validate

**Example**:
```typescript
Input:
{
  name: "Area Agency on Aging of Alameda County",
  phone: "(510) 577-3530",
  services: "Respite care, Caregiver support groups"
}

Output:
{
  provider: { name: "Area Agency on Aging of Alameda County", sector: "public_local" },
  facility: { phoneE164: "+15105773530" },
  programs: [
    { name: "Respite care", resourceCategory: ["respite"], pressureZones: ["time_management"] },
    { name: "Caregiver support groups", resourceCategory: ["caregiver_support"], pressureZones: ["social_support"] }
  ]
}
```

### Step 3: Load (Write to Convex)

**File**: `convex/ingestion/eldercare_scraper.ts`

**Process**:
1. Create `provider` record (deduplication check first)
2. Create `facility` record (linked to provider)
3. Create `programs` records (one per service)
4. Create `serviceAreas` records (one per program)
5. Create `resources` records (join program + facility + service area)

**Example call** (from Convex dashboard):
```typescript
await ctx.runMutation(api.ingestion.eldercare_scraper.importEldercareData, {
  rawData: [
    {
      name: "Area Agency on Aging of Alameda County",
      address: "6955 Foothill Blvd, Oakland, CA 94605",
      phone: "(510) 577-3530",
      website: "http://www.alamedasocialservices.org",
      services: "Respite care, Caregiver support groups",
      counties_served: "Alameda County"
    }
  ]
});

// Result:
// { imported: 1, failed: 0, details: [...] }
```

---

## Part 3: Resource Matching (NO Vectors)

### Algorithm: Weighted Multi-Factor Scoring

**File**: `convex/resources/matchResources.ts`

**5 Scoring Factors**:

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| **Pressure Zone Match** | 40% | Overlap between user's zones and resource's zones |
| **Geographic Proximity** | 30% | Local > regional > national |
| **Burnout Band Fit** | 15% | Respite works better for "high" than "crisis" |
| **Quality Signals** | 10% | RBI score + verification status + feedback volume |
| **Freshness** | 5% | How recently the resource was verified |

### Example Scoring

**User**: Sarah
- **Burnout band**: `high` (score: 35/100)
- **Pressure zones**: `["emotional_wellbeing", "time_management"]`
- **ZIP code**: `94102` (San Francisco)

**Resource A**: Crisis Text Line
- **Pressure zones**: `["emotional_wellbeing"]`
- **Service area**: National
- **Category**: `counseling`
- **RBI score**: `0.92` (92% success rate)
- **Verification**: `verified_full`
- **Last verified**: 14 days ago

**Scoring breakdown**:
```typescript
zoneScore = 0.50        // 1/2 zones match (emotional_wellbeing)
geoScore = 0.70         // National service (always available)
bandScore = 0.80        // Counseling is good for "high" band
qualityScore = 0.91     // Excellent RBI + verified_full
freshnessScore = 0.95   // Verified 2 weeks ago

finalScore = 0.50*0.40 + 0.70*0.30 + 0.80*0.15 + 0.91*0.10 + 0.95*0.05
           = 0.20 + 0.21 + 0.12 + 0.09 + 0.05
           = 0.67 (67% match)
```

**Resource B**: SF Caregiver Resource Center - Respite Vouchers
- **Pressure zones**: `["time_management", "physical_health"]`
- **Service area**: County (San Mateo, adjacent to SF)
- **Category**: `respite`
- **RBI score**: `0.78`
- **Verification**: `verified_basic`
- **Last verified**: 4 months ago

**Scoring breakdown**:
```typescript
zoneScore = 0.50        // 1/2 zones match (time_management)
geoScore = 0.90         // Adjacent county (close by)
bandScore = 1.0         // Respite is PERFECT for "high" band
qualityScore = 0.78     // Good RBI, basic verification
freshnessScore = 0.70   // Verified 4 months ago

finalScore = 0.50*0.40 + 0.90*0.30 + 1.0*0.15 + 0.78*0.10 + 0.70*0.05
           = 0.20 + 0.27 + 0.15 + 0.08 + 0.04
           = 0.74 (74% match) ← Higher score than Resource A!
```

**Result**: User sees Resource B first (respite) despite Resource A having better quality, because:
1. ✅ Better geographic match (90% vs 70%)
2. ✅ Perfect band fit (1.0 vs 0.8)
3. ✅ Geography weight is 30% (second-most important factor)

---

## Part 4: Integration with Agent

### How Resources Get Delivered to Users

**Flow**:
```
1. User completes assessment
   ↓
2. Burnout calculator identifies pressure zones
   ↓
3. Agent tool `findInterventions` is called
   ↓
4. Tool calls `matchResourcesForUser` query
   ↓
5. Top 3 resources returned (sorted by score)
   ↓
6. Agent formats for SMS (trauma-informed language)
   ↓
7. User receives: "Here are 3 resources for [zone]:"
```

**Example agent response**:
```
Based on your assessment, I found these resources for you:

🌱 Emotional Support:
Crisis Text Line - Text HOME to 741741 for 24/7 support

⏰ Time Management:
SF Caregiver Center - Respite vouchers to get you a break
Call: (415) 750-4111

🤝 Caregiver Community:
Online support group - Connect with others who understand
Join: https://caregiver.org/support-groups

Would any of these be helpful to explore?
```

**Code** (simplified):
```typescript
// src/tools.ts - findInterventions tool
async function findInterventions(ctx: RunContext<GiveCareContext>) {
  const { userId, pressureZones } = ctx.state.context;

  // Call Convex query
  const resources = await ctx.runQuery(
    api.resources.matchResources.matchResourcesForUser,
    { userId, limit: 3 }
  );

  // Format for SMS
  const formatted = resources.map(r => {
    const zone = r.program.pressureZones[0]; // Primary zone
    const emoji = getZoneEmoji(zone);
    return `${emoji} ${r.program.name}\n${r.program.description}\nContact: ${r.facility?.phoneE164 || r.resource.primaryUrl}`;
  }).join("\n\n");

  return { resources: formatted };
}
```

---

## Part 5: Quality Assurance

### Verification Workflow

**Process**:
1. Resource imported as `unverified`
2. Admin calls facility (phone script)
3. Confirms: phone number, hours, services, eligibility
4. Marks as `verified_basic`
5. Collects evidence (call recording, email)
6. If evidence exists, marks as `verified_full`

**Schema fields**:
```typescript
resourceVerifications: {
  resourceId: v.id("resources"),
  verificationStatus: "verified_full",
  method: "phone_call",
  verifiedBy: "admin@givecareapp.com",
  notes: "Spoke with intake coordinator on 2025-10-14. Confirmed respite vouchers available for Alameda County residents 60+.",
  evidenceUrl: "https://storage.givecareapp.com/call-recording-123.mp3",
  reviewedAt: Date.now(),
  nextReviewAt: Date.now() + (6 * 30 * 24 * 60 * 60 * 1000) // 6 months
}
```

### Staleness Detection

**Scheduled function** (runs weekly):
```typescript
// convex/crons/checkStaleResources.ts
export const checkStaleResources = internalMutation({
  handler: async (ctx) => {
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);

    const staleResources = await ctx.db
      .query("resources")
      .filter(q => q.lt(q.field("lastVerifiedDate"), sixMonthsAgo))
      .collect();

    // Flag for review in admin dashboard
    for (const resource of staleResources) {
      await ctx.db.insert("adminReviewQueue", {
        resourceId: resource._id,
        reason: "stale_data",
        priority: "medium",
        createdAt: Date.now()
      });
    }

    return { flagged: staleResources.length };
  }
});
```

---

## Part 6: Feedback Loop (RBI Scoring)

### How Quality Scores Improve Over Time

**Flow**:
```
1. User receives resource recommendation
   ↓
2. Agent tracks if user says "yes" or "no"
   ↓
3. 7 days later, proactive check-in: "Did [resource] help?"
   ↓
4. User responds: "Yes, it was great!" (success) or "They weren't available" (issue)
   ↓
5. Write to `resourceFeedback` table
   ↓
6. Recalculate RBI score: successCount / (successCount + issueCount)
   ↓
7. Update `resources.scoreRbi`
   ↓
8. Future users see boosted ranking for high-RBI resources
```

**Code**:
```typescript
// convex/resources/updateRbiScore.ts
export const recordFeedback = internalMutation({
  args: {
    resourceId: v.id("resources"),
    userId: v.id("users"),
    type: v.union(v.literal("success"), v.literal("issue")),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // 1. Insert feedback
    await ctx.db.insert("resourceFeedback", {
      resourceId: args.resourceId,
      userId: args.userId,
      type: args.type,
      notes: args.notes,
      submittedAt: Date.now()
    });

    // 2. Recalculate RBI score
    const allFeedback = await ctx.db
      .query("resourceFeedback")
      .withIndex("by_resource", q => q.eq("resourceId", args.resourceId))
      .collect();

    const successCount = allFeedback.filter(f => f.type === "success").length;
    const issueCount = allFeedback.filter(f => f.type === "issue").length;
    const totalCount = successCount + issueCount;

    const newRbiScore = totalCount > 0 ? successCount / totalCount : null;

    // 3. Update resource
    const resource = await ctx.db.get(args.resourceId);
    if (resource) {
      await ctx.db.patch(args.resourceId, {
        scoreRbi: newRbiScore,
        successCount,
        issueCount,
        lastFeedbackAt: Date.now()
      });
    }

    return { newRbiScore, totalFeedback: totalCount };
  }
});
```

---

## Part 7: Admin Dashboard Integration

### Review Queue

**Features**:
1. **Unverified resources** (need initial verification)
2. **Stale resources** (need re-verification)
3. **Broken links** (404 errors from crawler)
4. **Low RBI scores** (< 0.5, need investigation)
5. **User-submitted resources** (need approval)

**UI** (React component):
```typescript
// admin-frontend/src/components/ReviewQueue.tsx
export function ReviewQueue() {
  const queue = useQuery(api.admin.getReviewQueue);

  return (
    <div>
      {queue?.map(item => (
        <div key={item._id}>
          <h3>{item.resource.program.name}</h3>
          <p>Reason: {item.reason}</p>
          <button onClick={() => verifyResource(item.resourceId)}>
            Verify
          </button>
          <button onClick={() => rejectResource(item.resourceId)}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Summary

### The Complete Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATA SOURCING                                            │
│    Eldercare Locator → Scraper → Raw JSON                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ETL PIPELINE                                             │
│    Raw JSON → Transform → Normalize → Load to Convex        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DATABASE SCHEMA                                          │
│    providers → programs → facilities → resources            │
│                      ↓                                      │
│                serviceAreas                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. MATCHING ALGORITHM                                       │
│    User zones + band + ZIP → Weighted scoring → Top 3      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. AGENT DELIVERY                                           │
│    Agent formats resources → SMS to user                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. FEEDBACK LOOP                                            │
│    User reports success/issue → RBI score updates           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. QUALITY ASSURANCE                                        │
│    Admin verifies → Staleness detection → Re-rank           │
└─────────────────────────────────────────────────────────────┘
```

### Key Takeaways

1. ✅ **No vectors needed** - Structured scoring works great
2. ✅ **Start with 50-100 curated resources** (manual entry for MVP)
3. ✅ **Scale with ETL pipeline** (automated scraping + ingestion)
4. ✅ **Quality over quantity** (verification + RBI scoring)
5. ✅ **Feedback loop improves over time** (user outcomes → better rankings)

### Next Steps

**Phase 1 (Week 1-2)**:
- [ ] Manually enter 50 high-quality resources (10 per pressure zone)
- [ ] Test matching algorithm with real user data
- [ ] Verify phone numbers and URLs

**Phase 2 (Month 1)**:
- [ ] Build Eldercare Locator scraper
- [ ] Import 500+ resources from aggregators
- [ ] Implement admin review queue

**Phase 3 (Month 2+)**:
- [ ] Add vector search for semantic matching (enhancement)
- [ ] Build user-submitted resource form
- [ ] Automated staleness detection + re-verification

---

**Last updated**: 2025-10-14 by Claude Code
