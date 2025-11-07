# convex/agents/

Convex-native agent implementations using @openai/agents SDK.

Each agent is a Convex **action** that:
- Takes user input and context
- Streams LLM responses
- Invokes tools via Convex mutations/queries
- Returns structured output

## Agents

- `crisis.ts` - Crisis detection & response (Phase 2)
- `main.ts` - General caregiving conversations (Phase 3)
- `assessment.ts` - Burnout assessments & interventions (Phase 3)

## Architecture

Agents run as Convex actions with `"use node"` directive to access @openai/agents SDK.

They call internal mutations/queries for data access and tool execution.
