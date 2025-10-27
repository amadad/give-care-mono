# Multi-Agent Orchestrator Skill

## Purpose
Orchestrate multiple autonomous AI agents (Codex) in parallel tmux panes to tackle large-scale tasks that can be decomposed into independent subtasks. Inspired by running "an army of codex subagents" for any parallelizable work.

## When to Use

**Good Fit (High Parallelizability):**
- Fix all linting/type errors across codebase
- Add CRUD endpoints for multiple resources
- Write tests for all components in a directory
- Migrate patterns across multiple files (class → functional components)
- Add feature to multiple similar files (error handling, logging, validation)
- Generate documentation for all public APIs
- Implement multiple independent user stories
- Fix all TODO/FIXME comments
- Add TypeScript types to JavaScript files
- Refactor similar patterns across codebase

**Bad Fit:**
- Sequential dependencies (step 2 needs step 1 output)
- Single large monolithic task
- Exploratory work (unclear requirements)
- Requires tight coordination between agents
- Too granular (100+ micro-tasks)

**Parallelizability Score:**
- 🟢 90%+ independent → 4-5 agents
- 🟡 70-90% independent → 3-4 agents
- 🟠 50-70% independent → 2-3 agents
- 🔴 <50% independent → Don't orchestrate

## Core Pattern

### Phase 1: Analysis & Planning

```typescript
interface Goal {
  description: string  // User's goal
  scope: string[]      // Files/directories affected
  success_criteria: string[]
}

function analyzeGoal(goal: Goal) {
  // 1. Identify work units
  const units = identifyWorkUnits(goal.scope)

  // 2. Check dependencies
  const dependencies = analyzeDependencies(units)

  // 3. Calculate parallelizability
  const score = calculateParallelizability(units, dependencies)

  // 4. Suggest agent count
  const agentCount = Math.min(Math.ceil(units.length / 3), 5)

  // 5. Generate task breakdown
  const tasks = distributeWork(units, agentCount)

  return { score, agentCount, tasks }
}
```

**Present plan to user:**
```
Goal: Fix all TypeScript errors
Scope: convex/**/*.ts, src/**/*.ts
Work Units: 47 type errors across 8 files

Parallelizability: 85% (🟢 Good fit)
Recommended Agents: 4

Task Breakdown:
  Agent 1: ESLint config migration (1 file, high priority)
  Agent 2: scheduling.ts type fixes (16 errors)
  Agent 3: vectorSearch.ts type fixes (11 errors)
  Agent 4: Remaining files (20 errors across 5 files)

Proceed? (y/n)
```

### Phase 2: Environment Setup

**Tmux Layout:**
```bash
# Create 2x3 grid (4 agents + 1 orchestrator + 1 monitor)
SESSION="orchestrate-$(date +%s)"
tmux new-session -d -s $SESSION -n main

# Split into panes
tmux split-window -h -t $SESSION:main
tmux split-window -h -t $SESSION:main
tmux select-layout -t $SESSION:main even-horizontal
tmux split-window -v -t $SESSION:main.1
tmux split-window -v -t $SESSION:main.2
tmux split-window -v -t $SESSION:main.3

# Pane 0: Orchestrator (Claude Code - this conversation)
# Panes 1-4: Agent workers
# Pane 5: Live monitor
```

**State Tracking:**
```json
{
  "session_id": "orchestrate-1730034567",
  "goal": "Fix all TypeScript errors",
  "start_time": "2025-10-27T07:15:00Z",
  "baseline": {
    "errors": 47,
    "files": 8
  },
  "agents": [
    {
      "id": 1,
      "pane": 1,
      "task": "ESLint config migration",
      "status": "running",
      "progress": "installing dependencies",
      "fixed": 0
    }
  ],
  "commits": [],
  "current": {
    "errors": 47,
    "last_check": "2025-10-27T07:16:30Z"
  }
}
```

### Phase 3: Agent Deployment

**CRITICAL: Use --approval-policy never**

```bash
# Template
tmux send-keys -t $PANE "npx -y codex --approval-policy never '
Agent $N: $ROLE

GOAL: $SPECIFIC_GOAL

CONTEXT:
$RELEVANT_CONTEXT

TASKS:
$STEP_BY_STEP_TASKS

SUCCESS CRITERIA:
$VERIFICATION_STEPS

COMMIT MESSAGE FORMAT:
$COMMIT_FORMAT
'" Enter
```

