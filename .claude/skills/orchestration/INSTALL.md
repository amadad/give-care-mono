# Multi-Agent Orchestrator - Installation Guide

## User-Level Installation (All Projects)

Already installed globally for you! ✅

Files installed:
- `~/.claude/skills/multi-agent-orchestrator.md` (15KB)
- `~/.claude/commands/orchestrate.md` (1.1KB)

## Usage

From ANY project:
```
/orchestrate "your goal here"
```

## Examples

```bash
# Linting/Types
/orchestrate "Fix all TypeScript errors"
/orchestrate "Fix all ESLint warnings"

# Features
/orchestrate "Add CRUD endpoints for User, Post, Comment"
/orchestrate "Implement user stories 1-5"

# Testing
/orchestrate "Write tests for all components in src/"
/orchestrate "Add E2E tests for checkout flow"

# Refactoring
/orchestrate "Migrate class components to functional"
/orchestrate "Add error handling to all API routes"

# Documentation
/orchestrate "Generate JSDoc for all public APIs"
/orchestrate "Add README to all packages"

# Cleanup
/orchestrate "Fix all TODO comments"
/orchestrate "Remove all console.logs"
```

## How It Works

1. You provide a goal
2. Claude analyzes and breaks it into subtasks
3. Presents orchestration plan → you approve
4. Launches 3-5 Codex agents in tmux panes
5. Monitors progress, handles approvals
6. Verifies results, collects commits
7. Reports summary

## Manual Installation (For Others)

```bash
# Create directories
mkdir -p ~/.claude/skills ~/.claude/commands

# Copy files from this project
cp .claude/skills/multi-agent-orchestrator.md ~/.claude/skills/
cp .claude/commands/orchestrate.md ~/.claude/commands/

# Verify
ls -lh ~/.claude/skills/multi-agent-orchestrator.md
ls -lh ~/.claude/commands/orchestrate.md
```

## Project-Level Override

To customize for a specific project:
```bash
# Project-level takes precedence over user-level
cp ~/.claude/skills/multi-agent-orchestrator.md .claude/skills/
# Edit .claude/skills/multi-agent-orchestrator.md
```

## Verification

Test it works:
```bash
# In any project
claude-code

# In conversation
/orchestrate "Fix all TypeScript errors"
```

Should show orchestration plan and agent breakdown.

## Proven Results

Today's test:
- Goal: Fix all TypeScript errors
- Result: 47 → 3 errors (94% reduction)
- Time: 25 minutes
- Agents: 4 specialized agents
- Commits: 4 logical groups

## Troubleshooting

**Command not found:**
- Check: `ls ~/.claude/commands/orchestrate.md`
- Restart Claude Code

**Skill not loading:**
- Check: `ls ~/.claude/skills/multi-agent-orchestrator.md`
- File must be exactly 15KB
- Restart Claude Code

**Agents stuck on approvals:**
- This is documented in the skill
- Use `--approval-policy never` flag
- Auto-approval loop provided

## Locations

**User-Level (Global):**
- `~/.claude/skills/multi-agent-orchestrator.md`
- `~/.claude/commands/orchestrate.md`

**Project-Level (Local - Optional):**
- `.claude/skills/multi-agent-orchestrator.md`
- `.claude/commands/orchestrate.md`

**Reference Docs:**
- `.claude/skills/orchestration/QUICKSTART.md`
- `.claude/skills/orchestration/README.md`

---

**"An army of codex subagents, orchestrated with creativity."**
