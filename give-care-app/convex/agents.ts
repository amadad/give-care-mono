"use node";

/**
 * Consolidated Agents
 *
 * All 3 agents (Main, Crisis, Assessment) in one file.
 * Simplified: Removed error infrastructure, inlined error handling.
 */

import { action, internalAction } from './_generated/server';
import { internal, components, api } from './_generated/api';
import { v } from 'convex/values';
import { Agent, saveMessage } from '@convex-dev/agent';
import { WorkflowManager } from '@convex-dev/workflow';
import { LANGUAGE_MODELS, EMBEDDING_MODELS } from './lib/models';
import { MAIN_PROMPT, CRISIS_PROMPT, ASSESSMENT_PROMPT, renderPrompt } from './lib/prompts';
import {
  ensureAgentThread,
  getTone,
  crisisResponse,
  extractProfileVariables,
  buildWellnessInfo,
  getNextMissingField,
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

    try {
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as UserProfile | undefined);
      const { userName, relationship, careRecipient } = extractProfileVariables(profile);
      const wellnessInfo = buildWellnessInfo(metadata);
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

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

      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        mainAgent,
        context.userId,
        threadId,
        metadata
      );

      const trimmedInput = input.text.trim();
      const isShortInput = trimmedInput.length < 10;
      const isVeryShortInput = trimmedInput.length < 5;
      const needsOnboarding = nextField !== null;

      // Very short inputs - fast path
      if (isVeryShortInput && !needsOnboarding) {
        const fastResponse = `Hi ${userName}! I'm here to help. 

What's on your mind today? You can ask me about:
- Caregiving tips
- Local resources
- Managing stress
- Or anything else you need support with

What would be most helpful right now?`;

        await saveMessage(ctx, components.agent, {
          threadId: newThreadId,
          prompt: input.text,
        });

        workflow.start(ctx, internal.workflows.enrichMemory, {
          userId: context.userId,
          threadId: newThreadId,
          recentMessages: [
            { role: 'user', content: input.text },
            { role: 'assistant', content: fastResponse },
          ],
        }).catch((err) => console.error('[main-agent] Memory enrichment failed:', err));

        return {
          text: fastResponse,
          threadId: newThreadId,
          latencyMs: Date.now() - startTime,
          fastPath: true,
        };
      }

      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: input.text,
      });

      const isFirstTurn = !threadId;
      const isSimpleResponse = isShortInput && !needsOnboarding;
      const isAcknowledgment = /^(ok|okay|yes|no|thanks|thank you|sure|yep|nope|alright|alrighty|got it|gotcha|doing ok|doing okay|i'm ok|i'm okay)$/i.test(trimmedInput);

      const contextOptions = isFirstTurn || isSimpleResponse || isAcknowledgment
        ? {
            searchOtherThreads: false,
            recentMessages: 1,
            searchOptions: {
              textSearch: false,
              vectorSearch: false,
              limit: 0,
            },
          }
        : {
            searchOtherThreads: false,
            recentMessages: 5,
            searchOptions: {
              textSearch: true,
              vectorSearch: false,
              limit: 5,
            },
          };

      const LLM_TIMEOUT_MS = 8000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM response timeout after 8s')), LLM_TIMEOUT_MS);
      });

      let result;
      let timedOut = false;

      try {
        result = await Promise.race([
          thread.generateText({
            promptMessageId: messageId,
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
          }),
          timeoutPromise,
        ]);
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          timedOut = true;
          workflow.start(ctx, internal.workflows.enrichMemory, {
            userId: context.userId,
            threadId: newThreadId,
            recentMessages: [
              { role: 'user', content: input.text },
              { role: 'assistant', content: '' },
            ],
          }).catch((err) => console.error('[main-agent] Memory enrichment failed:', err));

          const timeoutResponse = `Hi ${userName}! I'm processing your message but it's taking longer than expected.

Here's what I can help with right now:
- Find local caregiving resources
- Answer caregiving questions
- Help manage stress

What's most urgent for you today?`;

          return {
            text: timeoutResponse,
            threadId: newThreadId,
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

      ctx.runMutation(internal.internal.logAgentRunInternal, {
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
      }).catch((err) => console.error('[main-agent] Logging failed:', err));

      if (threadId && !timedOut) {
        workflow.start(ctx, internal.workflows.enrichMemory, {
          userId: context.userId,
          threadId: newThreadId,
          recentMessages: [
            { role: 'user', content: input.text },
            { role: 'assistant', content: responseText },
          ].slice(-3),
        }).catch((err) => console.error('[main-agent] Memory enrichment failed:', err));
      }

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('[main-agent] Error:', error);
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as UserProfile | undefined);
      const userName = profile?.firstName ?? 'caregiver';
      const careRecipient = profile?.careRecipientName ?? 'your loved one';

      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs: Date.now() - startTime,
        traceId,
      }).catch(() => {});

      return {
        text: fallbackResponse,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        crisisAgent,
        context.userId,
        threadId
      );

      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: input.text,
      });

      const result = await thread.generateText({
        promptMessageId: messageId,
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
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: responseText,
        timestamp: Date.now(),
        traceId,
      });

      workflow.start(ctx, internal.workflows.crisisEscalation, {
        userId: userId,
        threadId: newThreadId,
        messageText: input.text,
        crisisTerms: context.crisisFlags?.terms || [],
        severity: 'high',
      }).catch((err) => console.error('[crisis-agent] Workflow failed:', err));

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('[crisis-agent] Error:', error);
      const fallbackResponse = crisisResponse(userName);

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: fallbackResponse,
        timestamp: Date.now(),
        traceId,
      });

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
      const session = await ctx.runQuery(api.assessments.getActiveSession, {
        userId: context.userId,
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

      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        assessmentAgent,
        context.userId,
        threadId
      );

      const promptText = input.text || 'Please interpret my burnout assessment results and suggest interventions.';

      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: promptText,
      });

      const result = await thread.generateText({
        promptMessageId: messageId,
        system: systemPrompt,
        contextOptions: {
          searchOtherThreads: true,
          recentMessages: 10,
          searchOptions: {
            textSearch: true,
            vectorSearch: true,
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
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      ctx.runMutation(internal.internal.logAgentRunInternal, {
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
      }).catch((err) => console.error('[assessment-agent] Logging failed:', err));

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('[assessment-agent] Error:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your assessment. Please try again.';
      const latencyMs = Date.now() - startTime;

      ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: errorMessage.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId,
      }).catch(() => {});

      return {
        text: errorMessage,
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