**Example Goals:**

```bash
# Linting/Types
"Agent 2: Fix all TypeScript errors in convex/functions/scheduling.ts.
Check convex/schema.ts for correct types. Add missing properties or fix
type mismatches. Verify with pnpm tsc. Commit as:
fix(scheduling): resolve type mismatches"

# Feature Implementation
"Agent 3: Add CRUD endpoints for Comment resource. Create
convex/comments.ts with list, get, create, update, delete mutations.
Follow same pattern as convex/posts.ts. Add to convex/schema.ts.
Test with curl. Commit as: feat(comments): add CRUD endpoints"

# Test Writing
"Agent 1: Write tests for all components in src/features/auth/. Use
Vitest + React Testing Library. Cover happy path, error cases, edge cases.
Aim for 80%+ coverage. Commit as: test(auth): add component tests"

# Refactoring
"Agent 4: Migrate class components to functional in src/legacy/. Convert
lifecycle methods to hooks. Preserve exact behavior. Test after each
conversion. Commit per file: refactor(legacy): convert ComponentName to
functional"
```

### Phase 4: Orchestration & Monitoring

**Monitor Script (runs in pane 5):**
```bash
#!/bin/bash
GOAL="$1"
START_METRIC="$2"  # e.g., error count, file count
METRIC_CMD="$3"    # e.g., "pnpm tsc --noEmit | grep -c 'error TS'"

while true; do
  clear
  echo "🎯 Multi-Agent Orchestration: $GOAL"
  echo "⏰ $(date '+%H:%M:%S')"
  echo ""

  # Current metric
  CURRENT=$(eval "$METRIC_CMD")
  FIXED=$((START_METRIC - CURRENT))
  PERCENT=$((FIXED * 100 / START_METRIC))

  echo "📊 Progress: $FIXED/$START_METRIC completed ($PERCENT%)"
  echo ""

  # Agent status (check git status for activity)
  echo "🤖 Agent Status:"
  for i in 1 2 3 4; do
    STATUS=$(tmux capture-pane -t $i -p | tail -1)
    echo "  Agent $i: $STATUS"
  done
  echo ""

  # Recent commits
  echo "✅ Commits:"
  git log --oneline --since="1 hour ago" | head -5
  echo ""

  # Check if done
  if [ $CURRENT -le 5 ]; then
    echo "🎉 Nearly complete! Launch verification."
    break
  fi

  sleep 15
done
```

**Auto-Approval Daemon (handles stuck agents):**
```bash
#!/bin/bash
# Run in background to auto-approve prompts
while true; do
  for pane in 1 2 3 4; do
    # Check if waiting for approval
    if tmux capture-pane -t $pane -p | grep -q "bypass permissions"; then
      tmux send-keys -t $pane Tab Enter
    fi
  done
  sleep 2
done
```

**Load Balancing:**
```bash
# If agent finishes early, reassign work
function reassignWork() {
  AGENT_ID=$1
  REMAINING_WORK=$(getRemainingWork)

  if [ -n "$REMAINING_WORK" ]; then
    tmux send-keys -t $AGENT_ID C-c  # Stop current
    tmux send-keys -t $AGENT_ID "npx -y codex --approval-policy never '
Agent $AGENT_ID (Reassigned): $REMAINING_WORK
'" Enter
  fi
}
```

### Phase 5: Verification & Collection

**Verification Agent:**
```bash
tmux send-keys -t 5 "npx -y codex --approval-policy never '
Verification Agent:

GOAL: Verify all agent work and complete remaining tasks

STEPS:
1. Run full verification: $VERIFICATION_COMMANDS
2. Analyze remaining issues
3. If issues < 5: fix manually
4. If issues >= 5: report for human review
5. Regenerate any generated types/code
6. Run tests if applicable
7. Commit final fixes
8. Generate summary report

REPORT FORMAT:
- Total work completed
- Commits made
- Remaining issues
- Recommendations
'" Enter
```

