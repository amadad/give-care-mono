"use node";

/**
 * MessageHandler Service
 *
 * Orchestrates incoming SMS message processing with clear separation of concerns:
 * 1. Validation (webhook signature)
 * 2. Rate limiting (5 layers)
 * 3. Authentication (user lookup)
 * 4. Authorization (subscription check)
 * 5. Context building
 * 6. Agent execution
 * 7. Persistence (assessments, conversations, wellness)
 * 8. Scheduling (crisis follow-ups, onboarding nudges)
 *
 * Extracted from convex/twilio.ts to improve testability and maintainability.
 */

import type { ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { validateRequest } from 'twilio';
import { rateLimiter, RATE_LIMITS, RATE_LIMIT_MESSAGES } from '../rateLimits.config';
import { runAgentTurn } from '../../src/agents';
import type { GiveCareContext } from '../../src/context';
import { getAssessmentDefinition, calculateAssessmentScore } from '../../src/assessmentTools';

interface IncomingMessage {
  from: string;
  body: string;
  messageSid: string;
  twilioSignature: string;
  requestUrl: string;
  params: any;
}

interface MessageResult {
  message: string;
  latency: number;
  error?: string;
}

export class MessageHandler {
  constructor(private ctx: ActionCtx) {}

  /**
   * Main message processing pipeline
   */
  async handle(message: IncomingMessage): Promise<MessageResult> {
    const startTime = Date.now();

    try {
      // 1. Validate webhook signature
      this.validateWebhook(message);

      // 2. Check rate limits (5 layers)
      const rateLimitResult = await this.checkRateLimits(message.from);

      // 3. Get or create user
      const user = await this.getUser(message.from);

      // 4. Validate subscription
      const subscriptionCheck = await this.checkSubscription(user, message.body, startTime);
      if (subscriptionCheck) {
        return subscriptionCheck; // Return signup message if not subscribed
      }

      // 5. Build context
      const context = this.buildContext(user, message.from, rateLimitResult.assessmentRateLimited);

      // 6. Execute agent
      const agentResult = await this.executeAgent(message.body, context);

      // 7. Persist changes
      await this.persistChanges(user, context, agentResult, message.body, message.messageSid, startTime);

      // 8. Schedule follow-ups
      await this.scheduleFollowups(user, context, agentResult.context);

      // 9. Return response
      return {
        message: agentResult.message,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[MessageHandler] Error:', error);
      return {
        message: "Sorry, I'm having trouble right now. Please try again in a moment.",
        latency: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Step 1: Validate Twilio webhook signature
   */
  private validateWebhook(message: IncomingMessage): void {
    // Allow bypass in development (like Python implementation)
    if (process.env.SKIP_TWILIO_VALIDATION === 'true') {
      console.log('[Dev] Skipping Twilio signature validation');
      return;
    }

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error('TWILIO_AUTH_TOKEN not configured');
    }

    if (!message.twilioSignature) {
      throw new Error('Missing X-Twilio-Signature header');
    }

    const isValid = validateRequest(
      authToken,
      message.twilioSignature,
      message.requestUrl,
      message.params
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature - possible spoofing attempt');
    }
  }

  /**
   * Step 2: Check all 5 rate limit layers
   * Returns assessment rate limit status for context building
   */
  private async checkRateLimits(phoneNumber: string): Promise<{ assessmentRateLimited: boolean }> {
    // 2a. Spam protection (20/hour per user)
    const spamCheck = await rateLimiter.limit(this.ctx, 'spam', {
      key: phoneNumber,
      config: RATE_LIMITS.spamProtection as any,
    });

    if (!spamCheck.ok) {
      console.warn(`[Rate Limit] Spam detected from ${phoneNumber}`);
      throw new Error('Rate limited (spam)');
    }

    // 2b. Per-user SMS limit (10/day per user)
    const smsCheck = await rateLimiter.limit(this.ctx, 'sms-user', {
      key: phoneNumber,
      config: RATE_LIMITS.smsPerUser as any,
    });

    if (!smsCheck.ok) {
      throw new Error(RATE_LIMIT_MESSAGES.smsPerUser);
    }

    // 2c. Global SMS limit (1000/hour)
    const globalCheck = await rateLimiter.limit(this.ctx, 'sms-global', {
      key: 'global',
      config: RATE_LIMITS.smsGlobal as any,
    });

    if (!globalCheck.ok) {
      console.error('[Rate Limit] ALERT: Global SMS limit reached!');
      throw new Error(RATE_LIMIT_MESSAGES.smsGlobal);
    }

    // 2d. OpenAI rate limit (100/min)
    const openaiCheck = await rateLimiter.limit(this.ctx, 'openai', {
      key: 'global',
      config: RATE_LIMITS.openaiCalls as any,
    });

    if (!openaiCheck.ok) {
      console.error('[Rate Limit] OpenAI quota reached!');
      throw new Error(RATE_LIMIT_MESSAGES.openaiCalls);
    }

    // 2e. Assessment rate limit (3/day per user)
    const assessmentCheck = await rateLimiter.limit(this.ctx, 'assessment', {
      key: phoneNumber,
      config: RATE_LIMITS.assessmentPerUser as any,
    });

    return {
      assessmentRateLimited: !assessmentCheck.ok,
    };
  }

  /**
   * Step 3: Get or create user
   */
  private async getUser(phoneNumber: string) {
    const user = await this.ctx.runMutation(internal.functions.users.getOrCreateByPhone, {
      phoneNumber,
    });

    if (!user) {
      throw new Error('Failed to get or create user');
    }

    return user;
  }

  /**
   * Step 4: Check subscription status
   * Returns signup message if user not subscribed, null otherwise
   */
  private async checkSubscription(
    user: any,
    messageBody: string,
    timestamp: number
  ): Promise<MessageResult | null> {
    const isSubscribed =
      user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

    if (isSubscribed) {
      console.log(`[Subscription] User ${user.phoneNumber} is subscribed - proceeding`);
      return null;
    }

    console.log(
      `[Subscription] User ${user.phoneNumber} has status '${user.subscriptionStatus}' - access denied`
    );

    const signupMessage =
      'Hi! To access GiveCare, please subscribe at:\n\n' +
      'https://www.givecareapp.com/signup\n\n' +
      "Questions about our service? Visit givecareapp.com or text 'info' for details.";

    // Log interaction for analytics
    await this.ctx.runMutation(internal.functions.conversations.logMessage, {
      userId: user._id,
      role: 'user',
      text: messageBody,
      mode: 'sms',
      timestamp,
    });

    await this.ctx.runMutation(internal.functions.conversations.logMessage, {
      userId: user._id,
      role: 'system',
      text: signupMessage,
      mode: 'sms',
      timestamp: Date.now(),
    });

    return {
      message: signupMessage,
      latency: Date.now() - timestamp,
    };
  }

  /**
   * Step 5: Build GiveCareContext from user record
   */
  private buildContext(
    user: any,
    phoneNumber: string,
    assessmentRateLimited: boolean
  ): GiveCareContext {
    return {
      userId: user._id,
      phoneNumber: user.phoneNumber,
      userName: user.firstName || null,
      firstName: user.firstName || null,
      relationship: user.relationship || null,
      careRecipientName: user.careRecipientName || null,
      zipCode: user.zipCode || null,
      journeyPhase: (user.journeyPhase as any) || 'onboarding',
      onboardingAttempts: user.onboardingAttempts || {},
      onboardingCooldownUntil: user.onboardingCooldownUntil
        ? String(user.onboardingCooldownUntil)
        : null,
      assessmentInProgress: user.assessmentInProgress || false,
      assessmentType: (user.assessmentType as any) || null,
      assessmentCurrentQuestion: user.assessmentCurrentQuestion || 0,
      assessmentSessionId: user.assessmentSessionId || null,
      assessmentResponses: {},
      assessmentRateLimited, // Use passed-in value from rate limit check
      burnoutScore: user.burnoutScore || null,
      burnoutBand: null,
      burnoutConfidence: null,
      pressureZones: user.pressureZones || [],
      pressureZoneScores: {},
      rcsCapable: user.rcsCapable || false,
      deviceType: user.deviceType || null,
      consentAt: user.consentAt ? String(user.consentAt) : null,
      languagePreference: user.languagePreference || 'en',
    };
  }

  /**
   * Step 6: Execute agent
   */
  private async executeAgent(messageBody: string, context: GiveCareContext) {
    console.log(`[Agent] Running agent for user ${context.userId}`);
    const result = await runAgentTurn(messageBody, context);
    console.log(`[Agent] Response: "${result.message}"`);
    return result;
  }

  /**
   * Step 7: Persist all changes
   */
  private async persistChanges(
    user: any,
    originalContext: GiveCareContext,
    agentResult: any,
    userMessage: string,
    messageSid: string,
    startTime: number
  ): Promise<void> {
    const updatedContext = agentResult.context;

    // 7a. Handle assessment session creation
    if (
      updatedContext.assessmentInProgress &&
      !updatedContext.assessmentSessionId &&
      updatedContext.assessmentType
    ) {
      await this.createAssessmentSession(updatedContext, user._id);
    }

    // 7b. Persist assessment responses
    if (updatedContext.assessmentSessionId && updatedContext.assessmentInProgress) {
      await this.persistAssessmentResponses(
        originalContext,
        updatedContext,
        updatedContext.assessmentSessionId
      );
    }

    // 7c. Complete assessment if finished
    if (
      updatedContext.assessmentSessionId &&
      !updatedContext.assessmentInProgress &&
      originalContext.assessmentInProgress
    ) {
      await this.completeAssessment(updatedContext);
    }

    // 7d. Log conversation
    await this.logConversation(
      user._id,
      originalContext.phoneNumber,
      userMessage,
      agentResult,
      messageSid,
      startTime
    );

    // 7e. Update user context (ASYNC - don't block response)
    this.updateUserContextAsync(user._id, updatedContext);

    // 7f. Save wellness score if changed (ASYNC - don't block response)
    if (
      updatedContext.burnoutScore !== null &&
      updatedContext.burnoutScore !== user.burnoutScore
    ) {
      this.saveWellnessScoreAsync(user._id, updatedContext);
    }

    // 7g. Update last contact (ASYNC - don't block response)
    this.updateLastContactAsync(user._id);
  }

  private async createAssessmentSession(context: GiveCareContext, userId: any): Promise<void> {
    const definition = getAssessmentDefinition(context.assessmentType!);
    const totalQuestions = definition?.questions.length ?? 0;

    const sessionId = (await this.ctx.runMutation(
      internal.functions.assessments.insertAssessmentSession,
      {
        userId,
        type: context.assessmentType!,
        totalQuestions,
      }
    )) as any;

    context.assessmentSessionId = sessionId;
    console.log(`[Assessment] Created session ${sessionId}`);
  }

  private async persistAssessmentResponses(
    originalContext: GiveCareContext,
    updatedContext: GiveCareContext,
    sessionId: string
  ): Promise<void> {
    const currentResponses = updatedContext.assessmentResponses;
    const previousResponses = originalContext.assessmentResponses;

    const newResponseKeys = Object.keys(currentResponses).filter(
      (key) => !(key in previousResponses)
    );

    for (const questionId of newResponseKeys) {
      const responseValue = String(currentResponses[questionId]);
      const definition = getAssessmentDefinition(updatedContext.assessmentType!);
      const question = definition?.questions.find((q) => q.id === questionId);

      await this.ctx.runMutation(internal.functions.assessments.insertAssessmentResponse, {
        sessionId: sessionId as any,
        userId: updatedContext.userId as any,
        questionId,
        questionText: question?.text ?? '',
        responseValue,
        score: undefined,
      });

      console.log(`[Assessment] Persisted response for ${questionId}`);
    }
  }

  private async completeAssessment(context: GiveCareContext): Promise<void> {
    const scoreData = calculateAssessmentScore(
      context.assessmentType!,
      context.assessmentResponses
    );

    await this.ctx.runMutation(internal.functions.assessments.completeAssessmentSession, {
      sessionId: context.assessmentSessionId! as any,
      overallScore: scoreData.overall_score,
      domainScores: scoreData.subscores,
    });

    console.log(`[Assessment] Completed session ${context.assessmentSessionId}`);
  }

  private async logConversation(
    userId: any,
    phoneNumber: string,
    userMessage: string,
    agentResult: any,
    messageSid: string,
    startTime: number
  ): Promise<void> {
    const timestamp = Date.now();

    // Batch insert both messages in one mutation (50-75ms faster)
    await this.ctx.runMutation(internal.functions.conversations.logMessages, {
      messages: [
        // User message (FIXED: was storing agentResult.message twice)
        {
          userId,
          role: 'user',
          text: userMessage, // Store the actual incoming SMS body
          mode: 'sms',
          messageSid,
          timestamp: startTime,
        },
        // Agent response
        {
          userId,
          role: 'assistant',
          text: agentResult.message, // AI's response
          mode: 'sms',
          latency: timestamp - startTime,
          agentName: agentResult.agentName,
          toolCalls: agentResult.toolCalls,
          tokenUsage: agentResult.tokenUsage,
          sessionId: agentResult.sessionId,
          serviceTier: 'priority',
          timestamp,
        },
      ],
    });
  }

  private async updateUserContext(userId: any, context: GiveCareContext): Promise<void> {
    await this.ctx.runMutation(internal.functions.users.updateContextState, {
      userId,
      firstName: context.firstName || undefined,
      relationship: context.relationship || undefined,
      careRecipientName: context.careRecipientName || undefined,
      zipCode: context.zipCode || undefined,
      journeyPhase: context.journeyPhase,
      onboardingAttempts: context.onboardingAttempts,
      assessmentInProgress: context.assessmentInProgress,
      assessmentType: context.assessmentType || undefined,
      assessmentCurrentQuestion: context.assessmentCurrentQuestion,
      assessmentSessionId: context.assessmentSessionId || undefined,
      burnoutScore: context.burnoutScore || undefined,
      burnoutBand: context.burnoutBand || undefined,
      burnoutConfidence: context.burnoutConfidence || undefined,
      pressureZones: context.pressureZones,
      pressureZoneScores: context.pressureZoneScores,
    });
  }

  /**
   * Async version - fires and forgets (no await)
   */
  private updateUserContextAsync(userId: any, context: GiveCareContext): void {
    this.ctx.runMutation(internal.functions.users.updateContextState, {
      userId,
      firstName: context.firstName || undefined,
      relationship: context.relationship || undefined,
      careRecipientName: context.careRecipientName || undefined,
      zipCode: context.zipCode || undefined,
      journeyPhase: context.journeyPhase,
      onboardingAttempts: context.onboardingAttempts,
      assessmentInProgress: context.assessmentInProgress,
      assessmentType: context.assessmentType || undefined,
      assessmentCurrentQuestion: context.assessmentCurrentQuestion,
      assessmentSessionId: context.assessmentSessionId || undefined,
      burnoutScore: context.burnoutScore || undefined,
      burnoutBand: context.burnoutBand || undefined,
      burnoutConfidence: context.burnoutConfidence || undefined,
      pressureZones: context.pressureZones,
      pressureZoneScores: context.pressureZoneScores,
    }).catch(err => {
      console.error('[Background] Failed to update user context:', err);
    });
  }

  private async saveWellnessScore(userId: any, context: GiveCareContext): Promise<void> {
    await this.ctx.runMutation(internal.functions.wellness.saveScore, {
      userId,
      overallScore: context.burnoutScore!,
      band: context.burnoutBand || undefined,
      confidence: context.burnoutConfidence || undefined,
      pressureZones: context.pressureZones,
      pressureZoneScores: context.pressureZoneScores,
      assessmentType: context.assessmentType || undefined,
    });
  }

  /**
   * Async version - fires and forgets (no await)
   */
  private saveWellnessScoreAsync(userId: any, context: GiveCareContext): void {
    this.ctx.runMutation(internal.functions.wellness.saveScore, {
      userId,
      overallScore: context.burnoutScore!,
      band: context.burnoutBand || undefined,
      confidence: context.burnoutConfidence || undefined,
      pressureZones: context.pressureZones,
      pressureZoneScores: context.pressureZoneScores,
      assessmentType: context.assessmentType || undefined,
    }).catch(err => {
      console.error('[Background] Failed to save wellness score:', err);
    });
  }

  /**
   * Async version - fires and forgets (no await)
   */
  private updateLastContactAsync(userId: any): void {
    this.ctx.runMutation(internal.functions.users.updateLastContact, {
      userId,
    }).catch(err => {
      console.error('[Background] Failed to update last contact:', err);
    });
  }

  /**
   * Step 8: Schedule follow-ups
   */
  private async scheduleFollowups(
    user: any,
    originalContext: GiveCareContext,
    updatedContext: GiveCareContext
  ): Promise<void> {
    // 8a. Crisis follow-ups
    const wasCrisis = user.burnoutBand === 'crisis';
    const nowCrisis = updatedContext.burnoutBand === 'crisis';

    if (!wasCrisis && nowCrisis) {
      console.log(`[Crisis] User ${user._id} entered crisis state - scheduling follow-ups`);

      await this.ctx.runMutation(internal.functions.users.updateUser, {
        userId: user._id,
        lastCrisisEventAt: Date.now(),
        crisisFollowupCount: 0,
      });

      await this.ctx.runMutation(internal.functions.scheduling.scheduleCrisisFollowups, {
        userId: user._id,
      });
    }

    // 8b. Onboarding completion nudges
    const wasOnboarding = user.journeyPhase === 'onboarding';
    const nowActive = updatedContext.journeyPhase === 'active';

    if (wasOnboarding && nowActive) {
      console.log(`[Onboarding] User ${user._id} completed onboarding`);

      await this.ctx.runAction(internal.functions.scheduling.checkOnboardingAndNudge, {
        userId: user._id as any,
        nudgeStage: 1, // Start with first nudge (48hr)
      });
    }
  }
}
