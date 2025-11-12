"use node";

/**
 * Consolidated Agents
 *
 * All 3 agents (Main, Crisis, Assessment) in one file.
 * Simplified: Removed error infrastructure, inlined error handling.
 */

import { action, internalAction } from './_generated/server';
import { internal, components } from './_generated/api';
import { v } from 'convex/values';
import { Agent, saveMessage } from '@convex-dev/agent';
import { WorkflowManager } from '@convex-dev/workflow';
import { LANGUAGE_MODELS, EMBEDDING_MODELS } from './lib/models';
import { MAIN_PROMPT, CRISIS_PROMPT, ASSESSMENT_PROMPT, renderPrompt } from './lib/prompts';
import {
  getOrCreateThreadId,
  getTone,
  crisisResponse,
  extractProfileVariables,
  buildWellnessInfo,
  getNextMissingField,
  handleAgentError,
} from './lib/utils';
import type { UserProfile } from './lib/types';
import { agentContextValidator, channelValidator } from './lib/validators';
import {
  searchResources,
  recordMemory,
  checkWellnessStatus,
  findInterventions,
  updateProfile,
  startAssessment,
  trackInterventionPreference,
  getInterventions,
} from './tools';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITIONS
// ============================================================================

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: LANGUAGE_MODELS.main,
  textEmbeddingModel: EMBEDDING_MODELS.default,
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
    track_intervention_preference: trackInterventionPreference,
  },
  maxSteps: 5,
});

export const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: LANGUAGE_MODELS.crisis,
  textEmbeddingModel: EMBEDDING_MODELS.default,
  instructions: CRISIS_PROMPT,
  maxSteps: 1,
});

export const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: LANGUAGE_MODELS.assessment,
  textEmbeddingModel: EMBEDDING_MODELS.default,
  instructions: ASSESSMENT_PROMPT,
  tools: { getInterventions },
  maxSteps: 2,
});