**Collect Artifacts:**
```bash
# Commits
git log --oneline --since="1 hour ago" > orchestration-commits.txt

# Final state
echo "Goal: $GOAL" > orchestration-report.md
echo "Start: $START_METRIC" >> orchestration-report.md
echo "End: $CURRENT_METRIC" >> orchestration-report.md
echo "Reduction: $PERCENT%" >> orchestration-report.md
echo "" >> orchestration-report.md
git log --stat --since="1 hour ago" >> orchestration-report.md
```

## Usage Examples

### Example 1: Fix Linting Errors
```
Goal: Fix all ESLint errors after upgrading to v9
Agents: 4
- Agent 1: Migrate config to flat format
- Agent 2: Fix import/export issues
- Agent 3: Fix unused vars
- Agent 4: Fix code style issues
Success: 127 → 3 errors (98% reduction)
Time: 18 minutes
```

### Example 2: Add CRUD Endpoints
```
Goal: Add CRUD for User, Post, Comment, Like, Follow
Agents: 5 (one per resource)
- Each agent: Create convex file, schema, mutations, queries
Success: 5 complete APIs with tests
Time: 35 minutes
```

### Example 3: Write Component Tests
```
Goal: Test all components in src/features/
Agents: 3 (split by feature)
- Agent 1: auth feature (12 components)
- Agent 2: dashboard feature (18 components)
- Agent 3: settings feature (8 components)
Success: 38 component test files, 94% coverage
Time: 45 minutes
```

### Example 4: Migrate to New Pattern
```
Goal: Convert all class components to functional with hooks
Agents: 4
- Each agent: 5-7 components
- Strategy: Convert, test, commit per component
Success: 23 components migrated, all tests pass
Time: 40 minutes
```

## Prompt Iteration Strategy

If agents fail or get stuck, iterate on prompts:

**Iteration 1 (Broad):**
```
"Fix all TypeScript errors in this file"
```

**Iteration 2 (Specific):**
```
"Fix TypeScript errors in scheduling.ts:
- Lines 58, 64: Add 'reason' property to schema
- Lines 130, 221: Add 'job' property
- Check convex/schema.ts for correct type definitions"
```

**Iteration 3 (Ultra-Specific):**
```
"scheduling.ts line 58: Error says 'reason' doesn't exist on type.
1. Read convex/schema.ts
2. Find scheduledMessages table definition
3. Add 'reason: v.optional(v.string())' to schema
4. Verify error is fixed
5. Commit"
```

## Configuration Schema

```json
{
  "orchestration": {
    "name": "fix-typescript-errors",
    "goal": "Fix all TypeScript errors",
    "max_agents": 4,
    "approval_policy": "never",
    "timeout_per_agent": 600,
    "verification": {
      "commands": [
        "pnpm tsc --noEmit",
        "pnpm lint"
      ],
      "success_threshold": 0.9
    },
    "monitoring": {
      "interval_seconds": 15,
      "metric_command": "pnpm tsc --noEmit 2>&1 | grep -c 'error TS'"
    },
    "commit_strategy": {
      "format": "type(scope): description",
      "per_agent": true,
      "group_related": true
    }
  }
}
```

## Advanced Features

### Resume from Failure
```bash
# Save state on interrupt
trap "saveState" INT TERM

function saveState() {
  jq -n \
    --arg goal "$GOAL" \
    --arg agents "$AGENT_STATUS" \
    --arg commits "$(git log --oneline --since='1 hour ago')" \
    '{goal: $goal, agents: $agents, commits: $commits}' \
    > .orchestration-state.json
}

# Resume
function resume() {
  STATE=$(cat .orchestration-state.json)
  # Relaunch incomplete agents
}
```

### Agent Specialization
```typescript
const agentTypes = {
  'type-fixer': {
    model: 'claude-sonnet-4',
    expertise: 'TypeScript type errors',
    timeout: 300
  },
  'test-writer': {
    model: 'claude-sonnet-4',
    expertise: 'Test coverage',
    timeout: 600
  },
  'feature-builder': {
    model: 'claude-sonnet-4',
    expertise: 'Full-stack features',
    timeout: 900
  }
}
```

