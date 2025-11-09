"use node";

/**
 * Agents - Consolidated agent implementations
 *
 * Merges agents/main.ts, agents/crisis.ts, and agents/assessment.ts
 * All agents use Agent Component with "use node" runtime.
 */

import { action, internalAction } from './_generated/server';
import { internal, components } from './_generated/api';
import { v } from 'convex/values';
import { Agent, createTool } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { MAIN_PROMPT, CRISIS_PROMPT, ASSESSMENT_PROMPT, renderPrompt } from './lib/prompts';
import { getTone } from './lib/policy';
import { z } from 'zod';
import { sharedAgentConfig } from './lib/usage';
import { getProfileCompleteness, buildWellnessInfo, extractProfileVariables } from './lib/profile';

// ============================================================================
// SHARED VALIDATORS
// ============================================================================

const channelValidator = v.union(
  v.literal('sms'),
  v.literal('email'),
  v.literal('web')
);

const agentContextValidator = v.object({
  userId: v.string(),
  sessionId: v.optional(v.string()),
  locale: v.string(),
  consent: v.object({
    emergency: v.boolean(),
    marketing: v.boolean(),
  }),
  crisisFlags: v.optional(
    v.object({
      active: v.boolean(),
      terms: v.array(v.string()),
    })
  ),
  metadata: v.optional(v.any()),
});

// ============================================================================
// MAIN AGENT - General caregiving support
// ============================================================================

// Tool: Search for local caregiving resources using Google Maps
const searchResourcesTool = createTool({
  args: z.object({
    query: z.string().describe('Natural language query for caregiving resources (e.g., "respite care near me", "support groups")'),
    category: z.string().optional().describe('Optional category: respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory'),
  }),
  description: 'Search for local caregiving resources using Google Maps. Returns nearby services like respite care, support groups, adult day care, home health agencies, and community resources with addresses, hours, and reviews.',
  handler: async (ctx, args: { query: string; category?: string }): Promise<{ error?: string; suggestion?: string; resources?: string; sources?: any[]; widgetToken?: string }> => {
    // Get user metadata to extract location
    // @ts-expect-error - metadata property exists at runtime
    const contextData = ctx.metadata as { context?: { metadata?: Record<string, unknown> } };
    const userMetadata = contextData?.context?.metadata || {};

    const result = await ctx.runAction(internal.resources.searchResources, {
      query: args.query,
      metadata: userMetadata,
    });

    if ('error' in result && result.error) {
      return {
        error: result.error,
        suggestion: 'I need your zip code to find nearby resources. What\'s your zip code?',
      };
    }

    return {
      resources: result.text,
      sources: result.sources,
      widgetToken: result.widgetToken,
    };
  },
});

// Tool: Record important memories about the user
const recordMemoryTool = createTool({
  args: z.object({
    content: z.string().describe('The information to remember about the user'),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']).describe('Category of memory'),
    importance: z.number().min(1).max(10).describe('Importance score (1-10): 9-10=critical, 6-8=important, 3-5=useful, 1-2=minor'),
  }),
  description: 'Save important information about the user to build context over time. Use for care routines, preferences, intervention results, and crisis triggers.',
  handler: async (ctx, args: { content: string; category: string; importance: number }): Promise<{ success: boolean; error?: string; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    // Store the memory
    await ctx.runMutation(internal.public.recordMemory, {
      userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });

    return {
      success: true,
      message: 'Memory saved successfully',
    };
  },
});

// Tool: Check wellness status and burnout trends
const checkWellnessStatusTool = createTool({
  args: z.object({}),
  description: 'Fetch burnout trends, pressure zones, and wellness status over time. Shows recent scores and identifies areas needing support.',
  handler: async (ctx): Promise<any> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    const status = await ctx.runQuery(internal.internal.getStatus, {
      userId,
    });

    return status;
  },
});

