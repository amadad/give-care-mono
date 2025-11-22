/**
 * Agent Tools
 * Core tools for resources, assessments, memory, interventions, and profile updates
 *
 * PERFORMANCE PATTERNS:
 *
 * 1. Concurrent Queries (Promise.all):
 *    - Used when tool needs multiple independent queries
 *    - Reduces latency by running queries in parallel
 *    - Example: checkAssessmentStatus (user + SDOH + EMA in parallel)
 *
 * 2. Non-Blocking Operations (void):
 *    - Used for fire-and-forget operations (logging, analytics)
 *    - Doesn't block agent response
 *    - Example: trackUsage in agents.ts
 *
 * 3. Tool Call Parallelism:
 *    - Agent Component lets LLM decide tool call parallelism
 *    - Independent tools CAN be called in parallel by LLM
 *    - Dependent tools (need output of previous) run sequentially
 *    - No config needed - handled automatically
 */

"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { ToolCtx } from "@convex-dev/agent";
import { Id } from "./_generated/dataModel";
import { extractZipFromQuery, getUserMetadata } from "./lib/utils";

/**
 * 1. getResources - Resource search with graceful degradation
 * No ZIP → national resources, Has ZIP → local, Has score → targeted by worst zone
 */
export const getResources = createTool({
  description:
    "Search for caregiving resources. Works progressively: returns national resources if no ZIP code, local resources if ZIP provided, and targeted resources if user has a score and worst zone identified. If user mentions a ZIP code in their message, extract it and use it in the query.",
  args: z.object({
    query: z
      .string()
      .describe(
        "Natural language query for resources (e.g., 'respite care', 'support groups'). Can include zip code (e.g., 'respite care near me in 11576')."
      ),
    zone: z
      .string()
      .optional()
      .describe(
        "Optional pressure zone (P1-P6) to target resources. Use when user has a score and worst zone is known."
      ),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    resources?: string;
    sources?: Array<{ placeId: string; name: string; address?: string }>;
    widgetToken?: string;
    error?: string;
    suggestion?: string;
    message?: string;
  }> => {
    // Extract ZIP from query if present
    const zipFromQuery = extractZipFromQuery(args.query);
    
    // Get user to check for ZIP and score
    const user = await ctx.runQuery(internal.internal.users.getUser, {
      userId: ctx.userId as Id<"users">,
    });

    const metadata = getUserMetadata(user);
    const userZip = user?.zipCode || metadata.zipCode || zipFromQuery;
    const hasScore = user?.gcSdohScore !== undefined && user.gcSdohScore !== null;

    // Call resource search with graceful degradation
    const result = await ctx.runAction(internal.resources.searchResources, {
      userId: ctx.userId as Id<"users">,
      query: args.query,
      zipCode: userZip || undefined,
      zone: args.zone || undefined,
      hasScore,
    });
    
    // Handle error responses
    if ('error' in result) {
      return {
        error: result.error,
        suggestion: result.suggestion,
        message: result.message,
        resources: result.message || result.suggestion || 'Unable to search resources at this time.',
      };
    }
    
    return result;
  },
});

/**
 * 2. startAssessment - Begin assessment session (EMA or SDOH only)
 */
export const startAssessment = createTool({
  description:
    "Begin a wellness assessment (EMA or SDOH-28). EMA is a quick 3-question daily check-in. SDOH-28 is a comprehensive 28-question assessment that should only be suggested if user has never taken it or it's been 30+ days since last completion.",
  args: z.object({
    assessmentType: z
      .enum(["ema", "sdoh"])
      .describe("Type of assessment to start: 'ema' for daily check-in, 'sdoh' for comprehensive assessment"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    message: string;
    nextStep: string;
  }> => {
    const result = await ctx.runMutation(
      internal.internal.assessments.startAssessment,
      {
        userId: ctx.userId as Id<"users">,
        assessmentType: args.assessmentType,
      }
    );
    return result;
  },
});

/**
 * 3. recordObservation - Infer P2 (Physical Health) from conversation
 */
export const recordObservation = createTool({
  description:
    "Record observations about the user's physical health from conversation. Use when user mentions physical symptoms like exhaustion, pain, sleep issues, or health concerns. This updates the P2 (Physical Health) zone score.",
  args: z.object({
    observation: z
      .string()
      .describe("What the user said about their physical health (e.g., 'I'm exhausted', 'I have back pain', 'I can't sleep')"),
    zone: z
      .string()
      .optional()
      .describe("Pressure zone (defaults to P2 for physical health, but can specify other zones if relevant)"),
    severity: z
      .number()
      .min(1)
      .max(5)
      .describe("Severity level (1=mild, 5=severe) based on language intensity"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const zone = args.zone || "P2"; // Default to P2 (Physical Health)
    
    // Convert severity (1-5) to zone score (0-100)
    // Higher severity = higher score (more stress)
    const zoneScore = ((args.severity - 1) / 4) * 100;

    await ctx.runMutation(internal.internal.score.updateZone, {
      userId: ctx.userId as Id<"users">,
      zone,
      value: zoneScore,
    });

    return {
      success: true,
      message: `Recorded observation about ${zone === "P2" ? "physical health" : zone}`,
    };
  },
});

/**
 * 4. recordMemory - Persist important context
 */
export const recordMemory = createTool({
  description:
    "Save key caregiving context so we don't have to ask again. Use for routines, preferences, triggers, or intervention results. Keep it short.",
  args: z.object({
    content: z.string().min(3).max(500),
    category: z.enum([
      "care_routine",
      "preference",
      "intervention_result",
      "crisis_trigger",
      "family_health",
    ]),
    importance: z.number().min(1).max(10).default(7),
  }),
  handler: async (ctx: ToolCtx, args) => {
    await ctx.runMutation(internal.internal.memories.recordMemory, {
      userId: ctx.userId as Id<"users">,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });

    return {
      success: true,
      message: "Saved to your profile so I can remember it.",
    };
  },
});

/**
 * 5. trackInterventionHelpfulness - Simple "Did this help?" tracking
 */
export const trackInterventionHelpfulness = createTool({
  description:
    "Track whether a resource or intervention was helpful to the user. Simple yes/no feedback for closed-loop learning.",
  args: z.object({
    resourceId: z
      .string()
      .describe("ID of the resource or intervention the user interacted with"),
    helpful: z
      .boolean()
      .describe("Whether the resource was helpful (true) or not helpful (false)"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<{ success: boolean }> => {
    await ctx.runMutation(internal.internal.learning.trackHelpfulnessMutation, {
      userId: ctx.userId as Id<"users">,
      resourceId: args.resourceId,
      helpful: args.helpful,
    });
    return { success: true };
  },
});

/**
 * 6. findInterventions - Recommend micro-interventions matched to user zones
 */
export const findInterventions = createTool({
  description:
    "Recommend 1-3 micro-interventions matched to user's pressure zones (P1-P6). Use after assessments or when zones are referenced in conversation.",
  args: z.object({
    zones: z
      .array(z.string())
      .describe("Pressure zones to match interventions (e.g., ['P1', 'P6'])"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of interventions to return (default: 3)"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    interventions: Array<{
      _id: string;
      title: string;
      description: string;
      category: string;
      duration: string;
      content: string;
    }>;
  }> => {
    const result = await ctx.runQuery(internal.interventions.findInterventions, {
      zones: args.zones,
      limit: args.limit || 3,
    });

    return {
      interventions: result.map((intervention: any) => ({
        _id: intervention._id,
        title: intervention.title,
        description: intervention.description,
        category: intervention.category,
        duration: intervention.duration,
        content: intervention.content,
      })),
    };
  },
});

/**
 * 7. checkAssessmentStatus - Check user's assessment history and burnout score
 */
export const checkAssessmentStatus = createTool({
  description:
    "Check if user has completed assessments and what their current burnout score is. Use when user asks about burnout tracking or 'how are you tracking me'. Returns assessment history and current score if available.",
  args: z.object({}),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    hasSDOH: boolean;
    hasEMA: boolean;
    currentScore: number | null;
    lastSDOHDate: number | null;
    lastEMADate: number | null;
    lastSDOHScore: number | null;
    lastEMAScore: number | null;
    message: string;
  }> => {
    const userId = ctx.userId as Id<"users">;

    // Parallel: Get user + latest assessments (3 queries at once)
    const [user, lastSDOH, lastEMA] = await Promise.all([
      ctx.runQuery(internal.internal.users.getUser, { userId }),
      ctx.runQuery(
        internal.internal.assessments.getLatestCompletedAssessment,
        { userId, assessmentType: "sdoh" }
      ),
      ctx.runQuery(
        internal.internal.assessments.getLatestCompletedAssessment,
        { userId, assessmentType: "ema" }
      ),
    ]);

    const currentScore = user?.gcSdohScore || null;
    const hasSDOH = lastSDOH !== null;
    const hasEMA = lastEMA !== null;
    const lastSDOHDate = lastSDOH?.completedAt || null;
    const lastEMADate = lastEMA?.completedAt || null;
    const lastSDOHScore = lastSDOH?.gcBurnout || null;
    const lastEMAScore = lastEMA?.gcBurnout || null;

    // Build helpful message for agent
    let message = "";
    if (hasSDOH && currentScore !== null) {
      const dateStr = new Date(lastSDOHDate!).toLocaleDateString();
      message = `User has SDOH assessment. Last score: ${currentScore} (completed ${dateStr}).`;
    } else if (hasEMA && !hasSDOH) {
      message = "User has EMA check-ins but no full SDOH assessment yet.";
    } else {
      message = "User has not completed any assessments yet.";
    }

    return {
      hasSDOH,
      hasEMA,
      currentScore,
      lastSDOHDate,
      lastEMADate,
      lastSDOHScore,
      lastEMAScore,
      message,
    };
  },
});

/**
 * 8. updateProfile - Update key profile fields
 */
export const updateProfile = createTool({
  description:
    "Update user profile fields like first name, care recipient name, relationship, zip, or timezone. Use soft confirmations before updating.",
  args: z.object({
    field: z.enum([
      "firstName",
      "careRecipientName",
      "relationship",
      "zipCode",
      "timezone",
      "checkInFrequency",
    ]),
    value: z.string().min(1).max(200),
  }),
  handler: async (ctx: ToolCtx, args) => {
    await ctx.runMutation(internal.internal.users.updateProfile, {
      userId: ctx.userId as Id<"users">,
      field: args.field,
      value: args.value,
    });

    return { success: true, message: "Profile updated." };
  },
});

/**
 * 9. startAssessmentTool - Begin assessment (Agent-Based Flow)
 * Returns first question for agent to deliver in conversation
 */
export const startAssessmentTool = createTool({
  description:
    "Begin a wellness assessment and get the first question to ask. Use for EMA (3-question daily check-in) or SDOH-28 (comprehensive assessment). Returns first question with progress indicator.",
  args: z.object({
    assessmentType: z
      .enum(["ema", "sdoh"])
      .describe("Type of assessment: 'ema' for daily check-in, 'sdoh' for comprehensive assessment"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    question?: string;
    progress?: string;
    totalQuestions?: number;
    message?: string;
    error?: string;
  }> => {
    const userId = ctx.userId as Id<"users">;

    // Check for existing active session
    const existingSession = await ctx.runQuery(
      internal.internal.assessments.getActiveSession,
      { userId }
    );

    if (existingSession) {
      return {
        success: false,
        error: "User already has an assessment in progress.",
        message: "Let's finish your current assessment first. Reply 1-5 or skip to continue.",
      };
    }

    // Start assessment session (creates session in DB)
    const result = await ctx.runMutation(
      internal.internal.assessments.startAssessmentForAgent,
      {
        userId,
        assessmentType: args.assessmentType,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.message,
        message: result.message,
      };
    }

    return {
      success: true,
      question: result.firstQuestion,
      progress: result.progress,
      totalQuestions: result.totalQuestions,
    };
  },
});

/**
 * 10. recordAssessmentAnswerTool - Record answer and get next question
 * Agent-based assessment flow - validates answer and returns next question or completion
 */
export const recordAssessmentAnswerTool = createTool({
  description:
    "Record user's answer to current assessment question. Accepts 1-5 rating or 'skip'. Returns next question with progress, or completion status with score/zones if assessment is finished.",
  args: z.object({
    answer: z
      .string()
      .describe("User's answer: number 1-5 or the word 'skip'"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    complete?: boolean;
    nextQuestion?: string;
    progress?: string;
    score?: number;
    band?: string;
    worstZone?: string;
    worstZoneName?: string;
    error?: string;
    message?: string;
  }> => {
    const userId = ctx.userId as Id<"users">;

    // Validate answer format
    const trimmed = args.answer.trim().toLowerCase();
    let validatedAnswer: number | "skip" | null = null;

    if (trimmed === "skip") {
      validatedAnswer = "skip";
    } else {
      const parsed = Number(args.answer.trim());
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5) {
        validatedAnswer = parsed;
      }
    }

    if (validatedAnswer === null) {
      return {
        success: false,
        error: "Invalid answer format",
        message: "Please reply with a number 1-5 or say skip.",
      };
    }

    // Process answer
    const result = await ctx.runMutation(
      internal.internal.assessments.processAssessmentAnswerForAgent,
      {
        userId,
        answer: validatedAnswer,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.message,
        message: result.message,
      };
    }

    // Check if assessment is complete
    if (result.complete) {
      return {
        success: true,
        complete: true,
        score: result.score,
        band: result.band,
        worstZone: result.worstZone,
        worstZoneName: result.worstZoneName,
      };
    }

    // Return next question
    return {
      success: true,
      complete: false,
      nextQuestion: result.nextQuestion,
      progress: result.progress,
    };
  },
});

/**
 * 11. getCrisisResources - Get immediate crisis resources
 * Returns crisis hotlines and immediate support resources
 */
export const getCrisisResources = createTool({
  description:
    "Get immediate crisis resources including suicide hotline (988) and crisis text line. Use IMMEDIATELY when user expresses suicidal thoughts or immediate crisis.",
  args: z.object({}),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    resources: string;
    hotlines: Array<{ name: string; number: string; description: string }>;
  }> => {
    const hotlines = [
      {
        name: "988 Suicide & Crisis Lifeline",
        number: "988",
        description: "24/7 free and confidential support for people in distress",
      },
      {
        name: "Crisis Text Line",
        number: "Text HOME to 741741",
        description: "Free 24/7 support via text message",
      },
      {
        name: "National Domestic Violence Hotline",
        number: "1-800-799-7233",
        description: "Support for domestic violence situations",
      },
    ];

    const resourceText = `🆘 IMMEDIATE HELP:

• 988 Suicide & Crisis Lifeline: Call/text 988 (24/7, free, confidential)
• Crisis Text Line: Text HOME to 741741
• National DV Hotline: 1-800-799-7233

You're not alone. These trained counselors are available right now.`;

    // Log crisis event
    await ctx.runMutation(internal.internal.learning.logGuardrailEvent, {
      userId: ctx.userId as Id<"users">,
      type: "crisis",
      severity: "high",
      context: { timestamp: Date.now(), source: "getCrisisResources tool" },
    });

    return {
      success: true,
      resources: resourceText,
      hotlines,
    };
  },
});

/**
 * 12. checkOnboardingStatus - Check onboarding completion status
 * Returns what critical data has been collected and what's missing
 */
export const checkOnboardingStatus = createTool({
  description:
    "Check which onboarding steps are complete. Use to avoid re-asking for information already provided. Returns what data is missing and what to ask for next.",
  args: z.object({}),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    hasName: boolean;
    hasZip: boolean;
    hasBaselineAssessment: boolean;
    hasCheckInPreference: boolean;
    completedMilestones: string[];
    completionPercent: number;
    nextStep: string | null;
    isComplete: boolean;
  }> => {
    const userId = ctx.userId as Id<"users">;
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    const metadata = getUserMetadata(user);

    const hasName = !!metadata.firstName || !!metadata.profile?.firstName;
    const hasZip = !!metadata.zipCode || !!user?.zipCode;
    const hasBaselineAssessment = !!metadata.firstAssessmentCompletedAt;
    const hasCheckInPreference = !!metadata.checkInFrequency;

    const milestones = metadata.onboardingMilestones || [];
    const completedMilestones = milestones.map((m: any) => m.milestone);

    // Determine next step
    let nextStep: string | null = null;
    if (!hasName) {
      nextStep = "name";
    } else if (!hasZip) {
      nextStep = "zip";
    } else if (!hasBaselineAssessment) {
      nextStep = "assessment";
    } else if (!hasCheckInPreference) {
      nextStep = "checkin";
    }

    const isComplete = hasName && hasZip && hasBaselineAssessment && hasCheckInPreference;
    const completionPercent = Math.round(
      ([hasName, hasZip, hasBaselineAssessment, hasCheckInPreference].filter(Boolean).length / 4) * 100
    );

    return {
      hasName,
      hasZip,
      hasBaselineAssessment,
      hasCheckInPreference,
      completedMilestones,
      completionPercent,
      nextStep,
      isComplete,
    };
  },
});
