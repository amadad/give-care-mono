/**
 * Dynamic instructions with trauma-informed principles (P1-P6)
 *
 * System prompts are loaded from markdown files in src/prompts/
 * and template variables are replaced at runtime.
 */

"use node";

import type { RunContext } from '@openai/agents'
import type { GiveCareContext } from './context'
import { formatZoneName } from './burnoutCalculator'
import { loadPrompt, replaceVariables } from './prompts/loader'

// =============================================================================
// CRISIS AGENT INSTRUCTIONS
// =============================================================================

export function crisisInstructions(runContext: RunContext<GiveCareContext>): string {
  const context = runContext.context
  const userName = context.firstName || 'friend'
  const wellnessInfo = context.burnoutScore
    ? `Wellness: ${Math.round(context.burnoutScore)}/100 (${context.burnoutBand})`
    : 'No wellness data yet'

  const template = loadPrompt('crisis_agent')

  return replaceVariables(template, {
    userName,
    journeyPhase: context.journeyPhase,
    wellnessInfo,
  })
}

// ASSESSMENT AGENT INSTRUCTIONS

export function assessmentInstructions(runContext: RunContext<GiveCareContext>): string {
  const context = runContext.context
  const userName = context.firstName || 'there'
  const assessmentName = context.assessmentType
    ? {
        ema: 'daily check-in',
        cwbs: 'well-being assessment',
        reach_ii: 'stress check',
        sdoh: 'needs screening',
      }[context.assessmentType]
    : 'wellness check'

  const template = loadPrompt('assessment_agent')

  return replaceVariables(template, {
    userName,
    assessmentName,
    assessmentType: context.assessmentType || 'none',
    questionNumber: String(context.assessmentCurrentQuestion + 1),
    responsesCount: String(Object.keys(context.assessmentResponses).length),
  })
}

// =============================================================================
// MAIN AGENT INSTRUCTIONS
// =============================================================================

export function mainInstructions(runContext: RunContext<GiveCareContext>): string {
  const context = runContext.context
  const userName = context.firstName || 'there'
  const careRecipient = context.careRecipientName || 'your loved one'
  const relationship = context.relationship || 'caregiver'

  const wellnessInfo = context.burnoutScore
    ? `Current wellness: ${Math.round(context.burnoutScore)}/100 (${context.burnoutBand})
Pressure zones: ${context.pressureZones.length > 0 ? context.pressureZones.map(z => formatZoneName(z)).join(', ') : 'none identified yet'}`
    : 'No wellness data yet - encourage first assessment'

  const profileComplete = context.firstName && context.relationship && context.careRecipientName && context.zipCode ? 'Yes' : 'No'

  const missingFieldsSection =
    context.firstName && context.relationship && context.careRecipientName && context.zipCode
      ? ''
      : `
Missing fields: ${[
        !context.firstName && 'first name',
        !context.relationship && 'relationship',
        !context.careRecipientName && 'care recipient name',
        !context.zipCode && 'ZIP code',
      ]
        .filter(Boolean)
        .join(', ')}

Onboarding attempts so far: ${JSON.stringify(context.onboardingAttempts)}
(Remember P3: Max 2 attempts per field, then cooldown)
`

  const template = loadPrompt('main_agent')

  return replaceVariables(template, {
    userName,
    careRecipient,
    relationship,
    journeyPhase: context.journeyPhase,
    totalInteractionCount: String(context.totalInteractionCount || 0),
    wellnessInfo,
    profileComplete,
    missingFieldsSection,
  })
}
