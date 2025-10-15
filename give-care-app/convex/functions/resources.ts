/**
 * Resource directory queries and mutations.
 * Implements resource discovery (RBI ranking), verification logging, and feedback loops.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

type ServiceAreaRecord = Doc<"serviceAreas">;
type ProgramRecord = Doc<"programs">;
type ProviderRecord = Doc<"providers">;
type FacilityRecord = Doc<"facilities">;
type ResourceRecord = Doc<"resources">;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VERIFICATION_WEIGHTS: Record<string, number> = {
  unverified: 0.2,
  verified_basic: 0.6,
  verified_full: 1,
};

const DEFAULT_ZONE_MATCH = 0.7;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function serviceAreaMatchesZip(area: ServiceAreaRecord, zip: string) {
  if (!zip) {
    return false;
  }
  const trimmedZip = zip.trim();
  if (trimmedZip.length < 3) {
    return false;
  }
  const zip3 = trimmedZip.slice(0, 3);
  const zip2 = trimmedZip.slice(0, 2);

  if (area.type === "national") {
    return true;
  }

  if (!Array.isArray(area.geoCodes) || area.geoCodes.length === 0) {
    return false;
  }

  if (area.geoCodes.includes(trimmedZip)) {
    return true;
  }

  if (area.type === "zip_cluster" && area.geoCodes.includes(zip3)) {
    return true;
  }

  if (area.type === "statewide" && area.geoCodes.includes(zip2)) {
    // Zip2 approximates state code mapping (prefix heuristic).
    return true;
  }

  return false;
}

function estimateZoneMatch(programZones: string[], queryZones?: string[]) {
  if (!queryZones || queryZones.length === 0) {
    return DEFAULT_ZONE_MATCH;
  }
  if (!programZones || programZones.length === 0) {
    return 0;
  }

  const programSet = new Set(programZones);
  const matches = queryZones.filter((zone) => programSet.has(zone));
  return matches.length / queryZones.length;
}

function calculateFreshnessScore(lastVerified?: number | null) {
  if (!lastVerified) {
    return 0.4; // Unknown freshness defaults mid-low so curator review can lift score.
  }

  const days = (Date.now() - lastVerified) / MS_PER_DAY;
  if (days <= 30) {
    return 1;
  }
  if (days >= 365) {
    return 0;
  }
  // Linear decay after 30 days until 12 months.
  return clamp(1 - (days - 30) / (365 - 30), 0, 1);
}

function calculateVerificationScore(status: string) {
  return VERIFICATION_WEIGHTS[status] ?? 0.2;
}

function computeOutcomeSignal(successCount?: number | null, issueCount?: number | null) {
  const successes = successCount ?? 0;
  const issues = issueCount ?? 0;
  const total = successes + issues;
  if (total === 0) {
    return 0.5;
  }
  return successes / total;
}

function scoreJurisdictionFit(areaType?: string, jurisdictionLevel?: string | null) {
  if (!areaType && !jurisdictionLevel) {
    return 0.7;
  }

  if (areaType === "national" || jurisdictionLevel === "national") {
    return 1;
  }

  if (areaType === "statewide" && (jurisdictionLevel === "state" || jurisdictionLevel === "federal")) {
    return 0.9;
  }

  if (areaType === "county" && (jurisdictionLevel === "county" || jurisdictionLevel === "state")) {
    return 0.85;
  }

  if (areaType === "city" && jurisdictionLevel === "city") {
    return 0.8;
  }

  if (areaType === "zip_cluster") {
    return 0.75;
  }

  return 0.7;
}

function calculatePenalty(brokenLink?: boolean | null, bounceCount?: number | null) {
  const linkPenalty = brokenLink ? 0.2 : 0;
  const bouncePenalty = Math.min(0.2, (bounceCount ?? 0) * 0.02);
  return linkPenalty + bouncePenalty;
}

function calculateRbi({
  zoneMatch,
  verificationStatus,
  lastVerifiedDate,
  jurisdictionFit,
  outcomeSignal,
  brokenLink,
  bounceCount,
}: {
  zoneMatch: number;
  verificationStatus: string;
  lastVerifiedDate?: number | null;
  jurisdictionFit: number;
  outcomeSignal: number;
  brokenLink?: boolean | null;
  bounceCount?: number | null;
}) {
  const verificationScore = calculateVerificationScore(verificationStatus);
  const freshnessScore = calculateFreshnessScore(lastVerifiedDate);
  const penalties = calculatePenalty(brokenLink, bounceCount);

  const weighted =
    0.3 * zoneMatch +
    0.25 * verificationScore +
    0.2 * freshnessScore +
    0.15 * jurisdictionFit +
    0.1 * outcomeSignal -
    penalties;

  return clamp(Math.round(clamp(weighted, 0, 1) * 100));
}

function ensureDefaultCounts(resource: ResourceRecord) {
  return {
    success: resource.successCount ?? 0,
    issue: resource.issueCount ?? 0,
  };
}

function deduplicateServiceAreas(areas: ServiceAreaRecord[]) {
  const seen = new Set<string>();
  return areas.filter((area) => {
    const key = `${area.programId}:${area.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Internal helper for finding resources (shared by multiple queries)
async function findResourcesInternal(
  ctx: any,
  args: {
    zip: string;
    zones?: string[];
    bands?: string[];
    limit?: number;
  }
) {
    const limit = args.limit ?? 5;
    const allServiceAreas = (await ctx.db
      .query("serviceAreas")
      .collect()) as ServiceAreaRecord[];

    const matchingAreas = allServiceAreas.filter((area) =>
      serviceAreaMatchesZip(area, args.zip)
    );

    const fallbackAreas: ServiceAreaRecord[] =
      matchingAreas.length > 0
        ? matchingAreas
        : allServiceAreas.filter((area) => area.type === "national");

    const candidateAreas = deduplicateServiceAreas(fallbackAreas);
    const candidateProgramIds = new Set<Id<"programs">>(
      candidateAreas.map((area) => area.programId)
    );

    const results: Array<{
      resource: ResourceRecord;
      program: ProgramRecord;
      provider: ProviderRecord;
      facility: FacilityRecord | null;
      serviceArea: ServiceAreaRecord;
      zoneMatch: number;
      jurisdictionFit: number;
      outcomeSignal: number;
      rbi: number;
    }> = [];

    for (const programId of candidateProgramIds) {
      const program = await ctx.db.get(programId);
      if (!program) {
        continue;
      }
      const typedProgram = program as ProgramRecord;
      const provider = await ctx.db.get(typedProgram.providerId);
      if (!provider) {
        continue;
      }
      const typedProvider = provider as ProviderRecord;

      const programAreas = candidateAreas.filter((area) => area.programId === typedProgram._id);
      const resources = (await ctx.db
        .query("resources")
        .withIndex("by_program", (q) => q.eq("programId", typedProgram._id))
        .collect()) as ResourceRecord[];

      for (const resourceDoc of resources) {
        const resource = resourceDoc;
        const facility = resource.facilityId
          ? ((await ctx.db.get(resource.facilityId)) as FacilityRecord | null)
          : null;
        const serviceArea = programAreas[0] ?? fallbackAreas[0] ?? undefined;
        const zoneMatch = estimateZoneMatch(typedProgram.pressureZones, args.zones ?? undefined);
        const jurisdictionFit = scoreJurisdictionFit(serviceArea?.type, resource.jurisdictionLevel);
        const { success, issue } = ensureDefaultCounts(resource);
        const outcomeSignal = computeOutcomeSignal(success, issue);
        const rbi = calculateRbi({
          zoneMatch,
          verificationStatus: resource.verificationStatus,
          lastVerifiedDate: resource.lastVerifiedDate,
          jurisdictionFit,
          outcomeSignal,
          brokenLink: resource.brokenLink,
          bounceCount: resource.bounceCount,
        });
        const bandMultiplier =
          args.bands &&
          args.bands.includes("crisis") &&
          resource.verificationStatus === "verified_full"
            ? 1.05
            : 1;
        const adjustedRbi = clamp(Math.round(rbi * bandMultiplier));

        results.push({
          resource,
          program: typedProgram,
          provider: typedProvider,
          facility,
          serviceArea,
          zoneMatch,
          jurisdictionFit,
          outcomeSignal,
          rbi: adjustedRbi,
        });
      }
    }

    results.sort((a, b) => b.rbi - a.rbi || (b.resource.scoreRbi ?? 0) - (a.resource.scoreRbi ?? 0));

    return results.slice(0, limit).map((item) => ({
      rbi: item.rbi,
      zoneMatch: item.zoneMatch,
      jurisdictionFit: item.jurisdictionFit,
      outcomeSignal: item.outcomeSignal,
      resource: item.resource,
      program: item.program,
      provider: item.provider,
      facility: item.facility,
      serviceArea: item.serviceArea,
    }));
}

// Public query that calls the internal helper
export const findResources = query({
  args: {
    zip: v.string(),
    zones: v.optional(v.array(v.string())),
    bands: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => findResourcesInternal(ctx, args),
});

export const verifyResource = mutation({
  args: {
    resourceId: v.id("resources"),
    verificationStatus: v.string(),
    method: v.string(),
    verifiedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    nextReviewAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resourceDoc = await ctx.db.get(args.resourceId);
    if (!resourceDoc) {
      throw new Error("Resource not found");
    }
    const resource = resourceDoc as ResourceRecord;

    const programAreas = (await ctx.db
      .query("serviceAreas")
      .withIndex("by_program", (q) => q.eq("programId", resource.programId))
      .collect()) as ServiceAreaRecord[];
    const area = programAreas[0];

    const { success, issue } = ensureDefaultCounts(resource);
    const outcomeSignal = computeOutcomeSignal(success, issue);
    const jurisdictionFit = scoreJurisdictionFit(area?.type, resource.jurisdictionLevel);

    const reviewedAt = Date.now();
    const recalculatedRbi = calculateRbi({
      zoneMatch: DEFAULT_ZONE_MATCH,
      verificationStatus: args.verificationStatus,
      lastVerifiedDate: reviewedAt,
      jurisdictionFit,
      outcomeSignal,
      brokenLink: resource.brokenLink,
      bounceCount: resource.bounceCount,
    });

    await ctx.db.patch(args.resourceId, {
      verificationStatus: args.verificationStatus,
      lastVerifiedDate: reviewedAt,
      scoreRbi: recalculatedRbi,
      updatedAt: reviewedAt,
    });

    await ctx.db.insert("resourceVerifications", {
      resourceId: args.resourceId,
      verificationStatus: args.verificationStatus,
      method: args.method,
      verifiedBy: args.verifiedBy,
      notes: args.notes,
      evidenceUrl: args.evidenceUrl,
      reviewedAt,
      nextReviewAt: args.nextReviewAt,
    });

    return { resourceId: args.resourceId, scoreRbi: recalculatedRbi, reviewedAt };
  },
});

/**
 * Simple query for agent to get resource recommendations
 * Uses pressure zones from user's wellness score
 */