### Adaptive Agent Count
```typescript
function calculateOptimalAgents(workUnits: WorkUnit[]) {
  const complexity = workUnits.reduce((sum, u) => sum + u.complexity, 0)
  const avgComplexity = complexity / workUnits.length

  if (avgComplexity > 8) return Math.min(workUnits.length, 3)
  if (avgComplexity > 5) return Math.min(workUnits.length, 4)
  return Math.min(workUnits.length, 5)
}
```

## Key Learnings from Production Use

### ✅ DO
- **Always use --approval-policy never** (critical!)
- Start with 3-4 agents, not more
- Split by logical units (files, features, error types)
- Monitor every 15-30 seconds
- Commit in logical groups per agent
- Touch files to trigger regeneration if needed
- Iterate on prompts if agents stuck
- Set clear success criteria per agent
- Include verification commands in agent prompts

### ❌ DON'T
- Skip --approval-policy flag (will get stuck)
- Launch >5 agents (diminishing returns + management overhead)
- Mix unrelated work in one agent
- Forget to regenerate generated code/types
- Commit everything at once
- Give vague prompts
- Start orchestration for <10 work units
- Parallelize tightly coupled work

## Integration with Other Skills

**skill-creator:**
- Use orchestrator to generate multiple related skills

**test-runner:**
- Verify each agent's work doesn't break tests
- Run full suite after orchestration

**git-workflow:**
- Create PR with all orchestrated commits
- Generate detailed PR description

**documentation:**
- Generate migration guide from commits
- Document architecture changes

## Success Metrics

**Error Reduction:**
- Good: 70-80%
- Great: 80-90%
- Excellent: 90%+

**Time Efficiency:**
- 20-50 errors: ~20 min
- 50-100 errors: ~35 min
- 100+ errors: ~60 min
- Compare to manual: 3-5x faster

**Quality:**
- All tests pass
- Logical commit groups
- <5 remaining issues
- No regressions

## Troubleshooting

**Problem: Agents stuck on approval prompts**
```bash
# Solution: Auto-approval loop
while true; do
  for i in 1 2 3 4; do tmux send-keys -t $i "2" Enter; done
  sleep 2
done
```

**Problem: Generated types not updating**
```bash
# Solution: Regenerate and touch
npx convex dev --once --prod
touch convex/schema.ts
```

**Problem: Agents conflicting on same files**
```bash
# Solution: Better work distribution
# Split by file/directory, not by error type
```

**Problem: Agent finished too early**
```bash
# Solution: Reassign remaining work
# Check for remaining tasks and launch new task in that pane
```

**Problem: Too many errors to orchestrate**
```bash
# Solution: Two-phase approach
# Phase 1: Fix categories that will cascade-fix others
# Phase 2: Orchestrate remaining
```

## Template Goals for Quick Use

```bash
# Linting
"Fix all ESLint errors"
"Fix all TypeScript strict mode errors"
"Fix all import/export issues"

# Features
"Add CRUD endpoints for [Resource1, Resource2, ...]"
"Implement [Story1, Story2, ...] from sprint backlog"
"Add [Feature] to all components in [Directory]"

# Testing
"Write tests for all components in [Directory]"
"Add E2E tests for [Flow1, Flow2, ...]"
"Increase coverage to 80%+ in [Scope]"

# Refactoring
"Migrate all class components to functional"
"Replace [OldPattern] with [NewPattern] in [Scope]"
"Add error handling to all API routes"

# Documentation
"Generate JSDoc for all public functions"
"Create API docs for all endpoints"
"Add README to all packages"

# Cleanup
"Fix all TODO comments"
"Remove all console.logs"
"Update all dependencies to latest"
```

## Final Notes

This is not just a linting tool - it's a **general-purpose parallel work orchestration system**. Any task that can be broken into independent subtasks can benefit from this pattern.

The key is:
1. **Decomposition** - Break large goal into subtasks
2. **Distribution** - Assign to multiple agents
3. **Coordination** - Monitor and manage progress
4. **Verification** - Ensure quality and completeness
5. **Collection** - Gather artifacts and report

Think of it as having 4-5 junior developers working in parallel under your supervision, except they never get tired and work at AI speed.

**"An army of codex subagents, orchestrated with creativity."**