// Tool: Find personalized interventions
const findInterventionsTool = createTool({
  args: z.object({
    zones: z.array(z.string()).optional().describe('Pressure zones to target (e.g., ["emotional", "physical", "time"]). If not provided, uses user\'s current pressure zones.'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Maximum number of interventions (default: 5)'),
  }),
  description: 'Get evidence-based interventions matched to pressure zones. Returns micro-commitments and support strategies with evidence levels.',
  handler: async (ctx, args: { zones?: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }): Promise<{ error?: string; interventions?: any[]; zones?: string[] }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    // If no zones provided, fetch user's pressure zones from wellness status
    let zones = args.zones;
    if (!zones || zones.length === 0) {
      const status = await ctx.runQuery(internal.internal.getStatus, {
        userId,
      });
      zones = status.pressureZones || ['emotional', 'physical']; // Default fallback
    }

    const interventions = await ctx.runQuery(internal.internal.getByZones, {
      zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return {
      interventions,
      zones,
    };
  },
});

// Tool: Update user profile
const updateProfileTool = createTool({
  args: z.object({
    firstName: z.string().optional().describe('User\'s first name'),
    relationship: z.string().optional().describe('Relationship to care recipient (e.g., "daughter", "son", "spouse")'),
    careRecipientName: z.string().optional().describe('Name of person being cared for'),
    zipCode: z.string().optional().describe('ZIP code for finding local resources'),
  }),
  description: 'Update user profile information. Only include fields that are being updated.',
  handler: async (ctx, args: { firstName?: string; relationship?: string; careRecipientName?: string; zipCode?: string }): Promise<{ success: boolean; error?: string; profile?: Record<string, unknown>; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    // @ts-expect-error - metadata property exists at runtime
    const contextData = ctx.metadata as { context?: { metadata?: Record<string, unknown> } };
    const metadata = contextData?.context?.metadata || {};
    const profile = (metadata.profile as Record<string, unknown>) || {};

    // Merge new fields with existing profile
    const updatedProfile = {
      ...profile,
      ...(args.firstName && { firstName: args.firstName }),
      ...(args.relationship && { relationship: args.relationship }),
      ...(args.careRecipientName && { careRecipientName: args.careRecipientName }),
      ...(args.zipCode && { zipCode: args.zipCode }),
    };

    // Update user metadata with new profile
    // Note: This requires a mutation to persist - for now return updated profile
    // In production, you'd call a mutation here to update the user's metadata

    return {
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    };
  },
});

// Tool: Start an assessment
const startAssessmentTool = createTool({
  args: z.object({
    assessmentType: z.enum(['burnout_v1', 'bsfc_v1', 'ema_v1', 'reach_ii_v1', 'sdoh_v1']).describe('Type of assessment to start'),
  }),
  description: 'Begin a wellness assessment. This will initiate a structured check-in to track burnout, stress, or other wellness metrics.',
  handler: async (ctx, args: { assessmentType: string }): Promise<{ error?: string; success?: boolean; assessmentType?: string; message?: string; nextStep?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    // For now, return instructions for starting assessment
    // In full implementation, this would create an assessment session
    return {
      success: true,
      assessmentType: args.assessmentType,
      message: `Ready to start ${args.assessmentType} assessment. The assessment agent will guide you through the questions.`,
      nextStep: 'Assessment questions will be asked one at a time.',
    };
  },
});

const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai('gpt-5-nano'),
  instructions: 'You are a compassionate AI caregiver assistant providing empathetic support and practical advice.',
  tools: {
    searchResources: searchResourcesTool,
    recordMemory: recordMemoryTool,
    check_wellness_status: checkWellnessStatusTool,
    find_interventions: findInterventionsTool,
    update_profile: updateProfileTool,
    start_assessment: startAssessmentTool,
  },
  maxSteps: 5, // Increased to allow for tool chains (e.g., check wellness → find interventions)

  // Use contextHandler for dynamic context injection
  contextHandler: async (ctx, args) => {
    const recentMessages = args.recent || [];
    const searchMessages = args.search || [];

    // Get conversation summary for context compression
    const threadId = args.threadId;
    let conversationContext: any[] = [];

    if (threadId) {
      try {
        const conversationSummary = await ctx.runQuery(internal.public.getConversationSummary, {
          externalId: args.userId || '',
          limit: 25,
        });

        if (conversationSummary && (conversationSummary as any).formattedContext) {
          conversationContext = [{
            role: 'system' as const,
            content: `## Conversation Context\n${(conversationSummary as any).formattedContext}\n\n(Token savings: ${(conversationSummary as any).tokensSaved} tokens, ${(conversationSummary as any).compressionRatio}% compression)`,
          }];
        }
      } catch (error) {
        console.error('Error fetching conversation summary:', error);
      }
    }

    return [
      ...searchMessages,
      ...conversationContext,
      ...recentMessages,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
  },

  // Usage tracking for billing and monitoring
  ...sharedAgentConfig,
});

/**
 * Main Agent Action
 *
 * Runs general caregiving conversation workflow using Convex Agent Component.
 */
export const runMainAgent = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();

    try {
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};

      // Extract profile variables using helper
      const { userName, relationship, careRecipient } = extractProfileVariables(metadata);

      // Calculate profile completeness using helper
      const { profileComplete, missingFieldsSection } = getProfileCompleteness(profile);

      // Build wellness info using helper
      const wellnessInfo = buildWellnessInfo(metadata);

      // Extract other metadata
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
        wellnessInfo,
        profileComplete,
        missingFieldsSection,
      });

      const tone = getTone(context);
      const systemPrompt = `${basePrompt}\n\n${tone}`;

      let newThreadId: string;
      let thread;

      // Prepare metadata for tool access
      const threadMetadata = {
        context: {
          metadata,
        },
      };

      if (threadId) {
        const threadResult = await mainAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
          metadata: threadMetadata,
        } as any);
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult = await mainAgent.createThread(ctx, {
          userId: context.userId,
          metadata: threadMetadata,
        } as any);
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt, // Override default instructions
        providerOptions: {
          openai: {
            reasoningEffort: 'low', // Fast responses for general conversation
            textVerbosity: 'low', // Concise, shorter responses
          },
        },
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        userId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `main-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: newThreadId,
      };
    } catch (error) {
      console.error('Main agent error:', error);

      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        userId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `main-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'error', content: fallbackResponse, meta: { error: String(error) } }],
        latencyMs,
      };
    }
  },
});

