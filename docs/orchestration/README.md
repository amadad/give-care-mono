# Multi-Agent Orchestration System

A general-purpose system for orchestrating multiple autonomous AI agents (Codex) in parallel to tackle large-scale decomposable tasks.

## What We Built Today

Successfully orchestrated 4 Codex agents to fix TypeScript errors:
- **47 → 3 errors (94% reduction)**
- **25 minutes total**
- **4 logical commits**

## Files

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference and usage
- **[SKILL.md](./SKILL.md)** - Complete skill specification
- **[COMMAND.md](./COMMAND.md)** - Slash command definition

## Installation

1. Copy skill to Claude skills directory:
```bash
cp docs/orchestration/SKILL.md ~/.claude/skills/multi-agent-orchestrator.md
```

2. Copy command:
```bash
cp docs/orchestration/COMMAND.md ~/.claude/commands/orchestrate.md
```

3. Use it:
```
/orchestrate "Fix all TypeScript errors"
```

## Usage Examples

### Linting/Types
```
/orchestrate "Fix all ESLint errors"
/orchestrate "Add TypeScript types to all JavaScript files"
```

### Features
```
/orchestrate "Add CRUD endpoints for User, Post, Comment"
/orchestrate "Implement user stories 1-5 from sprint backlog"
```

### Testing
```
/orchestrate "Write tests for all components in src/features/"
/orchestrate "Add E2E tests for checkout flow"
```

### Refactoring
```
/orchestrate "Migrate all class components to functional"
/orchestrate "Add error handling to all API routes"
```

## Architecture

```
Orchestrator (Claude Code)
    ↓
Analyzes Goal → Breaks into Subtasks → Plans Agents
    ↓
Launches N Codex Agents in Tmux Panes
    ↓
Monitors Progress → Handles Approvals → Coordinates Work
    ↓
Verifies Results → Collects Commits → Reports Summary
```

## Key Features

- **Goal-driven**: Pass any goal, system figures out breakdown
- **Adaptive**: Calculates optimal agent count (3-5)
- **Autonomous**: Uses `--approval-policy never`
- **Visual**: Tmux panes show real-time progress
- **Verified**: Runs checks and collects artifacts
- **General-purpose**: Not limited to linting

## Success Criteria

- ✅ 70%+ task completion
- ✅ Logical commit groups
- ✅ All tests pass
- ✅ Clear remaining work documented

## Lessons Learned

**Critical Success Factors:**
1. Always use `--approval-policy never`
2. Keep agent count 3-5 (sweet spot)
3. Clear success criteria per agent
4. Monitor and iterate on prompts
5. Commit logical groups per agent

**What Slows Down:**
- Interactive approval prompts (solved with flag)
- Too many agents (management overhead)
- Vague prompts (iterate to be specific)
- Tightly coupled work (not parallelizable)

## Inspired By

Original reference: "Let Claude Haiku run an army of codex subagents to fix linter issues. All you need is tmux and some creativity."

We took that concept and made it:
- General purpose (any goal)
- Structured (repeatable pattern)
- Documented (this system)
- Proven (94% error reduction)

---

**"An army of codex subagents, orchestrated with creativity."**