export const getResourceRecommendations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 3 }) => {
    // Get user
    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get latest wellness score with pressure zones
    const score = await ctx.db
      .query("wellnessScores")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .first();

    const zones = score?.pressureZones || [];
    const zip = user.zipCode || "";

    // If no zones, return empty
    if (zones.length === 0) return [];

    // Use internal helper to find resources with user's data
    const results = await findResourcesInternal(ctx, {
      zip,
      zones,
      bands: user.burnoutBand ? [user.burnoutBand] : undefined,
      limit
    });

    // Format for agent consumption
    return results.map(r => ({
      title: r.program.name,
      provider: r.provider.name,
      description: r.program.description || "",
      phone: r.facility?.phoneE164 || null,
      website: r.resource.primaryUrl || null,
      location: r.facility?.zip || "Nationwide",
      rbiScore: r.rbi
    }));
  }
});

export const feedback = mutation({
  args: {
    resourceId: v.id("resources"),
    type: v.union(v.literal("success"), v.literal("issue")),
    userId: v.optional(v.id("users")),
    band: v.optional(v.string()),
    pressureZones: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resourceDoc = await ctx.db.get(args.resourceId);
    if (!resourceDoc) {
      throw new Error("Resource not found");
    }
    const resource = resourceDoc as ResourceRecord;

    const { success, issue } = ensureDefaultCounts(resource);
    const updatedSuccess = args.type === "success" ? success + 1 : success;
    const updatedIssue = args.type === "issue" ? issue + 1 : issue;
    const outcomeSignal = computeOutcomeSignal(updatedSuccess, updatedIssue);

    const programAreas = (await ctx.db
      .query("serviceAreas")
      .withIndex("by_program", (q) => q.eq("programId", resource.programId))
      .collect()) as ServiceAreaRecord[];
    const area = programAreas[0];
    const jurisdictionFit = scoreJurisdictionFit(area?.type, resource.jurisdictionLevel);

    const updatedAt = Date.now();
    const recalculatedRbi = calculateRbi({
      zoneMatch: DEFAULT_ZONE_MATCH,
      verificationStatus: resource.verificationStatus,
      lastVerifiedDate: resource.lastVerifiedDate,
      jurisdictionFit,
      outcomeSignal,
      brokenLink: resource.brokenLink,
      bounceCount: resource.bounceCount,
    });

    await ctx.db.patch(args.resourceId, {
      successCount: updatedSuccess,
      issueCount: updatedIssue,
      lastFeedbackAt: updatedAt,
      scoreRbi: recalculatedRbi,
      updatedAt,
    });

    await ctx.db.insert("resourceFeedback", {
      resourceId: args.resourceId,
      userId: args.userId,
      type: args.type,
      band: args.band,
      pressureZones: args.pressureZones,
      notes: args.notes,
      submittedAt: updatedAt,
    });

    return {
      resourceId: args.resourceId,
      scoreRbi: recalculatedRbi,
      successCount: updatedSuccess,
      issueCount: updatedIssue,
    };
  },
});
