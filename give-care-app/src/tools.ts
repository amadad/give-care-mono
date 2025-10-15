/**
 * Agent tools (5 total) - OpenAI Agents SDK 0.1.9
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import type { GiveCareContext } from './context';
import { contextHelpers } from './context';
import { calculateAssessmentScore, getAssessmentDefinition } from './assessmentTools';
import { calculateCompositeScore, formatZoneName } from './burnoutCalculator';
import { ZONE_INTERVENTIONS } from './interventionData';
import type { BurnoutScore } from './burnoutCalculator';
import { api } from '../convex/_generated/api';

/**
 * Type-safe helper to extract Convex client from RunContext
 * Replaces unsafe (runContext as any)?.convexClient pattern
 */
export function getConvexClient(runContext: any): any | null {
  if (!runContext) return null;
  if (!runContext.convexClient) return null;
  return runContext.convexClient;
}

/**
 * Format assessment completion message (trauma-informed)
 * Aligns with P1 (Acknowledge > Answer > Advance) and P6 (Deliver Value)
 */
function formatAssessmentCompletion(burnoutScore: BurnoutScore): string {
  const score = burnoutScore.overall_score;
  const band = burnoutScore.band;

  // Start with acknowledgment (P1: Acknowledge > Answer > Advance)
  let message = '✓ Assessment complete. Thanks for sharing.\n\n';

  // Band-specific messaging (trauma-informed, strengths-based)
  if (band === 'crisis') {
    message += `Right now, you're carrying a lot. Your score is ${score}/100.\n\n`;
    message += `Let's find immediate support. Want to see strategies that might help?`;
  } else if (band === 'high') {
    message += `Things are tough right now. Your score is ${score}/100.\n\n`;
    message += `You're managing a lot. Want to explore ways to lighten the load?`;
  } else if (band === 'moderate') {
    message += `You're navigating some challenges. Your score is ${score}/100.\n\n`;
    message += `Let's look at strategies to help with the hardest parts.`;
  } else if (band === 'mild') {
    message += `You're doing well overall. Your score is ${score}/100.\n\n`;
    message += `Want to see what might help with any rough spots?`;
  } else {
    // thriving
    message += `You're doing great! Your score is ${score}/100.\n\n`;
    message += `Keep up what's working. Want tips to stay resilient?`;
  }

  // Show top pressure zones with clear names
  if (burnoutScore.pressure_zones.length > 0) {
    const topZones = burnoutScore.pressure_zones.slice(0, 2);
    const zoneNames = topZones.map((z) => formatZoneName(z).toLowerCase());
    message += `\n\n**Areas needing attention**: ${zoneNames.join(' and ')}`;
  }

  return message;
}

// Profile management

