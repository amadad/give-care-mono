'use node'

/**
 * Multi-agent system with GPT-5 nano
 * 3 specialized agents: main (orchestrator), crisis, assessment
 *
 * Uses "use node" directive to enable Node.js runtime with full API support
 * Required for OpenAI Agents SDK which uses EventTarget/CustomEvent APIs
 */

import { Agent, run, setOpenAIAPI } from '@openai/agents'
import { GiveCareContext } from './context'
import {
  checkWellnessStatus,
  findInterventions,
  updateProfile,
  startAssessment,
  recordAssessmentAnswer,
  setWellnessSchedule,
  recordMemory,
  findLocalResources,
} from './tools'
import { crisisInstructions, mainInstructions, assessmentInstructions } from './instructions'
import { crisisGuardrail, spamGuardrail, medicalAdviceGuardrail, safetyGuardrail } from './safety'
import type { ExtendedModelSettings, RunResultWithContext } from './types/openai-extensions'
import { extractTokenUsage, extractServiceTier, hasContextState } from './types/openai-extensions'

/**
 * Service Tier Configuration - Responses API
 *
 * The Agents SDK uses the Responses API by default, which supports service_tier parameter.
 * We need to ensure we're using the Responses API endpoint (not Chat Completions).
 *
 * Service tier options:
 * - "priority": Fastest processing (~20-30% faster), ~40% cost increase
 * - "auto": Uses scale tier quota if available
 * - "default": Standard processing
 * - "flex": 50% cheaper, higher latency (gpt-5 models only)
 */

// Explicitly set to use Responses API (default, but being explicit)
setOpenAIAPI('responses')

// Crisis agent - provides immediate support resources

export const crisisAgent = new Agent<GiveCareContext>({
  name: 'Crisis Support',
  instructions: crisisInstructions,
  model: process.env.OPENAI_MODEL || 'gpt-5-nano',
  modelSettings: {
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' },
    store: true,
    service_tier: 'priority',
  } as ExtendedModelSettings,
  handoffDescription: 'Handles crisis situations requiring immediate support',
})

// Assessment agent - clinical evaluations with StopAtTools optimization
export const assessmentAgent = new Agent<GiveCareContext>({
  name: 'Assessment Guide',
  instructions: assessmentInstructions,
  model: process.env.OPENAI_MODEL || 'gpt-5-nano',
  modelSettings: {
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' },
    store: true,
    service_tier: 'priority',
  } as ExtendedModelSettings,
  tools: [startAssessment, recordAssessmentAnswer],
  toolUseBehavior: { stopAtToolNames: ['record_assessment_answer'] },
  handoffDescription: 'Conducts wellness assessments (EMA, CWBS, REACH-II, SDOH)',
})

// Main agent - orchestrator with seamless handoffs

export const giveCareAgent = new Agent<GiveCareContext>({
  name: 'GiveCareMain',
  instructions: mainInstructions,
  model: process.env.OPENAI_MODEL || 'gpt-5-nano',
  modelSettings: {
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' },
    maxTokens: 300,
    store: true,
    service_tier: 'priority',
  } as ExtendedModelSettings,
  tools: [
    checkWellnessStatus,
    findInterventions,
    updateProfile,
    startAssessment,
    setWellnessSchedule,
    recordMemory,
    findLocalResources,
  ],
  handoffs: [crisisAgent, assessmentAgent],
  inputGuardrails: [crisisGuardrail, spamGuardrail],
  outputGuardrails: [medicalAdviceGuardrail, safetyGuardrail],
})

// Run agent with context - SDK handles sessions automatically
export async function runAgentTurn(message: string, context: GiveCareContext) {
  const startTime = Date.now()

  try {
    // CRITICAL FIX: Pass conversationId to use OpenAI's conversation storage
    // This maintains message history across separate run() calls
    // Without this, each run starts fresh with no prior context
    const result = await run(giveCareAgent, message, {
      context,
      conversationId: context.userId, // Use userId as stable conversation ID
    })

    // Log performance metrics
    const latency = Date.now() - startTime
    if (latency > 2000) {
      console.warn(`[Agent] Slow OpenAI response: ${latency}ms`, {
        agentName: (result as any).agentName,
        sessionId: (result as any).sessionId,
        tokenUsage: extractTokenUsage(result),
      })
    }

    // Extract response text from final output
    const responseText =
      typeof result.finalOutput === 'string'
        ? result.finalOutput
        : result.finalOutput
          ? JSON.stringify(result.finalOutput)
          : ''

    // Access updated context from run state using type-safe type guard
    const updatedContext = hasContextState<GiveCareContext>(result) ? result.state.context : context

    // Extract telemetry data using type-safe helpers
    const resultWithContext = result as any as RunResultWithContext<GiveCareContext>
    const agentName = resultWithContext.agentName || 'main'
    const toolCalls = resultWithContext.toolCalls || []
    const tokenUsage = extractTokenUsage(result)
    const sessionId = resultWithContext.sessionId
    const serviceTier = extractServiceTier(result)

    return {
      message: responseText ?? '',
      context: updatedContext,
      agentName,
      toolCalls,
      tokenUsage,
      sessionId,
      serviceTier, // Actual tier from OpenAI response (may differ from requested)
      latency,
    }
  } catch (error) {
    console.error('[Agent] OpenAI API error:', error)

    // Return fallback response
    return {
      message: "I'm having trouble connecting right now. For immediate support, call 988 💙",
      context, // Return original context unchanged
      agentName: 'error',
      toolCalls: [],
      tokenUsage: { input: 0, output: 0, total: 0 },
      sessionId: undefined,
      latency: Date.now() - startTime,
      error: String(error),
    }
  }
}