// ============================================================================
// MAIN AGENT
// ============================================================================

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
    const traceId = `main-${Date.now()}`;

    // Extract metadata once at start - reuse throughout handler
    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as UserProfile | undefined);
    const { userName, relationship, careRecipient } = extractProfileVariables(profile);
    const wellnessInfo = buildWellnessInfo(metadata);
    const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
    const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);
    const convexUserId = (metadata.convex as Record<string, unknown> | undefined)?.userId;

    try {

      const needsLocalResources = input.text.match(/(respite|support group|local resource|near me|in my area|find.*near|help.*near)/i);
      const nextField = getNextMissingField(profile, { needsLocalResources: !!needsLocalResources });
      const missingFieldsSection = nextField
        ? `\n\nPROFILE GUIDANCE:\n${nextField.prompt}\nCheck recent context - if already asked this session, skip.`
        : '';
      const profileComplete = nextField === null ? 'true' : 'false';

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

      const systemPrompt = `${basePrompt}\n\n${getTone(context)}`;

      // Get or create threadId (with caching)
      const finalThreadId = await getOrCreateThreadId(
        ctx,
        mainAgent,
        context.userId,
        threadId,
        metadata
      );

      // Cache threadId in user metadata for next request (non-blocking)
      if (!threadId && finalThreadId && convexUserId) {
        const updatedMetadata = {
          ...metadata,
          convex: {
            ...(metadata.convex as Record<string, unknown> | undefined),
            threadId: finalThreadId,
          },
        };
        ctx.runMutation(internal.internal.updateUserMetadata, {
          userId: convexUserId as any,
          metadata: updatedMetadata,
        }).catch((err) => console.error('[main-agent] Failed to cache threadId:', err));
      }

      // Continue thread directly (Agent Component handles message loading)
      const { thread } = await mainAgent.continueThread(ctx, {
        threadId: finalThreadId,
        userId: context.userId,
      });

      const trimmedInput = input.text.trim();
      const isVeryShortInput = trimmedInput.length < 5;
      const needsOnboarding = nextField !== null;

      // True fast path: Very short inputs get simple deterministic response
      // Saves ~2-3s by avoiding LLM call for simple greetings/acknowledgments
      if (isVeryShortInput) {
        let fastResponse = `Hi ${userName}! I'm here to help.`;

        // Include next missing field prompt if profile is incomplete
        if (needsOnboarding && nextField) {
          fastResponse += `\n\nTo better support you, ${nextField.prompt}`;
        } else {
          fastResponse += `

What's on your mind today? You can ask me about:
- Caregiving tips
- Local resources
- Managing stress
- Or anything else you need support with

What would be most helpful right now?`;
        }

        // Save user message and assistant response (Agent Component pattern)
        await saveMessage(ctx, components.agent, {
          threadId: finalThreadId,
          prompt: input.text,
        });
        await saveMessage(ctx, components.agent, {
          threadId: finalThreadId,
          message: { role: 'assistant', content: fastResponse },
          agentName: 'Caregiver Support',
        });

        return {
          text: fastResponse,
          threadId: finalThreadId,
          latencyMs: Date.now() - startTime,
          fastPath: true,
        };
      }

      // Simplified context options - use sensible defaults with minimal overrides
      const isFirstTurn = !threadId;
      const contextOptions = isFirstTurn
        ? {
            searchOtherThreads: false,
            recentMessages: 1,
          }
        : {
            searchOtherThreads: true, // Built-in memory search across threads
            recentMessages: 10,
            searchOptions: {
              textSearch: true,
              vectorSearch: true, // Uses embeddings automatically
              limit: 10,
            },
          };

      const LLM_TIMEOUT_MS = 4000; // 4s timeout per plan
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM response timeout after 4s')), LLM_TIMEOUT_MS);
      });

      let result;

      try {
        result = await Promise.race([
          thread.generateText({
            prompt: input.text, // Agent Component saves automatically
            system: systemPrompt,
            contextOptions,
            toolChoice: 'auto',
            providerOptions: {
              google: {
                temperature: 0.5,
                topP: 0.9,
                topK: 20,
                maxOutputTokens: 300,
                responseMimeType: 'text/plain',
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
              },
            },
          } as any), // contextOptions is valid at runtime per Convex Agents docs
          timeoutPromise,
        ]);
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          const timeoutResponse = `Hi ${userName}! I'm processing your message but it's taking longer than expected.

Here's what I can help with right now:
- Find local caregiving resources
- Answer caregiving questions
- Help manage stress

What's most urgent for you today?`;

          return {
            text: timeoutResponse,
            threadId: finalThreadId,
            latencyMs: Date.now() - startTime,
            timeout: true,
          };
        }
        throw error;
      }

      let responseText: string = result.text;
      const startsWithCode = /^(```|tool_code|print\(|def\s+\w+|import\s+|from\s+)/i.test(responseText.trim());

      if (startsWithCode) {
        responseText = responseText
          .replace(/^```[\s\S]*?```/gm, '')
          .replace(/^tool_code[\s\S]*?(?=\n\n|\n[A-Z]|$)/gim, '')
          .replace(/^print\([^)]*\)/gm, '')
          .replace(/^def\s+\w+\([^)]*\):/gm, '')
          .replace(/^import\s+[\w\s,]+/gm, '')
          .replace(/^from\s+[\w\s]+\s+import/gm, '')
          .trim();

        if (!responseText || responseText.length < 10) {
          console.warn('[main-agent] Response was entirely code');
          responseText = `Hi ${userName}! I'm here to help. What's on your mind today?`;
        }
      } else {
        responseText = responseText.replace(/```[\s\S]*?```/g, '').trim();
      }

      const latencyMs = Date.now() - startTime;

      const logPromise = ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: result.steps?.length ?? 0,
        },
        latencyMs,
        traceId,
      });
      logPromise.catch((err) => console.error('[main-agent] Logging failed:', err));

      return {
        text: responseText,
        threadId: finalThreadId,
        latencyMs,
      };
    } catch (error) {
      // Use already-extracted variables (no need to re-extract metadata)
      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      return await handleAgentError(ctx, error, {
        agentName: 'main',
        externalId: context.userId,
        policyBundle: 'default_v1',
        inputText: input.text,
        fallbackResponse,
        startTime,
        traceId,
      });
    }
  },
});

// ============================================================================
// INTERNAL VERSION OF MAIN AGENT (for use within Convex only)
// ============================================================================

/**
 * Internal version of runMainAgent - for use within Convex only
 * Provides richer context validation and avoids public API rate limits
 */
export const runMainAgentInternal = internalAction({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Call the public action via runAction - internal actions can call public actions
    const { api } = await import('./_generated/api');
    return ctx.runAction(api.agents.runMainAgent, args);
  },
});

// ============================================================================
// CRISIS AGENT
// ============================================================================

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
    const traceId = `crisis-${Date.now()}`;

    if (!context.crisisFlags?.active) {
      throw new Error('Crisis agent requires active crisis flags');
    }

    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const convexMetadata = (metadata.convex as Record<string, unknown> | undefined) ?? {};
    const userId = convexMetadata.userId as string | undefined;

    if (!userId) {
      throw new Error(`User ID not found in context: ${context.userId}`);
    }

    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';

    try {
      // Get or create threadId
      const finalThreadId = await getOrCreateThreadId(
        ctx,
        crisisAgent,
        context.userId,
        threadId,
        metadata
      );

      // Continue thread directly
      const { thread } = await crisisAgent.continueThread(ctx, {
        threadId: finalThreadId,
        userId: context.userId,
      });

      const LLM_TIMEOUT_MS = 4000; // 4s timeout per plan
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM response timeout after 4s')), LLM_TIMEOUT_MS);
      });

      let result;
      try {
        result = await Promise.race([
          thread.generateText({
            prompt: input.text, // Agent Component saves automatically
            system: CRISIS_PROMPT,
            providerOptions: {
              google: {
                temperature: 0.3,
                topP: 0.9,
                maxOutputTokens: 200,
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
              },
            },
          }),
          timeoutPromise,
        ]);
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          const timeoutResponse = `I'm having trouble processing that right now. Can you try rephrasing? If this is an emergency, please call 911 or your local crisis hotline.`;
          const latencyMs = Date.now() - startTime;

          // Log timeout for observability
          ctx.runMutation(internal.internal.logAgentRunInternal, {
            externalId: context.userId,
            agent: 'crisis',
            policyBundle: 'crisis_v1',
            budgetResult: {
              usedInputTokens: input.text.length,
              usedOutputTokens: timeoutResponse.length,
              toolCalls: 0,
            },
            latencyMs,
            traceId,
          }).catch((err) => console.error('[crisis-agent] Timeout logging failed:', err));

          return {
            text: timeoutResponse,
            threadId: finalThreadId,
            latencyMs,
            timeout: true,
          };
        }
        throw error;
      }

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: responseText,
        timestamp: Date.now(),
        traceId,
      });

      // Log agent run for observability
      ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'crisis',
        policyBundle: 'crisis_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId,
      }).catch((err) => console.error('[crisis-agent] Run logging failed:', err));

      const crisisEscalationPromise = workflow.start(ctx, internal.workflows.crisisEscalation, {
        userId: userId,
        threadId: finalThreadId,
        messageText: input.text,
        crisisTerms: context.crisisFlags?.terms || [],
        severity: 'high',
      });
      crisisEscalationPromise.catch((err) => console.error('[crisis-agent] Workflow failed:', err));

      return {
        text: responseText,
        threadId: finalThreadId,
        latencyMs,
      };
    } catch (error) {
      const fallbackResponse = crisisResponse(userName);

      // Crisis agent has special logging for crisis interactions
      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: fallbackResponse,
        timestamp: Date.now(),
        traceId,
      }).catch((err) => console.error('[crisis-agent] Logging failed:', err));

      return {
        text: fallbackResponse,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// ============================================================================
// ASSESSMENT AGENT
// ============================================================================

export const runAssessmentAgent = action({
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
    const traceId = `assessment-${Date.now()}`;

    try {
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      const assessmentDefinition = (metadata.assessmentDefinitionId as string) ?? 'bsfc';
      // Query session early - needed for early returns in Q&A flow and validation
      // Cannot be deferred as it determines the response path
      // Use internal version from internal.ts (which wraps the assessment query)
      const user = await ctx.runQuery(internal.internal.getByExternalIdQuery, {
        externalId: context.userId,
      });
      if (!user) {
        return {
          text: 'I apologize, but I encountered an error. Please try again.',
          latencyMs: Date.now() - startTime,
        };
      }
      
      const session = await ctx.runQuery(internal.internal.getActiveSessionInternal, {
        userId: user._id,
        definition: assessmentDefinition as any,
      });

      // Q&A Flow - If active session, guide through questions
      if (session && session.status === 'active') {
        const catalog = await import('./lib/assessmentCatalog').then((m) => m.CATALOG);
        const assessmentCatalog = catalog[session.definitionId as 'ema' | 'bsfc' | 'reach2' | 'sdoh'];
        const currentIndex = session.questionIndex ?? 0;

        if (currentIndex < assessmentCatalog.length) {
          const question = assessmentCatalog.items[currentIndex];
          const total = assessmentCatalog.length;
          return {
            text: `(${currentIndex + 1} of ${total}) ${question.text} (Reply "skip" to move on)`,
            latencyMs: Date.now() - startTime,
          };
        }
      }

      if (!session || session.answers.length === 0) {
        return {
          text: 'No assessment answers found. Please complete an assessment first.',
          latencyMs: Date.now() - startTime,
        };
      }

      const questionNumber = String(session.answers.length);
      const responsesCount = String(session.answers.length);

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        assessmentName: session.definitionId,
        assessmentType: session.definitionId,
        questionNumber,
        responsesCount,
      });

      // Get or create threadId
      const finalThreadId = await getOrCreateThreadId(
        ctx,
        assessmentAgent,
        context.userId,
        threadId,
        metadata
      );

      // Continue thread directly
      const { thread } = await assessmentAgent.continueThread(ctx, {
        threadId: finalThreadId,
        userId: context.userId,
      });

      const promptText = input.text || 'Please interpret my burnout assessment results and suggest interventions.';

      const LLM_TIMEOUT_MS = 4000; // 4s timeout per plan
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM response timeout after 4s')), LLM_TIMEOUT_MS);
      });

      let result;
      try {
        result = await Promise.race([
          thread.generateText({
            prompt: promptText, // Agent Component saves automatically
            system: systemPrompt,
            contextOptions: {
              searchOtherThreads: true, // Built-in memory search
              recentMessages: 10,
              searchOptions: {
                textSearch: true,
                vectorSearch: true, // Uses embeddings automatically
                limit: 10,
              },
            },
            providerOptions: {
              google: {
                temperature: 0.5,
                topP: 0.9,
                maxOutputTokens: 400,
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
              },
            },
          } as any),
          timeoutPromise,
        ]);
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          const timeoutResponse = `I'm having trouble processing that right now. Can you try rephrasing?`;
          const latencyMs = Date.now() - startTime;

          // Log timeout for observability
          ctx.runMutation(internal.internal.logAgentRunInternal, {
            externalId: context.userId,
            agent: 'assessment',
            policyBundle: 'assessment_v1',
            budgetResult: {
              usedInputTokens: input.text.length,
              usedOutputTokens: timeoutResponse.length,
              toolCalls: 0,
            },
            latencyMs,
            traceId,
          }).catch((err) => console.error('[assessment-agent] Timeout logging failed:', err));

          return {
            text: timeoutResponse,
            threadId: finalThreadId,
            latencyMs,
            timeout: true,
          };
        }
        throw error;
      }

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      const assessmentLogPromise = ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: result.steps?.length ?? 0,
        },
        latencyMs,
        traceId,
      });
      assessmentLogPromise.catch((err) => console.error('[assessment-agent] Logging failed:', err));

      return {
        text: responseText,
        threadId: finalThreadId,
        latencyMs,
      };
    } catch (error) {
      const errorMessage = 'I apologize, but I encountered an error processing your assessment. Please try again.';

      return await handleAgentError(ctx, error, {
        agentName: 'assessment',
        externalId: context.userId,
        policyBundle: 'assessment_v1',
        inputText: input.text,
        fallbackResponse: errorMessage,
        startTime,
        traceId,
      });
    }
  },
});

