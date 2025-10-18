# Agent Instruction Optimization

Optimizes agent instructions for trauma-informed principles (P1-P6) using both DIY meta-prompting and orthodox AX-LLM framework.

## Setup

**Prerequisites:**
1. Create evaluation dataset: `evals/data/gc_set_0925v1.jsonl` (JSONL format with prompt/answer pairs)
2. Set `OPENAI_API_KEY` in `.env.local`

## TL;DR

```bash
# Quick test (5 examples, 2 iterations, ~5 min, $2-5)
npm run optimize:main -- --iterations 2 --sample 5

# Full run (50 examples, 5 iterations, ~30 min, $10-20)
npm run optimize:main

# Review results
cat dspy_optimization/results/main_optimized_*.json
```

**Note:** Script will fail with ENOENT error if dataset file doesn't exist. Create the dataset first.

**What it does:** Rewrites agent instructions to be more trauma-informed (72% → 87% score)
**What it optimizes:** Instruction text in `src/instructions.ts`
**How to deploy:** Copy `optimized_instruction` from results JSON → `src/instructions.ts`

## What Gets Optimized

Agent instructions in `src/instructions.ts`:
- `mainInstructions()` - 127 lines → better validation, skip options, value delivery
- `crisisInstructions()` - 73 lines → better crisis support patterns
- `assessmentInstructions()` - 68 lines → better question delivery

**Example transformation:**
```
BEFORE: "Validate feelings and offer support"

AFTER: "1. Acknowledge: 'I hear how hard this is'
        2. Validate: 'You're carrying a lot'
        3. Offer: 'Want to do a 2-min check-in?'
        4. Skip option: 'Or we can talk another time?'"
```

## Trauma Metric (Weighted)

- P1: Acknowledge > Answer > Advance (20%)
- P6: Deliver Value Every Turn (20%)
- P3: Respect Boundaries (15%)
- P5: Always Offer Skip (15%)
- Forbidden Words (15%)
- SMS ≤150 chars (10%)
- P2: Never Repeat (3%)
- P4: Soft Confirmations (2%)

**Score = Weighted sum** (e.g., 0.87 = 87% trauma-informed)

## Commands

```bash
npm run optimize:main        # Optimize main agent
npm run optimize:crisis      # Optimize crisis agent
npm run optimize:assessment  # Optimize assessment agent

# Custom
npm run optimize -- --agent main --iterations 10 --sample 100
```

**Options:** `--agent`, `--iterations`, `--sample`, `--dataset`

## How It Works

1. Evaluate baseline instruction on sample examples
2. Identify 3 weakest trauma principles
3. Use GPT-4o to generate improved instruction
4. Re-evaluate and keep if better
5. Repeat for N iterations
6. Save best result

**Uses:**
- `gpt-5-nano` for fast, cost-effective evaluation (OpenAI Agents SDK)
- `gpt-5-mini` for meta-prompting and response generation (OpenAI Agents SDK)
- Reasoning effort: `minimal` for evaluation, `low` for meta-prompting
- Text verbosity: `low` for concise responses

## Results Format

```json
{
  "baseline_score": 0.72,
  "optimized_score": 0.87,
  "improvement_percent": 20.8,
  "optimized_instruction": "You are GiveCare...",
  "detailed_metrics": {
    "p1": 0.92,
    "p6": 0.89,
    ...
  }
}
```

## Deploy

1. Review: `cat results/main_optimized_*.json | jq '.optimized_instruction'`
2. Copy `optimized_instruction` → `src/instructions.ts`
3. Deploy: `npx convex deploy --prod`

## AX-LLM Orthodox Implementation (MiPRO v2 - REFACTORED)

### Status: ✅ Production Ready (v14+ patterns, TDD-verified)

**Refactored 2025-10-17** to use latest ax-llm v14+ patterns:
- ✅ Factory functions (`ai()`, `ax()` instead of constructors)
- ✅ Descriptive field names (`caregiverQuestion`, `traumaInformedReply`)
- ✅ MiPRO v2 self-consistency (sampleCount)
- ✅ Custom result picker for trauma-informed selection
- ✅ Checkpointing for long-running optimizations
- ✅ Cost tracking with budget limits
- ✅ Python service configuration
- ✅ Comprehensive test suite (17 tests)