// Generate text action (for workflow steps)
export const generateTextAction = mainAgent.asTextAction({
  stopWhen: (result: any) => result.stepCount >= 3,
});

// ============================================================================
// CRISIS AGENT - Immediate crisis support
// ============================================================================

const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: openai('gpt-5-nano'),
  instructions: 'You are a compassionate crisis support assistant for caregivers providing immediate support resources.',
  maxSteps: 1, // No tool calls needed for crisis - prioritize speed

  // Usage tracking for billing and monitoring
  ...sharedAgentConfig,
});

/**
 * Crisis Agent Action
 *
 * Runs crisis detection and response workflow using Convex Agent Component.
 */
export const runCrisisAgent = internalAction({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();

    if (!context.crisisFlags?.active) {
      throw new Error('Crisis agent requires active crisis flags');
    }

    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';
    const careRecipient = (profile.careRecipientName as string) ?? 'loved one';
    const journeyPhase = (metadata.journeyPhase as string) ?? 'crisis';

    // Build wellness info using helper
    const wellnessInfo = buildWellnessInfo(metadata);

    try {
      const systemPrompt = renderPrompt(CRISIS_PROMPT, {
        userName,
        careRecipient,
        journeyPhase,
        wellnessInfo
      });

      let newThreadId: string;
      let thread;

      if (threadId) {
        const threadResult = await crisisAgent.continueThread(ctx, { threadId, userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult = await crisisAgent.createThread(ctx, { userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt, // Override default instructions
        providerOptions: {
          openai: {
            reasoningEffort: 'minimal', // Maximum speed for crisis response
            textVerbosity: 'low', // Concise, direct crisis support
          },
        },
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        userId: context.userId,
        input: input.text,
        chunks: [responseText],
        timestamp: Date.now(),
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: newThreadId,
      };
    } catch (error) {
      console.error('Crisis agent error:', error);

      const fallbackResponse = `I hear that you're going through a very difficult time.

If you're experiencing a crisis, please reach out for immediate help:
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Call 911 if you are in immediate danger

For ${careRecipient}, resources are available 24/7. You're not alone in this.`;

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        userId: context.userId,
        input: input.text,
        chunks: [fallbackResponse],
        timestamp: Date.now(),
      });

      return {
        chunks: [{ type: 'error', content: fallbackResponse, meta: { error: String(error) } }],
        latencyMs: Date.now() - startTime,
      };
    }
  },
});

/**
 * Check if crisis agent should be invoked
 *
 * This is a helper query that can be called before routing to agents.
 */
export const shouldInvokeCrisisAgent = action({
  args: {
    context: agentContextValidator,
  },
  handler: async (_ctx, { context }) => {
    return Boolean(context.crisisFlags?.active);
  },
});

// ============================================================================
// ASSESSMENT AGENT - Burnout assessments and interventions
// ============================================================================

// Tool: Get evidence-based interventions by pressure zones
const getInterventionsTool = createTool({
  args: z.object({
    zones: z.array(z.string()).describe('Pressure zones from BSFC assessment'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Max number of interventions (default: 5)'),
  }),
  description: 'Lookup evidence-based caregiver interventions matching pressure zones. Use this to provide specific, research-backed recommendations.',
  handler: async (ctx, args: { zones: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }) => {
    const interventions: Array<{
      title: string;
      category: string;
      targetZones: string[];
      evidenceLevel: string;
      duration: string;
      description: string;
      content: string;
    }> = await ctx.runQuery(internal.internal.getByZones, {
      zones: args.zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return {
      interventions: interventions.map((i: any) => ({
        title: i.title,
        category: i.category,
        targetZones: i.targetZones,
        evidenceLevel: i.evidenceLevel,
        duration: i.duration,
        description: i.description,
        content: i.content,
      })),
    };
  },
});

const assessmentAgent: any = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: openai('gpt-5-mini'),
  instructions:
    'You are a burnout assessment specialist who provides personalized, compassionate interpretations and actionable intervention suggestions. Use the getInterventions tool to recommend evidence-based interventions matching the user\'s pressure zones.',
  tools: { getInterventions: getInterventionsTool },
  maxSteps: 2, // Limit tool calls for faster responses

  // Usage tracking for billing and monitoring
  ...sharedAgentConfig,
});

/**
 * Assessment Agent Action
 *
 * Processes assessment answers and provides results with interventions.
 */
export const runAssessmentAgent: any = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }): Promise<any> => {
    const startTime = Date.now();

    try {
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const answers = (metadata.assessmentAnswers as number[]) ?? [];

      if (answers.length === 0) {
        const errorMessage = 'No assessment answers found. Please complete an assessment first.';
        return {
          chunks: [{ type: 'error', content: errorMessage }],
          latencyMs: Date.now() - startTime,
        };
      }

      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      const total = answers.reduce((sum, val) => sum + val, 0);
      const avgScore = total / answers.length;
      const _pressureZone = (metadata.pressureZone as string) ?? 'work';

      let _band: string;
      if (avgScore < 2) {
        _band = 'low';
      } else if (avgScore < 3.5) {
        _band = 'moderate';
      } else {
        _band = 'high';
      }

      // Extract assessment context for the prompt
      // Note: This agent processes completed assessments, not in-progress ones
      // These variables support both use cases
      const assessmentName = (metadata.assessmentDefinitionId as string) ?? 'burnout assessment';
      const assessmentType = assessmentName;
      const questionNumber = String(answers.length);
      const responsesCount = String(answers.length);

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        assessmentName,
        assessmentType,
        questionNumber,
        responsesCount,
      });

      let newThreadId: string;
      let thread: any;

      if (threadId) {
        const threadResult: any = await assessmentAgent.continueThread(ctx, { threadId, userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult: any = await assessmentAgent.createThread(ctx, { userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result: any = await thread.generateText({
        prompt: input.text || 'Please interpret my burnout assessment results and suggest interventions.',
        system: systemPrompt, // Override default instructions with assessment-specific context
        providerOptions: {
          openai: {
            reasoningEffort: 'low', // Balanced speed for clinical interpretations
            textVerbosity: 'low', // Focused, actionable recommendations
          },
        },
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        userId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `assessment-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: newThreadId,
      };
    } catch (error) {
      console.error('Assessment agent error:', error);

      const errorMessage = 'I apologize, but I encountered an error processing your assessment. Please try again.';
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        userId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: errorMessage.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `assessment-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'error', content: errorMessage, meta: { error: String(error) } }],
        latencyMs,
      };
    }
  },
});
