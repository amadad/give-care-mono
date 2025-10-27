---
description: Orchestrate multiple AI agents in parallel to tackle large decomposable tasks
tags: [orchestration, parallel, agents, codex, tmux]
---

You are about to orchestrate multiple autonomous AI agents to complete a large task in parallel.

The user will provide a goal. Your job is to:

1. **Analyze the goal** using the multi-agent-orchestrator skill
2. **Determine parallelizability** (can this be split into independent subtasks?)
3. **Break down into subtasks** (3-5 optimal agent count)
4. **Present the plan** to the user for approval
5. **Execute orchestration** following the pattern in the skill
6. **Monitor progress** and coordinate agents
7. **Verify results** and collect artifacts
8. **Report summary** with metrics

**User's Goal:** {{GOAL}}

If no goal was provided, ask the user: "What would you like to orchestrate?"

Follow the complete pattern from .claude/skills/multi-agent-orchestrator.md

Remember:
- Use `--approval-policy never` for all agents
- Launch 3-5 agents maximum
- Monitor every 15-30 seconds
- Commit in logical groups
- Iterate on prompts if agents stuck

Start by analyzing the goal and presenting your orchestration plan.
