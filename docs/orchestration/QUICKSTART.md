# Multi-Agent Orchestration - Quick Start

## Usage

```bash
# In Claude Code conversation
/orchestrate "Fix all TypeScript errors"
/orchestrate "Add CRUD endpoints for User, Post, Comment"
/orchestrate "Write tests for all components in src/features/"
/orchestrate "Migrate class components to functional"
```

## How It Works

1. **Claude analyzes your goal** → breaks into subtasks
2. **Presents orchestration plan** → you approve
3. **Launches 3-5 Codex agents in tmux** → each gets specific task
4. **Monitors progress** → auto-handles approvals
5. **Verifies results** → reports summary

## Good Goals (High Parallelizability)

✅ Fix all linting/type errors
✅ Add features to multiple places
✅ Write tests for multiple components
✅ Migrate patterns across files
✅ Generate documentation for APIs
✅ Implement multiple user stories
✅ Fix all TODOs/FIXMEs

## Bad Goals (Low Parallelizability)

❌ Build one large feature (not decomposable)
❌ Sequential work (step 2 needs step 1)
❌ Exploratory work (unclear requirements)
❌ Too granular (100+ micro-tasks)

## Today's Success

**Goal:** Fix all TypeScript errors
**Agents:** 4 specialized agents
**Results:**
- Errors: 47 → 3 (94% reduction)
- Time: 25 minutes
- Commits: 4 logical groups

**Agents:**
1. ESLint config migrator → v9 flat config
2. Scheduling type fixer → 16 errors
3. VectorSearch annotator → 11 errors
4. Misc type cleaner → 20 errors

## Quick Reference

**View skill details:**
```bash
cat .claude/skills/multi-agent-orchestrator.md
```

**Manual orchestration:**
```bash
# 1. Create tmux layout
tmux split-window -h
tmux select-layout even-horizontal

# 2. Launch agents with --approval-policy never
tmux send-keys -t 1 "npx -y codex --approval-policy never 'task...'" Enter

# 3. Monitor progress
watch -n 15 'pnpm tsc --noEmit | grep -c error'
```

**Key Success Factors:**
- ✅ Always use `--approval-policy never`
- ✅ 3-5 agents optimal
- ✅ Clear success criteria per agent
- ✅ Monitor and iterate
- ✅ Commit logical groups

## Architecture

```
┌─────────────┬─────────────┬─────────────┐
│ Pane 0      │ Pane 1      │ Pane 3      │
│ Orchestrator│ Agent 1     │ Agent 3     │
│ (Claude)    │ (Codex)     │ (Codex)     │
├─────────────┼─────────────┼─────────────┤
│             │ Pane 2      │ Pane 4      │
│             │ Agent 2     │ Agent 4     │
│             │ (Codex)     │ (Codex)     │
│             ├─────────────┤             │
│             │ Pane 5      │             │
│             │ Monitor     │             │
└─────────────┴─────────────┴─────────────┘
```

## Example Output

```
🎯 Multi-Agent Orchestration Complete!

Goal: Fix all TypeScript errors
Duration: 25 minutes

📊 Results:
  Errors: 47 → 3 (94% reduction)
  Files Modified: 8
  Commits: 4

🤖 Agent Performance:
  ✅ Agent 1: ESLint config (1 commit)
  ✅ Agent 2: scheduling.ts (16 errors fixed)
  ✅ Agent 3: vectorSearch.ts (11 errors fixed)
  ✅ Agent 4: misc files (20 errors fixed)

✅ Commits:
  fix(scheduling): resolve type mismatches
  fix(vectorSearch): add explicit type annotations
  chore(lint): migrate to ESLint v9 flat config
  fix(types): resolve wellness, watchers, summarization errors

⚠️ Remaining (3 errors):
  - Convex API type exports (manual review needed)

Next Steps:
  - Review remaining errors
  - Run full test suite
  - Create PR
```

## Tips & Tricks

**Iterate on prompts:**
If agents get stuck, make prompts more specific:
- Iteration 1: "Fix TypeScript errors"
- Iteration 2: "Fix specific error types at these lines"
- Iteration 3: "Add this exact property to schema"

**Handle approvals:**
```bash
# Auto-approve loop (if needed)
while true; do
  for i in 1 2 3 4; do
    tmux send-keys -t $i "2" Enter
  done
  sleep 2
done
```

**Load balance:**
If agent finishes early, reassign remaining work to that pane.

**Save state:**
Orchestration state is tracked - can resume if interrupted.

## Resources

- Full skill: `.claude/skills/multi-agent-orchestrator.md`
- Slash command: `/orchestrate "goal"`
- This guide: `.claude/ORCHESTRATION_QUICKSTART.md`

---

**"An army of codex subagents, orchestrated with creativity."**