export const updateProfile = tool({
  name: 'update_profile',
  description: `Update user profile fields.

WHEN TO CALL: Immediately when user shares any profile information.
- User says their name → Call with first_name parameter
- User mentions relationship → Call with relationship parameter
- User gives recipient name → Call with care_recipient_name parameter
- User shares zip code → Call with zip_code parameter

DO NOT ask user for user_id - it's already in context.

PRD §5.3: Conversational Onboarding
PRD P2: Use this tool instead of asking twice
PRD P4: Soft confirm first, then call tool`,

  parameters: z.object({
    first_name: z.string().nullable().optional(),
    relationship: z.string().nullable().optional(),
    care_recipient_name: z.string().nullable().optional(),
    zip_code: z.string().regex(/^\d{5}$/).nullable().optional(),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;
    const updatedFields: string[] = [];

    // P2/P3 enforcement: Record field attempts for trauma-informed collection
    // Field mapping: input key → context key → display name → attempt tracking key
    const fieldMappings = [
      { inputKey: 'first_name' as const, contextKey: 'firstName' as const, display: 'name', attemptKey: 'first_name' },
      { inputKey: 'relationship' as const, contextKey: 'relationship' as const, display: 'relationship', attemptKey: 'relationship' },
      { inputKey: 'care_recipient_name' as const, contextKey: 'careRecipientName' as const, display: 'care_recipient', attemptKey: 'care_recipient_name' },
      { inputKey: 'zip_code' as const, contextKey: 'zipCode' as const, display: 'zip', attemptKey: 'zip_code' },
    ] as const;

    // Process each field mapping
    for (const { inputKey, contextKey, display, attemptKey } of fieldMappings) {
      const value = input[inputKey];
      if (value !== undefined && value !== null) {
        // Check if we can ask for this field (P3: max 2 attempts)
        if (!contextHelpers.canAskForField(context, attemptKey)) {
          return `COOLDOWN:${attemptKey}`;
        }
        context[contextKey] = value;
        contextHelpers.recordFieldAttempt(context, attemptKey);
        updatedFields.push(display);
      }
    }

    if (updatedFields.length === 0) {
      return 'No updates made.';
    }

    // Build confirmation message (P4: Soft confirmations)
    const fieldLabels: Record<string, string> = {
      name: 'name',
      relationship: 'relationship',
      care_recipient: 'care recipient',
      zip: 'ZIP code',
    };

    const updatedLabels = updatedFields.map((f) => fieldLabels[f] || f);
    let message = `Got it: ${updatedLabels.join(', ')} saved.`;

    // Check if we've hit attempt limits and need to set cooldown
    const missing = contextHelpers.missingProfileFields(context);
    const anyAtLimit = missing.some((field) => {
      const attempts = context.onboardingAttempts[field] || 0;
      return attempts >= 2;
    });

    if (anyAtLimit && !context.onboardingCooldownUntil) {
      // Set 24-hour cooldown (P3: trauma-informed)
      const cooldownTime = new Date();
      cooldownTime.setHours(cooldownTime.getHours() + 24);
      context.onboardingCooldownUntil = cooldownTime.toISOString();
    }

    // Check completion
    if (contextHelpers.profileComplete(context)) {
      message += '\n\nYour profile is complete! Ready to start tracking your wellness?';
      return message;
    }

    // Show what's still needed (P3: Max 2 attempts per field)
    const canAsk = missing.filter((field) =>
      contextHelpers.canAskForField(context, field)
    );

    if (canAsk.length > 0) {
      const labels = canAsk.map((f) => fieldLabels[f] || f);
      message += `\n\nWhen you're ready, I'd love to know: ${labels.join(', ')}. (Or skip for now)`;
    }

    return message;
  },
});

// Assessment tools
export const startAssessment = tool({
  name: 'start_assessment',
  description: `Start a wellness assessment (EMA, CWBS, REACH-II, SDOH). 1 question per turn.`,

  parameters: z.object({
    assessment_type: z.enum(['ema', 'cwbs', 'reach_ii', 'sdoh']).default('ema'),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;

    // RATE LIMIT CHECK (Task 3): 3 assessments per day per user
    if (context.assessmentRateLimited) {
      return "You've done 3 assessments today. Let's revisit tomorrow to get the most accurate picture of how you're doing 💙";
    }

    // Get assessment definition
    const definition = getAssessmentDefinition(input.assessment_type);

    // Set context state
    context.assessmentInProgress = true;
    context.assessmentType = input.assessment_type;
    context.assessmentCurrentQuestion = 0;
    context.assessmentSessionId = null; // Will be set by convex/twilio.ts
    context.assessmentResponses = {};

    // Map to user-friendly names
    const names: Record<string, string> = {
      ema: 'daily check-in',
      cwbs: 'well-being assessment',
      reach_ii: 'stress check',
      sdoh: 'needs screening',
    };

    const friendlyName = names[input.assessment_type] || input.assessment_type;
    const totalQuestions = definition?.questions.length ?? 0;

    return `Starting ${friendlyName}. I'll ask you ${totalQuestions} quick questions, one at a time. Ready?`;
  },
});

export const recordAssessmentAnswer = tool({
  name: 'record_assessment_answer',
  description: `Record user's answer to current assessment question.

Call this tool EVERY time the user provides an answer to an assessment question.
Use answer="SKIPPED" if user declines to answer.`,

  parameters: z.object({
    answer: z.string(),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;
    if (!context.assessmentType) {
      return 'Error: No assessment in progress';
    }

    // Get assessment definition
    const definition = getAssessmentDefinition(context.assessmentType);
    if (!definition) {
      return 'Error: Invalid assessment type';
    }
    const currentQuestion = definition.questions[context.assessmentCurrentQuestion];

    if (!currentQuestion) {
      return 'Error: Invalid question index';
    }

    // Store answer with proper question ID
    context.assessmentResponses[currentQuestion.id] = input.answer;
    context.assessmentCurrentQuestion += 1;

    // Note: Convex persistence handled by agents.ts after tool returns

    const totalQuestions = definition.questions.length;

    // Check if assessment is complete
    if (context.assessmentCurrentQuestion >= totalQuestions) {
      context.assessmentInProgress = false;

      // Calculate assessment score using the new scoring function
      const assessmentScore = calculateAssessmentScore(
        context.assessmentType,
        context.assessmentResponses
      );

      // HANDLE INSUFFICIENT DATA: If all questions were skipped, provide helpful message
      if (assessmentScore.overall_score === null) {
        context.assessmentInProgress = false;
        return "I noticed you skipped all the questions. That's completely okay - you can take the assessment whenever you feel ready. Just say 'check-in' when you'd like to try again.";
      }

      // Calculate composite burnout score
      const burnoutScore = calculateCompositeScore({
        [context.assessmentType]: {
          overall_score: assessmentScore.overall_score,
          subscores: assessmentScore.subscores,
          timestamp: new Date()
        }
      });

      // Update context with results
      context.burnoutScore = burnoutScore.overall_score;
      context.burnoutBand = burnoutScore.band as 'crisis' | 'high' | 'moderate' | 'mild' | 'thriving';
      context.burnoutConfidence = burnoutScore.confidence;
      context.pressureZones = burnoutScore.pressure_zones;
      context.pressureZoneScores = burnoutScore.pressure_zone_scores;

      // Note: Wellness score saved to database by agents.ts after tool returns

      // Return trauma-informed completion message (P1: Acknowledge > Answer > Advance)
      return formatAssessmentCompletion(burnoutScore);
    }

    // Get next question
    const nextQuestion = definition.questions[context.assessmentCurrentQuestion];

    // Format response options if available
    let questionText = `(${context.assessmentCurrentQuestion + 1}/${totalQuestions}) ${nextQuestion.text}`;

    if (nextQuestion.options && nextQuestion.options.length > 0) {
      questionText += '\n\n';
      nextQuestion.options.forEach((opt, idx) => {
        questionText += `${idx + 1}. ${opt}\n`;
      });
      questionText += '\nReply with a number 1-' + nextQuestion.options.length;
    }

    return questionText;
  },
});

// Wellness status
export const checkWellnessStatus = tool({
  name: 'check_wellness_status',
  description: `Show user's current wellness score and progress over time (0-100 scale).`,

  parameters: z.object({}),

  execute: async (_input, runContext) => {
    const context = runContext!.context as GiveCareContext;
    // Note: Historical trends would require Convex query access in tool context
    // Current implementation uses latest score from context (sufficient for MVP)
    if (context.burnoutScore === null) {
      return "You haven't completed an assessment yet. Want to do a quick check-in to see how you're doing?";
    }

    let response = '**Your Wellness Status**\n\n';
    response += `Current score: ${context.burnoutScore}/100`;

    // Band interpretation
    const bandMessages: Record<string, string> = {
      crisis: " (high stress - let's find support)",
      high: ' (elevated stress)',
      moderate: ' (managing, but challenging)',
      mild: ' (doing pretty well)',
      thriving: " (you're doing great!)",
    };

    if (context.burnoutBand) {
      response += bandMessages[context.burnoutBand] || '';
    }

    // Top pressure zones with formatted names
    if (context.pressureZones.length > 0) {
      const zones = context.pressureZones.slice(0, 2);
      const zoneNames = zones.map(z => formatZoneName(z).toLowerCase());
      response += `\n\n**Top pressures**: ${zoneNames.join(', ')}`;
      response += '\n\nWant strategies to help with any of these?';
    }

    return response;
  },
});

// Interventions
export const findInterventions = tool({
  name: 'find_interventions',
  description: `Find evidence-based interventions matched to pressure zones from burnout score.`,

  parameters: z.object({
    pressure_zones: z.array(z.string()).nullable().optional(),
    context: z.string().nullable().optional().default(''),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;
    const zones = input.pressure_zones || context.pressureZones;

    // Handle no zones cases
    if (zones.length === 0 && context.burnoutScore === null) {
      return "Let's do a quick check-in first to understand what you're dealing with. Want to start an assessment?";
    }

    if (zones.length === 0 && context.burnoutScore !== null) {
      return "Your wellness score is available. What's the biggest challenge you're facing right now? I can find strategies that match.";
    }

    const intro = context.burnoutBand === 'crisis'
      ? "I see you're dealing with a lot right now. Here are some immediate supports:\n\n"
      : context.burnoutBand === 'high'
      ? "Things are tough. These might help lighten the load:\n\n"
      : "Here are some strategies that might help:\n\n";

    // Try to get real resources from database (only if convexClient is available)
    let resources: Array<{
      title: string;
      provider: string;
      description: string;
      phone: string | null;
      website: string | null;
      location: string;
    }> = [];

    // Guard: Only query database if convexClient is available
    const convexClient = getConvexClient(runContext);
    if (convexClient) {
      try {
        resources = await convexClient.query(
          api.functions.resources.getResourceRecommendations,
          { userId: context.userId, limit: 3 }
        );
      } catch (e) {
        // Log error only in development to avoid log spam
        if (process.env.NODE_ENV === 'development') {
          console.error("[Tools] Resource query failed:", e);
        }
      }
    }

    // If database empty or client unavailable, use static fallback
    if (resources.length === 0) {
      const topZones = zones.slice(0, 2);
      const matches = topZones
        .map(zone => ZONE_INTERVENTIONS[zone])
        .filter(Boolean);

      return intro + matches
        .map((int, i) => `${i + 1}. **${int.title}**: ${int.desc}\n   ✓ ${int.helpful}% found helpful`)
        .join('\n\n') +
        '\n\nTry one that feels doable today.';
    }

    // Format database resources for SMS
    const formatted = resources.map((r, i) => {
      let text = `${i + 1}. **${r.title}**`;
      if (r.provider) text += ` (${r.provider})`;
      text += `\n   ${r.description.slice(0, 100)}${r.description.length > 100 ? '...' : ''}`;
      if (r.phone) text += `\n   📞 ${r.phone}`;
      if (r.website) text += `\n   🔗 ${r.website}`;
      return text;
    }).join('\n\n');

    return intro + formatted + '\n\nWould any of these be helpful? Let me know if you need more info.';
  },
});

// Wellness Schedule (RRULE Triggers - Task 8)
export const setWellnessSchedule = tool({
  name: 'set_wellness_schedule',
  description: `Set personalized wellness check-in schedule for the user. Supports daily, every-other-day, and weekly patterns with specific times and timezone.`,

  parameters: z.object({
    frequency: z.enum(['daily', 'every_other_day', 'weekly', 'custom']),
    preferred_time: z.string(), // "9:00 AM", "14:30", etc.
    timezone: z.string(), // "America/Los_Angeles", "America/New_York", etc.
    days_of_week: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).nullable().optional(),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;

    // Validate weekly requires daysOfWeek
    if (input.frequency === 'weekly' && (!input.days_of_week || input.days_of_week.length === 0)) {
      return "For weekly check-ins, I need to know which days work best. Which days? (e.g., Mon/Wed/Fri)";
    }

    // Parse time
    let time: { hour: number; minute: number };
    try {
      // Import parseTime from convex/triggers.ts
      const { parseTime } = await import('../convex/triggers');
      time = parseTime(input.preferred_time);
    } catch (error) {
      return `I couldn't understand the time "${input.preferred_time}". Please use format like "9:00 AM" or "14:30".`;
    }

    // Build RRULE
    let rrule: string;
    try {
      const { buildRRule } = await import('../convex/triggers');
      rrule = buildRRule(input.frequency, time, input.days_of_week);
    } catch (error) {
      return `Error setting schedule: ${error}`;
    }

    // Create trigger via Convex
    const convexClient = getConvexClient(runContext);
    if (!convexClient) {
      return "Schedule feature not available right now. Try again in a moment.";
    }

    try {
      await convexClient.mutation(
        api.triggers.createTrigger,
        {
          userId: context.userId,
          recurrenceRule: rrule,
          type: 'wellness_checkin',
          message: 'Quick check-in: How are you feeling today?',
          timezone: input.timezone,
        }
      );

      // Format confirmation message
      let confirmMsg = `✓ Set wellness check-ins for ${input.frequency.replace('_', ' ')} at ${input.preferred_time}`;

      if (input.frequency === 'weekly' && input.days_of_week) {
        const dayNames: Record<string, string> = {
          MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun',
        };
        const days = input.days_of_week.map(d => dayNames[d]).join('/');
        confirmMsg += ` on ${days}`;
      }

      confirmMsg += ` (${input.timezone.split('/')[1]?.replace('_', ' ') || input.timezone})`;
      confirmMsg += '\n\nI\'ll check in at those times. You can update this anytime.';

      return confirmMsg;

    } catch (error) {
      console.error('[setWellnessSchedule] Error creating trigger:', error);
      return "I couldn't set the schedule right now. Want to try again later?";
    }
  },
});

// Working Memory (Task 10)
export const recordMemory = tool({
  name: 'record_memory',
  description: `Save important information about the caregiver for future reference. Use this when the user shares preferences, care routines, intervention results, or crisis triggers.

WHEN TO CALL:
- User shares care routine: "John prefers morning baths at 9am" → category: care_routine
- User mentions preference: "Yoga reduces my stress by 30%" → category: preference
- User reports intervention result: "Respite care helped a lot last month" → category: intervention_result
- User identifies crisis trigger: "I get overwhelmed dealing with insurance" → category: crisis_trigger

Importance rating (1-10):
- 9-10: Critical daily information (care routines, crisis triggers)
- 6-8: Important preferences and successful interventions
- 3-5: Useful context but not essential
- 1-2: Minor details`,

  parameters: z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']),
    importance: z.number().min(1).max(10),
  }),

  execute: async ({ content, category, importance }, runContext) => {
    const context = runContext!.context as GiveCareContext;

    // Call Convex mutation to save memory
    const convexClient = getConvexClient(runContext);
    if (!convexClient) {
      return 'Memory recording not available right now. I can still help with other things.';
    }

    try {
      await convexClient.mutation(
        api.functions.memories.saveMemory,
        {
          userId: context.userId,
          content: content,
          category: category,
          importance: importance,
        }
      );

      return `Remembered: ${content} (${category}, importance: ${importance}/10)`;
    } catch (error) {
      console.error('[recordMemory] Error saving memory:', error);
      return 'I tried to remember that, but encountered an error. Please try again.';
    }
  },
});

// Export all tools
export const allTools = [
  updateProfile,
  startAssessment,
  recordAssessmentAnswer,
  checkWellnessStatus,
  findInterventions,
  setWellnessSchedule,
  recordMemory,
];
