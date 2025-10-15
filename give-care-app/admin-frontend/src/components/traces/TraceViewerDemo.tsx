import { TraceViewer } from './TraceViewer'

// Mock trace data for demonstration
const mockTrace = {
  totalMs: 2847,
  phases: {
    rateLimitMs: 12,
    guardrailMs: 45,
    contextBuildMs: 89,
    agentMs: 2456,
    toolExecutionMs: 187,
    persistenceMs: 58
  },
  spans: [
    {
      id: 'span-1',
      name: 'SMS Rate Limit Check',
      type: 'rate_limit' as const,
      startMs: 0,
      durationMs: 8,
      status: 'success' as const,
      metadata: {
        smsUserRemaining: 7,
        smsGlobalRemaining: 892,
        spamCheckPassed: true
      }
    },
    {
      id: 'span-2',
      name: 'Input Guardrails (Crisis + Spam)',
      type: 'guardrail' as const,
      startMs: 8,
      durationMs: 45,
      status: 'success' as const,
      metadata: {
        crisisDetected: false,
        spamScore: 0.12,
        guardrailsPassed: ['crisis_guardrail', 'spam_guardrail']
      }
    },
    {
      id: 'span-3',
      name: 'Build GiveCareContext',
      type: 'database' as const,
      startMs: 53,
      durationMs: 89,
      status: 'success' as const,
      metadata: {
        userId: 'j57abc123',
        burnoutScore: 65,
        journeyPhase: 'active',
        pressureZones: ['emotional_wellbeing', 'social_support']
      }
    },
    {
      id: 'span-4',
      name: 'Main Agent Execution',
      type: 'agent' as const,
      startMs: 142,
      durationMs: 2456,
      status: 'success' as const,
      metadata: {
        model: 'gpt-5-nano',
        serviceTier: 'default',
        inputTokens: 1847,
        outputTokens: 143,
        totalTokens: 1990,
        cacheHit: true,
        toolsCalled: ['updateProfile']
      }
    },
    {
      id: 'span-5',
      name: 'updateProfile Tool',
      type: 'tool' as const,
      startMs: 1789,
      durationMs: 187,
      status: 'success' as const,
      metadata: {
        args: {
          firstName: 'Sarah',
          relationship: 'daughter',
          careRecipientName: 'Mom'
        },
        fieldsUpdated: ['firstName', 'relationship', 'careRecipientName']
      }
    },
    {
      id: 'span-6',
      name: 'Persist Context & Conversation',
      type: 'database' as const,
      startMs: 2789,
      durationMs: 58,
      status: 'success' as const,
      metadata: {
        conversationId: 'conv-xyz789',
        userUpdated: true,
        wellnessScoreRecorded: false
      }
    }
  ],
  model: 'gpt-5-nano',
  cacheHit: true,
  rateLimitRemaining: {
    smsUser: 7,
    smsGlobal: 892,
    openai: 4312
  }
}

export function TraceViewerDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Trace Viewer Component</h2>
        <p className="text-muted-foreground">
          Linear execution timeline showing rate limiting → guardrails → agent → tools → persistence
        </p>
      </div>

      <TraceViewer trace={mockTrace} conversationId="conv-xyz789" />
    </div>
  )
}
