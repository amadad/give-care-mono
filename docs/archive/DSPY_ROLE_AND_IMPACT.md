# DSPy/Ax-LLM Role & Expected Impact

**Date:** 2025-01-14  
**Status:** Planning Phase  
**Optimizer:** **GEPA** (Multi-Objective Optimization)

---

## Executive Summary

**DSPy/Ax-LLM Role:** Automated prompt optimization engine that continuously improves agent prompts based on real-world outcomes, reducing costs while improving quality and compliance.

**Expected Impact:**
- **30-40% token cost reduction** (~$300-600/month at scale)
- **+15-25% response quality** (measured via user outcomes)
- **+20% trauma compliance** (P1-P6 adherence)
- **10x faster optimization** (automated vs manual)

**Yes, we're using GEPA** - The multi-objective optimizer that balances quality, cost, compliance, and SMS length simultaneously.

---

## Role in the System

### 1. **Continuous Prompt Improvement Engine**

**What It Does:**
- Runs weekly/monthly optimization cycles
- Analyzes conversation outcomes (score improvements, user engagement, compliance)
- Automatically generates improved prompt versions
- Tests multiple variations and selects optimal trade-offs

**Where It Fits:**
```
User Conversations → Feedback Loops → Outcome Data → DSPy Optimization → Improved Prompts → Better Conversations
```

### 2. **Multi-Objective Optimization (GEPA)**

**Why GEPA (Not MIPRO or ACE):**

GiveCare needs to optimize for **6 competing objectives simultaneously**:

1. **Response Quality** ⬆️ Maximize
   - User satisfaction, helpfulness, score improvements
   - Measured via: engagement rates, burnout score changes, user feedback

2. **Trauma Compliance** ⬆️ Maximize
   - P1-P6 adherence (non-negotiable)
   - Measured via: compliance scoring on each principle

3. **Token Costs** ⬇️ Minimize
   - Currently ~500 tokens/prompt (want to reduce)
   - Measured via: actual token usage per conversation

4. **SMS Length** ⬇️ Minimize
   - Must stay ≤160 characters
   - Measured via: response length

5. **Response Time** ⬇️ Minimize
   - Target <900ms
   - Measured via: latency metrics

6. **Tool Usage** ⬆️ Maximize Appropriateness
   - Right tool at right time
   - Measured via: tool effectiveness (did it help?)

**GEPA excels because:**
- Finds **Pareto frontier** (all optimal trade-off solutions)
- Can prioritize: "Quality first, but minimize tokens"
- Handles multiple competing objectives natively
- Shows you all optimal solutions, not just one

**MIPRO** = Single-objective only (not suitable)  
**ACE** = Overkill for current needs (context is already well-structured)

---

## Expected Impact Breakdown

### Current State (Manual Prompt Engineering)

| Aspect | Current | Problem |
|--------|---------|---------|
| **Token Cost** | ~1,500/conversation | High cost, no optimization |
| **Optimization** | Manual tweaking | Hours/days per iteration |
| **Metrics** | No systematic measurement | Can't measure improvement |
| **Compliance** | ~70% (estimated) | Not systematically tracked |
| **Quality** | Baseline | No data-driven improvements |

### With GEPA Optimization

| Aspect | With GEPA | Improvement |
|--------|-----------|-------------|
| **Token Cost** | ~900-1,050/conversation | **30-40% reduction** |
| **Optimization** | Automated weekly | **10x faster** |
| **Metrics** | Multi-objective tracking | **Data-driven decisions** |
| **Compliance** | ~90%+ (measured) | **+20% compliance** |
| **Quality** | +15-25% (measured) | **Better outcomes** |

### Financial Impact

**Cost Savings:**
- $0.0003-0.0006 saved per conversation (token reduction)
- **$300-600/month** at 1M conversations scale
- **$3,600-7,200/year** at scale

**Quality Improvements:**
- Higher user satisfaction → Lower churn → Higher retention
- Better outcomes → More referrals → Growth
- Better compliance → Reduced risk → Sustainability

---

## How It Works in Practice

### Phase 1: Initial Optimization (Now)

**What Happens:**
1. Collect conversation data (100-500 conversations)
2. Run GEPA optimization on `MAIN_PROMPT`
3. Test optimized prompt against baseline
4. Deploy if metrics improve

**Expected Results:**
- 30-40% token reduction
- +15-25% quality improvement
- +20% compliance improvement

**Timeline:** 2-4 weeks

### Phase 2: Continuous Improvement (3-6 months)

**What Happens:**
1. Weekly optimization runs (via cron)
2. Analyze latest conversation outcomes
3. Generate new prompt variations
4. A/B test against current production prompt
5. Deploy if better

**Expected Results:**
- Continuous incremental improvements
- Adaptation to user behavior changes
- Better intervention matching over time

