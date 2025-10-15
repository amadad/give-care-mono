# Simple Resource Recommendations - What to Do

## What You Need to Do (3 Steps)

### Step 1: Create Database Query (5 minutes)
**File**: Create `convex/functions/resources.ts`

```typescript
"use node";
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getResourceRecommendations = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 3 }) => {
    // Get user
    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get latest wellness score
    const score = await ctx.db
      .query("wellnessScores")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .first();

    const zones = score?.pressureZones || [];
    if (zones.length === 0) return [];

    // Get resources matching user's pressure zones
    const allPrograms = await ctx.db.query("programs").collect();

    const matches = allPrograms
      .filter(p => p.pressureZones.some(z => zones.includes(z)))
      .slice(0, limit);

    // Format results
    const results = [];
    for (const program of matches) {
      const provider = await ctx.db.get(program.providerId);
      const resource = await ctx.db
        .query("resources")
        .withIndex("by_program", q => q.eq("programId", program._id))
        .first();

      const facility = resource?.facilityId
        ? await ctx.db.get(resource.facilityId)
        : null;

      results.push({
        title: program.name,
        provider: provider?.name || "Unknown",
        description: program.description || "",
        phone: facility?.phoneE164 || null,
        website: resource?.primaryUrl || null,
        location: facility?.zip || "Nationwide"
      });
    }

    return results;
  }
});
```

---

### Step 2: Connect Agent Tool (5 minutes)
**File**: Edit `src/tools.ts` - Find `findInterventions` tool (~line 333)

**Replace this**:
```typescript
const topZones = zones.slice(0, 2);
const matches = topZones
  .map(zone => ZONE_INTERVENTIONS[zone]?.[0])
  .filter(Boolean);

return intro + matches
  .map((int, i) => `${i + 1}. **${int.title}**: ${int.desc}\n   ✓ ${int.helpful}% found helpful`)
  .join('\n\n');
```

**With this**:
```typescript
// Try to get real resources from database
let resources = [];
try {
  resources = await runContext!.convexClient.query(
    api.functions.resources.getResourceRecommendations,
    { userId: context.userId, limit: 3 }
  );
} catch (e) {
  console.error("Resource query failed:", e);
}

// If database empty, use static fallback
if (resources.length === 0) {
  const topZones = zones.slice(0, 2);
  const matches = topZones
    .map(zone => ZONE_INTERVENTIONS[zone]?.[0])
    .filter(Boolean);

  return intro + matches
    .map((int, i) => `${i + 1}. **${int.title}**: ${int.desc}\n   ✓ ${int.helpful}% found helpful`)
    .join('\n\n');
}

// Format database resources
const formatted = resources.map((r, i) => {
  let text = `${i + 1}. **${r.title}** (${r.provider})\n   ${r.description.slice(0, 80)}...`;
  if (r.phone) text += `\n   📞 ${r.phone}`;
  if (r.website) text += `\n   🔗 ${r.website}`;
  return text;
}).join('\n\n');

return intro + formatted;
```

**Also add this import at top of file**:
```typescript
import { api } from "../convex/_generated/api";
```

---

### Step 3: Add 5 Test Resources (10 minutes)
**Option A - Use Convex Dashboard**:

1. Go to your Convex dashboard
2. Run these mutations manually:

```javascript
// 1. Create Provider
await ctx.db.insert("providers", {
  name: "National Alliance for Caregiving",
  sector: "nonprofit",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// 2. Create Program (copy provider ID from step 1)
await ctx.db.insert("programs", {
  providerId: "PASTE_PROVIDER_ID_HERE",
  name: "24/7 Caregiver Support Hotline",
  description: "Free confidential support for family caregivers",
  resourceCategory: ["caregiver_support"],
  pressureZones: ["emotional", "social"],
  languageSupport: ["en"],
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// 3. Create Facility (copy provider ID from step 1)
await ctx.db.insert("facilities", {
  providerId: "PASTE_PROVIDER_ID_HERE",
  name: "National Alliance for Caregiving",
  phoneE164: "+18007998335",
  languages: ["en"],
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// 4. Create Resource (copy program ID from step 2, facility ID from step 3)
await ctx.db.insert("resources", {
  programId: "PASTE_PROGRAM_ID_HERE",
  facilityId: "PASTE_FACILITY_ID_HERE",
  dataSourceType: "manual_entry",
  verificationStatus: "verified_basic",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

Repeat for:
- **Eldercare Locator**: +18006772116 (respite, physical/temporal zones)
- **AARP Caregiving**: aarp.org/caregiving (education, cognitive zone)
- **BenefitsCheckUp**: benefitscheckup.org (financial, financial zone)
- **Family Caregiver Alliance**: +18004457250 (navigation, cognitive zone)

---

## What It WILL Do

### Current Behavior (Static)
```
User: "I'm exhausted"
Agent: "Here are some strategies:

1. **15-Minute Self-Care**: Take a walk
   ✓ 82% found helpful

2. **Respite Planning**: Schedule regular breaks
   ✓ 76% found helpful"
```

### New Behavior (Database)
```
User: "I'm exhausted"
Agent: "Things are tough. These might help:

1. **24/7 Caregiver Support Hotline** (National Alliance)
   Free confidential support for family caregivers
   📞 +1-800-799-8335

2. **Local Respite Care Finder** (Eldercare Locator)
   Connects you to respite services in your area
   📞 +1-800-677-2116
   🔗 eldercare.acl.gov"
```

### Key Differences

| Before | After |
|--------|-------|
| Generic tips | Real services |
| No contact info | Phone numbers & websites |
| "82% found helpful" | Actual organizations |
| Same for everyone | Matched to pressure zones |
| Can't track usage | Can measure who calls |

---

## If Database Is Empty?

**It falls back to static interventions automatically**. No breaking changes.

---

## Testing

1. **Run dev server**: `npx convex dev`
2. **Send test SMS**: "I'm feeling overwhelmed"
3. **Check response**:
   - ✅ Shows phone numbers? Database working
   - ❌ Shows "82% helpful"? Using fallback (database empty)

---

## Time Investment

- **Step 1**: 5 minutes (copy/paste file)
- **Step 2**: 5 minutes (modify tool)
- **Step 3**: 10 minutes (add 5 resources)
- **Total**: 20 minutes

---

## Why Do This?

1. **Users get actionable help** - Phone numbers they can call RIGHT NOW
2. **You can measure impact** - Track which resources users actually use
3. **Scales easily** - Add more resources without changing code
4. **Validates your infrastructure** - Proves the database design works

---

## Next: After MVP Works

1. Bulk import NYS OAA data (500+ food/nutrition programs)
2. Add Eldercare Locator nationwide (10,000+ services)
3. Geographic filtering (show nearby resources first)
4. Track click-through rates

But do the 20-minute MVP first.