**Files:**
- `ax-optimize.ts` - **REFACTORED** Orthodox AX-LLM optimizer (MiPRO v2)
- `run-ax-optimization.ts` - CLI runner with optimizer selection
- `types.ts` - **UPDATED** with descriptive field names
- `tests/ax-optimize.test.ts` - **NEW** Test suite (17 tests)
- `MIPRO_V2_REFACTORING.md` - **NEW** Detailed refactoring documentation

**Available optimizers:**
1. **Bootstrap Few-Shot** (TypeScript-only, no Python needed)
   - ✅ MiPRO v2 compliant
   - Optimizes few-shot examples with cost tracking
   - Command: `npm run optimize:ax:bootstrap`

2. **MIPROv2** (Requires Python service)
   - ✅ MiPRO v2 with self-consistency (sampleCount=3)
   - ✅ Custom trauma-informed result picker
   - ✅ Checkpointing support
   - Full Bayesian optimization
   - Expected: 15-25% improvement vs DIY (9%)
   - Command: `npm run optimize:ax:mipro` (after starting Python service)

3. **GEPA** (Multi-objective)
   - ✅ MiPRO v2 compliant
   - Optimizes quality vs brevity trade-off
   - Pareto-optimal solutions
   - Command: `npm run optimize:ax:gepa`

### Setting Up MIPROv2 (Python Service)

MIPROv2 requires a Python optimizer service for Bayesian optimization:

```bash
# 1. Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Navigate to optimizer directory (from project root)
cd src/optimizer

# 3. Install dependencies
uv sync

# 4. Start optimizer service
uv run ax-optimizer server start --debug

# Service will run on http://localhost:8000
```

Then from `give-care-app`:

```bash
npm run optimize:ax:mipro -- --trials 30 --sample 50
```

### MiPRO v2 Advanced Features

**Self-Consistency (NEW):**
```typescript
const optimizer = new AxInstructionOptimizer(
  process.env.OPENAI_API_KEY!,
  5,      // $5 budget
  100000  // 100k token limit
);

const result = await optimizer.optimizeWithMiPRO(
  baseInstruction,
  examples,
  {
    sampleCount: 3,  // Generate 3 independent samples
    checkpointInterval: 10,  // Save progress every 10 rounds
    resumeFromCheckpoint: 'checkpoint_12345',  // Resume if interrupted
    verbose: true
  }
);
```

**Cost Tracking:**
```typescript
console.log(`Total cost: $${result.optimization_stats.total_cost}`);
console.log(`Total tokens: ${result.optimization_stats.total_tokens}`);
```

**Checkpointing:**
```bash
# Checkpoints saved to: dspy_optimization/checkpoints/
ls dspy_optimization/checkpoints/
# checkpoint_1760705671333.json

# Resume from checkpoint
npm run optimize:ax:mipro -- --resume checkpoint_1760705671333
```

### Comparison: DIY vs AX-LLM

| Feature | DIY Meta-Prompting | AX Bootstrap | AX MIPROv2 |
|---------|-------------------|--------------|------------|
| **Setup** | ✅ None | ✅ None | ⚠️  Python service |
| **Strategy** | Greedy hill-climbing | Few-shot selection | Bayesian optimization |
| **Candidates** | 1 per iteration | Multiple demos | 5-10 per trial |
| **Self-Consistency** | ❌ | ❌ | ✅ 3 samples |
| **Checkpointing** | ❌ | ✅ | ✅ |
| **Cost Tracking** | ❌ | ✅ | ✅ |
| **Improvement** | 9% (0.818→0.892) | 10-15% (est.) | 15-25% (est.) |
| **Cost** | $10-15 (50 ex, 5 iter) | $15-25 | $50-75 |
| **Time** | 11 minutes | 15-20 minutes | 30-60 minutes |
| **Production Ready** | ✅ Yes | ✅ MiPRO v2 | ⚠️  Requires service |

### Current Results

**DIY Optimization (Completed 2025-10-17):**
- Baseline: 0.818 (81.8%)
- Optimized: 0.892 (89.2%)
- Improvement: **+9.0%**
- P1 (Acknowledge/Answer/Advance): 0.860
- P2 (Never Repeat): 1.000
- P3 (Respect Boundaries): 0.940
- P5 (Always Offer Skip): 0.790
- P6 (Deliver Value): 0.910

**Next Step:** Test AX-LLM Bootstrap, then set up Python service for MIPROv2 to achieve 15-25% improvement.