**Timeline:** Ongoing

### Phase 3: Multi-Agent Optimization (6-12 months)

**What Happens:**
1. Optimize `CRISIS_PROMPT` (speed vs quality vs compliance)
2. Optimize `ASSESSMENT_PROMPT` (clarity vs length vs completion)
3. Optimize context selection (what to include/exclude)
4. Optimize tool usage patterns

**Expected Results:**
- Better crisis responses
- Higher assessment completion rates
- More effective tool usage

**Timeline:** 6-12 months

---

## Integration with Feedback Loops

### Current State: Linear/Reactive

```
User Message → Agent → Response → (No feedback loop)
```

### With DSPy: Continuous Improvement Loop

```
User Message → Agent → Response → Outcome Data → DSPy Optimization → Improved Prompts → Better Responses
```

### Data Flow:

1. **Conversation Data Collection:**
   - User messages, agent responses
   - Tool usage, memory recording
   - Response times, token usage

2. **Outcome Measurement:**
   - Burnout score changes (did score improve?)
   - User engagement (did they respond?)
   - Intervention effectiveness (did they try it? did it help?)
   - Compliance scores (P1-P6 adherence)

3. **DSPy Optimization:**
   - GEPA analyzes data
   - Generates optimized prompt variations
   - Tests against objectives (quality, cost, compliance)
   - Selects optimal solution

4. **Deployment:**
   - A/B test optimized prompt
   - Deploy if metrics improve
   - Monitor and iterate

---

## Role in Future ML Training

### Path to RL/LoRA Training:

```
Manual Prompts → DSPy Optimization → Optimized Prompts → RL Fine-tuning → Custom LoRA → Production Model
```

**Why DSPy First:**
1. **Better Baseline:** DSPy-optimized prompts = better starting point for RL
2. **Data Collection:** DSPy metrics = training signals for RL
3. **Iterative Improvement:** DSPy improves prompts → RL improves model → Loop continues

**Timeline:**
- **Now:** DSPy optimization (prompt-level)
- **6-12 months:** RL fine-tuning (model-level)
- **12-18 months:** Custom LoRA (specialized model)

---

## Implementation Roadmap

### Phase 1: Setup (Week 1-2)
- [ ] Install `@ax-llm/ax` package
- [ ] Create `convex/optimization/` directory
- [ ] Set up data collection (conversation outcomes)
- [ ] Create GEPA optimization workflow

### Phase 2: Initial Optimization (Week 3-4)
- [ ] Collect baseline conversation data (100-500 conversations)
- [ ] Run GEPA on `MAIN_PROMPT`
- [ ] Test optimized prompt
- [ ] Deploy if metrics improve

### Phase 3: Continuous Improvement (Month 2-3)
- [ ] Set up weekly cron job
- [ ] Automate optimization runs
- [ ] A/B test new prompts
- [ ] Monitor metrics

### Phase 4: Expansion (Month 4-6)
- [ ] Optimize `CRISIS_PROMPT`
- [ ] Optimize `ASSESSMENT_PROMPT`
- [ ] Optimize context selection
- [ ] Optimize tool usage

---

## Success Metrics

### Primary Metrics:

1. **Token Cost Reduction:** Target 30-40% reduction
2. **Response Quality:** Target +15-25% improvement (measured via outcomes)
3. **Compliance:** Target 90%+ P1-P6 adherence
4. **SMS Length:** Target 100% ≤160 characters

### Secondary Metrics:

1. **Optimization Speed:** Target 10x faster than manual
2. **User Satisfaction:** Target improvement in engagement rates
3. **Score Improvements:** Target better burnout score outcomes
4. **Intervention Effectiveness:** Target better intervention matching

---

## Risks & Mitigations

### Risk 1: Optimization Takes Too Long
**Mitigation:** Use workflows + batched processing (50-100 conversations per batch)

### Risk 2: Optimized Prompt Performs Worse
**Mitigation:** A/B test before deploying, keep baseline as fallback

### Risk 3: Over-Optimization (Goodhart's Law)
**Mitigation:** Monitor multiple metrics, not just one

### Risk 4: Timeout Issues
**Mitigation:** Start with Convex workflows, move to external service if needed

---

## Conclusion

**DSPy/Ax-LLM Role:** Automated prompt optimization engine that continuously improves agent performance.

**Expected Impact:**
- **30-40% cost reduction**
- **+15-25% quality improvement**
- **+20% compliance improvement**
- **10x faster optimization**

**Optimizer:** **GEPA** (Multi-Objective Optimization) - Best fit for GiveCare's competing objectives.

**Timeline:** Start now, see results in 2-4 weeks, continuous improvement ongoing.

**Next Steps:** Install Ax-LLM, set up data collection, run first GEPA optimization on `MAIN_PROMPT`.

