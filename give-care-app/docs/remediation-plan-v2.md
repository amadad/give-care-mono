# GiveCare Remediation Plan v2.0
**Holistic Assessment & Implementation Pathways**

**Based on**: NCP-AAI Technical Assessment (agent-audit.md)
**Current State**: 6.5/10 maturity - Strong architecture, critical gaps in observability
**Focus**: Multiple solution pathways with context, tradeoffs, and risk analysis
**Last Updated**: 2025-11-15

---

## Status Matrix: What We're Doing vs Not Doing

This matrix clarifies **decisions** for all 12 audit recommendations:

| # | Recommendation | Status | Rationale |
|---|----------------|--------|-----------|
| 1 | Build Monitoring Dashboard | **✅ DOING** (Week 1-2) | Production blocker - can't operate blind |
| 2 | Add Evaluation Benchmarks | **✅ DOING** (Week 3-4) | Need metrics to iterate safely |
| 3 | Human Escalation for Crisis | **✅ DOING** (Week 1, phased) | Legal/ethical requirement for mental health AI |
| 4 | Few-Shot Examples in Prompts | **✅ DOING** (Week 3) | Low-cost reliability improvement |
| 5 | Prompt Versioning System | **✅ SHOULD DO** (Week 4+) | Needed for safe A/B testing |
| 6 | LLM Response Caching | **✅ SHOULD DO** (Week 5+) | 50% cost reduction opportunity |
| 7 | CoT for Complex Decisions | **⚠️ PARTIAL** (prompt-only) | Full implementation (2x LLM calls) too costly for MVP |
| 8 | Intervention RAG System | **⏸️ NOT NOW** (Backlog) | Static table works fine for 20 interventions; revisit at 100+ |
| 9 | Memory Retrieval Strategy | **⏸️ NOT NOW** (Backlog) | Agent Component handles; explicit retrieval adds complexity |
| 10 | NeMo Guardrails | **❌ NOT DOING** | OpenAI/Gemini stack; NVIDIA migration not planned |
| 11 | Knowledge Graphs | **❌ NOT DOING** | Over-engineering for current data model (36 tables sufficient) |
| 12 | Red Team Testing | **🔮 FUTURE** (Month 6+) | Defer until post-launch with real user traffic |

**Legend**:
- ✅ **DOING**: Actively implementing in 8-week plan
- ✅ **SHOULD DO**: Recommended, prioritized in roadmap
- ⚠️ **PARTIAL**: Implementing simplified version
- ⏸️ **NOT NOW**: Consciously deferring (not a gap, just not urgent)
- ❌ **NOT DOING**: Intentionally skipping (not applicable or wrong fit)
- 🔮 **FUTURE**: Post-launch evaluation needed

---

## Executive Summary

This remediation plan addresses 12 prioritized gaps from the NCP-AAI audit across 10 domains. Unlike prescriptive solutions, this plan provides:

- **Multiple implementation pathways** for each gap (not singular "do this")
- **Context & tradeoffs** for decision-making
- **Risk assessment** (low/medium/high/critical)
- **Cost analysis** (time, money, complexity)
- **Dependencies** between recommendations
- **Anti-patterns** to avoid

### Current Capabilities (What EXISTS)

✅ **Strong Foundation**:
- 3-agent architecture (Main, Assessment, Crisis) with 8 tools
- Comprehensive testing (3,578 LOC simulation tests, no mocks)
- Memory system with vector embeddings
- 36-table schema with proper indexing
- Crisis detection (19 keywords, deterministic)
- P1-P6 trauma-informed principles in prompts
- Admin dashboard with 7 monitoring pages

✅ **Partial Implementation**:
- Execution logging (`agent_runs` table exists)
- Crisis alerts (`alerts` table, no human workflow)
- Event tracking (`events`, `guardrail_events` tables)
- Workflows defined (check-ins, engagement - crons disabled)
- Admin UI (exists but queries need backend implementation)

### Critical Gaps (What's MISSING)

🚨 **Production Blockers**:
1. No metrics aggregation (data exists, queries missing)
2. No alerting system (can't detect incidents)
3. No human escalation for crisis (automated only)
4. No evaluation benchmarks (can't measure quality)

⚠️ **High Priority**:
5. No few-shot examples in prompts
6. No prompt versioning system
7. No LLM response caching
8. No CoT reasoning traces

📋 **Medium Priority**:
9. No intervention RAG (static table)
10. No active memory retrieval
11. No model versioning/rollback
12. Limited NVIDIA platform usage

---

## How to Use This Plan

### Decision Framework

For each gap, this plan provides:

```
Gap: [What's missing]
├── Context: Why it matters + current impact
├── Options (2-3 pathways):
│   ├── Option A: [Quick win / minimal change]
│   ├── Option B: [Balanced approach]
│   └── Option C: [Comprehensive solution]
├── Comparison Matrix:
│   ├── Complexity (1-5 scale)
│   ├── Cost (time + money)
│   ├── Risk (low/med/high/critical)
│   └── Dependencies (what must exist first)
├── Recommended Path: [Our suggestion + rationale]
└── Anti-Patterns: [What NOT to do]
```

### Prioritization

Gaps are organized by:
1. **Critical** (Week 1-2) - Production blockers
2. **High** (Week 3-4) - Quality & reliability
3. **Medium** (Week 5-8) - Optimization & scale
4. **Low** (Backlog) - Future enhancements

---

## Domain 1: Monitoring & Observability

### Current State Analysis

**What EXISTS**:
- ✅ `agent_runs` table (agentName, threadId, toolCalls, createdAt)
- ✅ `guardrail_events` table (type, severity, context)
- ✅ `alerts` table (status: pending/processed)
- ✅ Admin dashboard UI (7 pages with charts/tables)
- ✅ Trace viewer component (330 LOC, span timeline)

**What's MISSING**:
- ❌ Aggregation queries (data stored but not queried)
- ❌ Real-time alerting (PagerDuty, email, SMS)
- ❌ Cost tracking (token usage → $ conversion)
- ❌ Trend analysis (burnout over time, intervention effectiveness)

**Current Impact**:
- Blind operation in production (can't see error rates, latency)
- Incidents detected by user complaints, not proactive alerts
- Unknown cost profile (could be $50/day or $500/day)
- Can't answer: "Is agent quality improving over time?"

---

### Gap 1A: No Metrics Dashboard

**Context**: Admin UI exists (`give-care-admin/src/routes/`) but backend queries missing. Dashboard shows mock data.

#### Option A: Minimal Viable Metrics (1 week)

**Approach**: Implement 3 core queries in `convex/metrics.ts`:

```typescript
// 1. Agent execution metrics (last 24h)
export const getAgentMetrics = query({
  args: { timeWindow: v.number() },
  handler: async (ctx, { timeWindow }) => {
    const runs = await ctx.db
      .query("agent_runs")
      .filter(q => q.gte(q.field("createdAt"), Date.now() - timeWindow))
      .collect();

    return {
      totalRuns: runs.length,
      byAgent: groupBy(runs, "agentName"),
      avgLatency: avg(runs.map(r => r.latencyMs)),
      errorRate: runs.filter(r => r.error).length / runs.length,
    };
  },
});

// 2. Crisis alert metrics
export const getCrisisMetrics = query({
  args: { timeWindow: v.number() },
  handler: async (ctx, { timeWindow }) => {
    const alerts = await ctx.db
      .query("alerts")
      .filter(q => q.gte(q.field("_creationTime"), Date.now() - timeWindow))
      .collect();

    return {
      total: alerts.length,
      bySeverity: groupBy(alerts, "severity"),
      pending: alerts.filter(a => a.status === "pending").length,
    };
  },
});

// 3. Tool usage metrics (extract from agent_runs.toolCalls)
export const getToolMetrics = query({
  args: { timeWindow: v.number() },
  handler: async (ctx, { timeWindow }) => {
    const runs = await ctx.db
      .query("agent_runs")
      .filter(q => q.gte(q.field("createdAt"), Date.now() - timeWindow))
      .collect();

    const toolCalls = runs.flatMap(r => r.toolCalls || []);
    return {
      byTool: groupBy(toolCalls, "name"),
      successRate: calculateSuccessRate(toolCalls),
    };
  },
});
```

**Wire to Admin Dashboard**:
```typescript
// give-care-admin/src/routes/index.tsx
const metrics = useQuery(api.metrics.getAgentMetrics, {
  timeWindow: 86400000 // 24 hours
});
```

**Pros**:
- ✅ 1 week implementation (backend + frontend wiring)
- ✅ Uses existing tables (no schema changes)
- ✅ Admin dashboard becomes functional immediately
- ✅ Low risk (read-only queries)

**Cons**:
- ❌ No historical trends (only real-time)
- ❌ No alerting (just visualization)
- ❌ Performance: full table scans (slow at 10k+ runs/day)

**Cost**: 40 hours (1 FTE-week)
**Risk**: Low
**Dependencies**: None

---

#### Option B: Balanced Approach with Pre-Aggregation (2-3 weeks)

**Approach**: Add daily aggregation tables + cron jobs

**Schema Addition**:
```typescript
// convex/schema.ts - add new tables
metrics_daily: defineTable({
  date: v.string(), // "2025-01-15"
  agentName: v.string(),
  totalRuns: v.number(),
  avgLatencyMs: v.number(),
  errorCount: v.number(),
  toolUsage: v.any(), // { searchResources: 50, recordMemory: 30, ... }
  costUsd: v.number(),
}).index("by_date", ["date"]),

metrics_hourly: defineTable({
  hour: v.string(), // "2025-01-15T14:00:00Z"
  agentName: v.string(),
  // ... same fields as daily
}).index("by_hour", ["hour"]),
```

**Aggregation Cron**:
```typescript
// convex/crons.ts
crons.daily("aggregate-metrics", { hour: 0, minute: 5 },
  internal.metrics.aggregateDaily
);

crons.hourly("aggregate-metrics-hourly", { minute: 5 },
  internal.metrics.aggregateHourly
);
```

**Benefits**:
- ✅ Fast queries (pre-aggregated, no table scans)
- ✅ Historical trends (30+ days)
- ✅ Hourly granularity for spike detection
- ✅ Cost tracking (add token usage → $ conversion)

**Tradeoffs**:
- ⚠️ Schema changes required (migration needed)
- ⚠️ Cron jobs add complexity (debugging overhead)
- ⚠️ 1-hour lag for hourly metrics (acceptable for most use cases)

**Cost**: 80-120 hours (2-3 FTE-weeks)
**Risk**: Medium (schema migration, cron reliability)
**Dependencies**: Need to add `llm_usage` table for cost tracking

---

#### Option C: Full Observability Stack (4-6 weeks)

**Approach**: External metrics platform (Grafana Cloud + Prometheus exporter)

**Architecture**:
```
Convex Actions
    ↓
Prometheus Exporter (custom action)
    ↓ (scrape every 60s)
Grafana Cloud
    ↓
Alertmanager → PagerDuty/Slack
```

**Implementation**:
```typescript
// convex/actions/metrics.ts
export const exportPrometheusMetrics = action({
  handler: async (ctx) => {
    const runs = await ctx.runQuery(internal.metrics.getRecentRuns, {});

    // Convert to Prometheus format
    return `
# HELP givecare_agent_calls_total Total agent calls
# TYPE givecare_agent_calls_total counter
givecare_agent_calls_total{agent="main"} ${runs.main.count}
givecare_agent_calls_total{agent="assessment"} ${runs.assessment.count}

# HELP givecare_latency_ms Agent latency in milliseconds
# TYPE givecare_latency_ms histogram
givecare_latency_ms_bucket{agent="main",le="1000"} ${runs.main.bucket1000}
givecare_latency_ms_bucket{agent="main",le="2000"} ${runs.main.bucket2000}
    `.trim();
  },
});
```

**Grafana Dashboards**:
- Agent execution rates (req/s)
- Latency distribution (p50, p95, p99)
- Error rates by agent/tool
- Crisis alert frequency
- Cost trends ($ per day)

**Benefits**:
- ✅ Industry-standard observability
- ✅ Advanced features (anomaly detection, forecasting)
- ✅ Alerting built-in (PagerDuty integration)
- ✅ Multi-tenancy (dev/staging/prod dashboards)
- ✅ Correlate with infrastructure metrics (Convex performance)

**Tradeoffs**:
- ❌ External dependency (Grafana Cloud outage = no metrics)
- ❌ Cost: $50-200/month for Grafana Cloud
- ❌ Learning curve (Prometheus query language)
- ❌ Over-engineering for current scale (<100 users)

**Cost**: 160-240 hours (4-6 FTE-weeks) + $100/month recurring
**Risk**: Medium (external dependency, cost escalation)
**Dependencies**: Prometheus client library, Grafana account

---

#### Comparison Matrix

| Criteria | Option A (Minimal) | Option B (Balanced) | Option C (Full Stack) |
|----------|-------------------|---------------------|----------------------|
| **Complexity** | ⭐ (1/5) | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐⭐ (5/5) |
| **Time to Deploy** | 1 week | 2-3 weeks | 4-6 weeks |
| **Cost (One-time)** | $4k | $8-12k | $16-24k |
| **Cost (Recurring)** | $0 | $0 | $100-200/mo |
| **Historical Data** | None | 30+ days | Unlimited |
| **Alerting** | ❌ | Manual | ✅ Automated |
| **Performance** | Slow (scans) | Fast (pre-agg) | Fast (external) |
| **Risk** | Low | Medium | Medium |
| **Scale Ceiling** | 1k runs/day | 100k runs/day | Unlimited |

---

#### Recommended Path: **Option B (Balanced)**

**Rationale**:
1. **Right-sized for current scale**: 95% of traffic is Main agent, <1k messages/day
2. **Fast queries without over-engineering**: Pre-aggregation solves performance, no external deps
3. **Future-proof**: Can add Option C (Grafana) later without migration
4. **Cost-effective**: No recurring costs, 2-3 week implementation

**Implementation Phases**:

**Phase 1 (Week 1)**: Core queries
- Implement Option A queries first (get dashboard working)
- Deploy to production, validate with real traffic

**Phase 2 (Week 2)**: Add aggregation
- Schema migration: add `metrics_daily`, `metrics_hourly` tables
- Implement aggregation crons
- Backfill historical data (last 30 days from `agent_runs`)

**Phase 3 (Week 3)**: Enhance dashboard
- Add trend charts (burnout over time, intervention effectiveness)
- Cost tracking (add `llm_usage` table, wire to dashboard)
- Export CSV functionality

**Success Criteria**:
- ✅ Dashboard loads <500ms (pre-aggregated queries)
- ✅ 30-day historical trends visible
- ✅ Cost tracking accurate within ±10%
- ✅ Zero production incidents from monitoring implementation

---

#### Anti-Patterns to Avoid

❌ **Don't**: Build custom time-series database in Convex
- **Why**: Convex is not optimized for time-series data
- **Instead**: Pre-aggregate to daily/hourly, use external tools for advanced analytics

❌ **Don't**: Query `agent_runs` table directly in real-time dashboard
- **Why**: Table scans kill performance at scale (10k+ runs/day)
- **Instead**: Use pre-aggregated tables or cache results

❌ **Don't**: Over-engineer alerting before understanding baseline metrics
- **Why**: Alert fatigue (false positives) worse than no alerts
- **Instead**: Run Option B for 2 weeks, observe patterns, then add alerts

❌ **Don't**: Track every single metric "just in case"
- **Why**: High cardinality kills query performance
- **Instead**: Start with 5 key metrics (error rate, latency p95, cost/day, crisis alerts, tool success rate)

---

### Gap 1B: No Real-Time Alerting

**Context**: Crisis events logged to `alerts` table but no human notification system.

#### Option A: Email Alerts via Resend (1 week)

**Approach**: Send email when crisis detected or error rate spikes

**Implementation**:
```typescript
// convex/actions/alerts.ts (already exists from remediation-plan.md)
import { Resend } from "resend";

export const sendCrisisAlert = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.getById, { alertId });
    const user = await ctx.runQuery(internal.users.getById, { userId: alert.userId });

    await resend.emails.send({
      from: "alerts@givecare.app",
      to: process.env.CRISIS_ALERT_EMAIL,
      subject: `🚨 Crisis Alert - ${alert.severity}`,
      html: `
        <h2>Crisis Event Detected</h2>
        <p><strong>User:</strong> ${user.name || user.phone}</p>
        <p><strong>Time:</strong> ${new Date(alert._creationTime).toISOString()}</p>
        <p><a href="https://admin.givecare.app/crisis">View Dashboard →</a></p>
      `,
    });

    await ctx.runMutation(internal.alerts.markProcessed, { alertId });
  },
});
```

**Trigger from inbound.ts**:
```typescript
if (crisisDetected) {
  const alertId = await ctx.runMutation(internal.alerts.create, {
    userId,
    type: "crisis",
    severity: "high",
    context: { messageText: message.text },
    message: "Crisis keywords detected",
    channel: "email",
  });

  // Schedule email (internal action, safe for scheduler)
  await ctx.scheduler.runAfter(0, internal.actions.alerts.sendCrisisAlert, { alertId });
}
```

**Pros**:
- ✅ Simple (1 action, uses existing Resend integration)
- ✅ Reliable (email delivery SLA >99.9%)
- ✅ Low cost ($0.10 per 1000 emails)
- ✅ Easy to test (send test email)

**Cons**:
- ❌ Email delays (30s-5min delivery)
- ❌ Noise: email fatigue if 10+ alerts/day
- ❌ No acknowledgment tracking (did human see it?)

**Cost**: 20 hours + $0.10/1000 emails
**Risk**: Low
**Dependencies**: Resend API key (`RESEND_API_KEY`)

---

#### Option B: PagerDuty Integration (2 weeks)

**Approach**: Route critical alerts through PagerDuty for on-call escalation

**Implementation**:
```typescript
// convex/actions/alerts.ts
import { PagerDuty } from "@pagerduty/pdjs";

export const sendPagerDutyAlert = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.getById, { alertId });

    // Trigger PagerDuty incident
    await pd.incidents.create({
      type: "incident",
      title: `GiveCare Crisis Alert: ${alert.severity}`,
      service: { id: process.env.PAGERDUTY_SERVICE_ID, type: "service_reference" },
      urgency: alert.severity === "critical" ? "high" : "low",
      body: {
        type: "incident_body",
        details: JSON.stringify(alert.context),
      },
    });
  },
});
```

**Escalation Policy**:
```
1. SMS to on-call engineer (0 min)
2. Phone call if not ack'd (5 min)
3. Escalate to manager (15 min)
4. Page entire team (30 min)
```

**Pros**:
- ✅ Guaranteed human acknowledgment
- ✅ Escalation path (if primary responder unavailable)
- ✅ Incident tracking (resolution time, post-mortems)
- ✅ Mobile app (push notifications)

**Cons**:
- ❌ Cost: $19/user/month (minimum 5 users = $95/month)
- ❌ Over-engineering for solo developer / small team
- ❌ Alert fatigue if not properly tuned

**Cost**: 80 hours + $95/month
**Risk**: Medium (cost, configuration complexity)
**Dependencies**: PagerDuty account, on-call schedule

---

#### Option C: Custom Slack Bot (1.5 weeks)

**Approach**: Post alerts to Slack channel with action buttons

**Implementation**:
```typescript
// convex/actions/alerts.ts
import { WebClient } from "@slack/web-api";

export const sendSlackAlert = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.getById, { alertId });

    await slack.chat.postMessage({
      channel: "#crisis-alerts",
      text: `🚨 Crisis Alert: ${alert.severity}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🚨 Crisis Event Detected" },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Severity:* ${alert.severity}\n*User:* ${alert.userId}` },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Dashboard" },
              url: `https://admin.givecare.app/crisis`,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Acknowledge" },
              action_id: "ack_alert",
              value: alertId,
            },
          ],
        },
      ],
    });
  },
});
```

**Pros**:
- ✅ Real-time (sub-second delivery)
- ✅ Interactive (acknowledge buttons, threads)
- ✅ Free (Slack already used for team comms)
- ✅ Context-rich (can post full trace data)

**Cons**:
- ❌ No guaranteed delivery (Slack outages)
- ❌ Noise: alerts mixed with team chat
- ❌ No formal escalation policy

**Cost**: 60 hours + $0/month
**Risk**: Low
**Dependencies**: Slack workspace, bot token

---

#### Comparison Matrix

| Criteria | Email (Option A) | PagerDuty (Option B) | Slack (Option C) |
|----------|-----------------|---------------------|------------------|
| **Delivery Time** | 30s-5min | Instant | Instant |
| **Acknowledgment** | ❌ None | ✅ Required | ⚠️ Optional |
| **Escalation** | ❌ Manual | ✅ Automated | ❌ Manual |
| **Cost** | $0.10/1000 | $95/month | Free |
| **Reliability** | 99.9% | 99.99% | 99.5% |
| **Setup Time** | 1 week | 2 weeks | 1.5 weeks |
| **Best For** | Solo dev | Team with on-call | Small team (<10) |

---

#### Recommended Path: **Option A (Email) → Option C (Slack) → Option B (PagerDuty)**

**Phased Rollout**:

**Phase 1 (Week 1)**: Email alerts
- Implement Option A (crisis events only)
- Set threshold: only alert if severity = "critical"
- Monitor false positive rate

**Phase 2 (Week 4)**: Add Slack integration
- Implement Option C for non-critical alerts
- Routing:
  - Critical → Email + Slack
  - High → Slack only
  - Medium/Low → Dashboard only (no alert)

**Phase 3 (Month 3)**: Evaluate PagerDuty need
- If team grows >5 people → implement Option B
- If solo/small team → stay with Email + Slack

**Success Criteria**:
- ✅ <5% false positive rate (alerts that don't need human action)
- ✅ <10min mean time to acknowledge (MTTA)
- ✅ 100% critical alerts acknowledged within 30min

---

### Gap 1C: No Cost Tracking

**Context**: Token usage data not captured. Unknown $ spend per day.

**Current State**:
- ✅ Models configured in `lib/models.ts` (Gemini, GPT-5 mini)
- ❌ No `llm_usage` table in schema
- ❌ No middleware tracking token counts

#### Solution: Usage Tracking Middleware + Cost Dashboard

**Implementation** (covered in detail in remediation-plan.md Section 4):

1. Add `llm_usage` table to schema (see Prerequisites section)
2. Implement `usageTrackingMiddleware`
3. Wrap language models in agents.ts
4. Wire to admin dashboard (`/system` page)

**Estimated Cost**: 40 hours (1 week)
**Risk**: Low (read-only tracking)
**Recommended**: Implement in Week 2 (after core metrics)

---

## Domain 2: Evaluation & Quality Metrics

### Current State Analysis

**What EXISTS**:
- ✅ Simulation tests (3,578 LOC) - verify ARCHITECTURE.md compliance
- ✅ P1-P6 principles embedded in prompts
- ✅ Property-based testing (chaos tests)

**What's MISSING**:
- ❌ No systematic benchmarks (success rate, accuracy)
- ❌ No LLM-as-judge evaluation
- ❌ No A/B testing infrastructure
- ❌ No baseline metrics (can't answer "are we improving?")

**Current Impact**:
- Can't measure agent quality objectively
- Prompt changes are blind experiments (no before/after comparison)
- Unknown: crisis detection accuracy, P1-P6 compliance rate

---

### Gap 2A: No Evaluation Benchmarks

**Context**: Need automated quality scoring for agent outputs.

#### Option A: LLM-as-Judge with Fixed Test Suite (2 weeks)

**Approach**: Use GPT-4 to score agent responses against P1-P6 principles

**Test Suite** (10 scenarios):
```typescript
// tests/evaluation/p1-compliance.test.ts
const scenarios = [
  {
    id: "p1-acknowledge-exhaustion",
    userMessage: "I'm so exhausted",
    expectedBehaviors: [
      "Acknowledges feeling ('I hear how tired you are')",
      "Validates emotion before offering solution",
      "Advances conversation with concrete offer",
    ],
  },
  {
    id: "p2-no-repeat-questions",
    conversationHistory: [
      { role: "agent", text: "What's your mom's name?" },
      { role: "user", text: "Sarah" },
      { role: "user", text: "I need help with doctor appointments" },
    ],
    userMessage: "Can you help me?",
    violations: [
      "Must NOT ask for mom's name again",
    ],
  },
  // ... 8 more scenarios
];
```

**Evaluator**:
```typescript
// convex/actions/evaluations.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const evaluateP1Compliance = action({
  args: { runId: v.id("agent_runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.runQuery(internal.evaluations.getRunById, { runId });

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        acknowledgedFeelings: z.boolean(),
        answeredQuestion: z.boolean(),
        advancedConversation: z.boolean(),
        score: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
      prompt: `Evaluate if this agent response follows P1 (Acknowledge → Answer → Advance):

User: ${run.userMessage}
Agent: ${run.response}

Score 0-1 (1 = perfect P1 compliance)`,
    });

    await ctx.runMutation(internal.evaluations.storeResult, {
      runId,
      evaluator: "p1_compliance",
      score: object.score,
      reasoning: object.reasoning,
      passed: object.score >= 0.8,
    });

    return object;
  },
});
```

**Pros**:
- ✅ Automated (run in CI/CD)
- ✅ Objective scoring (LLM reduces human bias)
- ✅ Explains reasoning (debugging aid)
- ✅ Can track trends over time

**Cons**:
- ❌ LLM-as-judge has own biases (GPT-4 prefers GPT-4 style responses)
- ❌ Cost: $0.01 per evaluation (100 evals = $1)
- ❌ Fixed test suite (doesn't catch edge cases)

**Cost**: 80 hours + $10/month in eval costs
**Risk**: Low
**Dependencies**: GPT-4 API access

---

#### Option B: Human-in-Loop Evaluation (3 weeks)

**Approach**: Build UI for humans to rate agent responses

**Admin Dashboard Page** (`/quality`):
```typescript
// give-care-admin/src/routes/quality.tsx
export default function QualityEvaluationPage() {
  const pendingEvals = useQuery(api.evaluations.getPendingEvaluations, { limit: 10 });
  const submitRating = useMutation(api.evaluations.submitRating);

  return (
    <div>
      {pendingEvals?.map(eval => (
        <Card key={eval._id}>
          <CardHeader>
            <p><strong>User:</strong> {eval.userMessage}</p>
            <p><strong>Agent:</strong> {eval.response}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {["empathy", "relevance", "completeness", "personalization"].map(dim => (
                <div key={dim}>
                  <Label>{dim}</Label>
                  <StarRating
                    value={ratings[dim]}
                    onChange={(val) => setRatings({ ...ratings, [dim]: val })}
                  />
                </div>
              ))}
            </div>
            <Textarea placeholder="Feedback..." onChange={e => setFeedback(e.target.value)} />
            <Button onClick={() => submitRating({ evalId: eval._id, ratings, feedback })}>
              Submit Rating
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Sampling Strategy**:
- 10% of production conversations (random sample)
- 100% of crisis events (critical for safety)
- All conversations flagged by guardrails

**Pros**:
- ✅ Gold standard (human judgment)
- ✅ Catches nuanced issues (empathy, tone)
- ✅ Builds training dataset for RLHF

**Cons**:
- ❌ Slow (1 human can eval ~50 conversations/hour)
- ❌ Expensive ($20/hour * 2 hours/week = $160/month)
- ❌ Inter-rater reliability (2 humans may disagree)

**Cost**: 120 hours + $160/month labor
**Risk**: Medium (requires trained evaluators)
**Dependencies**: Admin dashboard, evaluator training

---

#### Option C: Hybrid (LLM + Human Spot-Check) (2.5 weeks)

**Approach**: LLM evaluates 100%, humans review 10% for calibration

**Workflow**:
```
Every agent response
    ↓
LLM-as-judge scores (0-1)
    ├─ Score ≥0.8 → Pass (no human review)
    ├─ Score 0.6-0.8 → Queue for human review (10% sample)
    └─ Score <0.6 → Flag for immediate human review (100%)
```

**Calibration Loop**:
- Humans review 10% of LLM evaluations
- Compare human score vs LLM score
- If disagreement >0.2, update LLM prompt
- Re-run evaluation on historical data

**Pros**:
- ✅ Best of both worlds (speed + quality)
- ✅ Scales to high volume (90% automated)
- ✅ Continuous improvement (calibration loop)

**Cons**:
- ⚠️ Complex (2 systems to maintain)
- ⚠️ Still needs human labor (10% review)

**Cost**: 100 hours + $16/month labor + $10/month LLM
**Risk**: Medium (complexity)
**Dependencies**: Options A + B

---

#### Comparison Matrix

| Criteria | LLM-Judge (A) | Human (B) | Hybrid (C) |
|----------|--------------|-----------|------------|
| **Coverage** | 100% | 10% | 100% |
| **Accuracy** | 70-80% | 95%+ | 85-90% |
| **Latency** | Real-time | Days | Real-time |
| **Cost/Month** | $10 | $160 | $26 |
| **Setup Time** | 2 weeks | 3 weeks | 2.5 weeks |
| **Best For** | Early stage | High-stakes | Scale |

---

#### Recommended Path: **Option A (LLM-Judge) → Option C (Hybrid)**

**Phased Rollout**:

**Phase 1 (Week 3)**: LLM-as-Judge MVP
- Implement P1, P2, SMS-constraint evaluators
- Run on last 7 days of production traffic
- Establish baseline scores

**Phase 2 (Week 5)**: Add Human Review
- Build admin UI for human ratings
- Sample 10% of conversations
- Measure inter-rater agreement

**Phase 3 (Week 7)**: Hybrid System
- Route low-confidence LLM scores to human queue
- Implement calibration loop
- Track improvement trends

**Success Criteria**:
- ✅ P1 compliance >90%
- ✅ SMS constraint compliance >95%
- ✅ Human-LLM agreement >85%

---

### Gap 2B: No Prompt Versioning System

**Context**: Prompts hardcoded in `lib/prompts.ts`. Can't A/B test safely.

(Implementation covered in remediation-plan.md Section 5 - Prompt Versioning)

**Options**:
- **A**: Database-backed prompts (store in `prompt_versions` table)
- **B**: Git-based versioning (prompts as files, semantic versioning)
- **C**: Feature flags (LaunchDarkly for gradual rollout)

**Recommended**: Option A (database) for dynamic A/B testing

**Cost**: 60 hours (1.5 weeks)
**Risk**: Low
**Dependencies**: Add `prompt_versions` table to schema

---

## Domain 3: Safety & Human Oversight

### Current State Analysis

**What EXISTS**:
- ✅ Crisis detection (19 keywords, `detectCrisis()` function)
- ✅ `alerts` table (status: pending/processed)
- ✅ `guardrail_events` table (crisis, dv_hint, false_positive)
- ✅ Admin crisis page (`/crisis`) with 7-stage follow-up protocol

**What's MISSING**:
- ❌ No human escalation workflow (automated 988 response only)
- ❌ No output filtering (PII, toxicity, bias)
- ❌ No human-in-loop for edge cases
- ❌ No red team testing documented

**Current Impact**:
- Crisis events logged but no human responder notified
- Unknown: false positive rate, missed crisis events
- No procedure for taking over a conversation

---

### Gap 3A: No Human Escalation for Crisis

**Context**: Crisis detected → auto-send 988 message. No human oversight.

#### Option A: Email Alert + Manual Takeover (1 week)

**Approach**: Send email when crisis detected, admin manually responds

**Implementation**:
```typescript
// Already covered in Gap 1B (Option A)
// convex/actions/alerts.ts - sendCrisisAlert
```

**Manual Takeover Process**:
1. Admin receives email alert
2. Opens `/crisis` dashboard
3. Reviews conversation history
4. Clicks "Take Over Conversation" button
5. Sends manual SMS via Twilio (bypasses agent)

**Pros**:
- ✅ Simple (email + manual SMS)
- ✅ Full human control (admin decides what to send)
- ✅ Low cost (no additional infrastructure)

**Cons**:
- ❌ Slow (5-30min response time)
- ❌ Requires 24/7 on-call (or accept delays)
- ❌ No handoff protocol (what if admin unavailable?)

**Cost**: 40 hours (email alert + takeover UI)
**Risk**: Low
**Dependencies**: Email alerts (Gap 1B)

---

#### Option B: 7-Stage Crisis Protocol Automation (2 weeks)

**Approach**: Multi-stage follow-up with escalation timers

**Protocol** (already designed in admin UI):
```
Stage 1 (0 min):   Send 988 Lifeline message (automated)
Stage 2 (1 hour):  Send check-in: "Are you safe right now?" (automated)
Stage 3 (4 hours): Escalate to human responder (email alert)
Stage 4 (8 hours): SMS to emergency contact (if on file)
Stage 5 (12 hours): Call user (if phone on file)
Stage 6 (24 hours): Escalate to clinical supervisor
Stage 7 (48 hours): Close case (document outcome)
```

**Implementation**:
```typescript
// convex/workflows.ts - add crisis follow-up workflow
export const crisisFollowUpWorkflow = internalMutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);

    // Schedule stage 2 (1 hour)
    await ctx.scheduler.runAfter(
      3600000, // 1 hour
      internal.workflows.crisisStage2,
      { alertId }
    );
  },
});

export const crisisStage2 = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.getById, { alertId });

    // Check if user responded in last hour
    const recentMessages = await ctx.runQuery(internal.messages.getRecent, {
      userId: alert.userId,
      since: Date.now() - 3600000,
    });

    if (recentMessages.length === 0) {
      // No response - send check-in
      await ctx.runMutation(internal.sms.send, {
        to: alert.userId,
        message: "Are you safe right now? Reply YES or NO",
      });

      // Schedule stage 3 (4 hours total)
      await ctx.scheduler.runAfter(
        10800000, // 3 more hours
        internal.workflows.crisisStage3,
        { alertId }
      );
    }
  },
});
```

**Pros**:
- ✅ Structured escalation (no missed follow-ups)
- ✅ Automated early stages (reduces human load)
- ✅ Clear handoff points (when to involve humans)

**Cons**:
- ❌ Complex state machine (7 stages * failure paths)
- ❌ Requires emergency contact data (not all users have)
- ❌ Legal risk: auto-calling 911 without consent?

**Cost**: 80 hours (2 weeks)
**Risk**: High (legal, ethical)
**Dependencies**: Twilio voice API, legal review

---

#### Option C: Partner with Crisis Text Line (3 weeks)

**Approach**: Handoff to trained crisis counselors

**Integration**:
```typescript
// When crisis detected, create ticket in Crisis Text Line system
export const escalateToCTL = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.getById, { alertId });
    const user = await ctx.runQuery(internal.users.getById, { userId: alert.userId });

    // Create CTL ticket via API
    await fetch("https://api.crisistextline.org/v1/tickets", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CTL_API_KEY}` },
      body: JSON.stringify({
        phone: user.phone,
        conversationHistory: alert.context.messages,
        severity: alert.severity,
      }),
    });

    // Send user: "Connecting you to a trained counselor..."
    await ctx.runMutation(internal.sms.send, {
      to: user.phone,
      message: "I'm connecting you to a trained crisis counselor. They'll text you shortly.",
    });
  },
});
```

**Pros**:
- ✅ Gold standard (trained crisis counselors)
- ✅ 24/7 coverage (CTL has 24/7 responders)
- ✅ Legal protection (CTL handles liability)
- ✅ No on-call burden (outsourced)

**Cons**:
- ❌ Cost: $5-10 per escalation (estimated)
- ❌ Partnership required (contracts, legal agreements)
- ❌ Loss of user relationship (handed off to external org)
- ❌ Data sharing concerns (HIPAA compliance?)

**Cost**: 120 hours + $5-10/escalation + partnership overhead
**Risk**: High (legal, cost, partnerships)
**Dependencies**: Crisis Text Line partnership, legal review

---

#### Comparison Matrix

| Criteria | Manual (A) | 7-Stage (B) | CTL Partner (C) |
|----------|-----------|-------------|-----------------|
| **Response Time** | 5-30min | 1-12 hours | 5-15min |
| **Human Skill** | Admin (untrained) | Staged | Crisis counselor |
| **24/7 Coverage** | ❌ No | ⚠️ Partial | ✅ Yes |
| **Cost/Incident** | $0 | $0 | $5-10 |
| **Legal Risk** | High | Medium | Low |
| **Setup Time** | 1 week | 2 weeks | 3 weeks |

---

#### Recommended Path: **Option A (Manual) → Option B (7-Stage) → Consider C**

**Phased Rollout**:

**Phase 1 (Week 1)**: Manual takeover
- Implement email alerts (Gap 1B)
- Build "Take Over Conversation" UI
- Document manual response protocol
- Assign on-call admin (business hours only)

**Phase 2 (Week 3)**: Automate early stages
- Implement stages 1-2 (auto 988 + 1-hour check-in)
- Human escalation at stage 3 (4 hours)
- Track false positive rate

**Phase 3 (Month 3)**: Evaluate CTL partnership
- If crisis volume >10/week → explore CTL partnership
- If <10/week → stay with 7-stage automation

**Success Criteria**:
- ✅ 100% crisis events reviewed by human within 4 hours
- ✅ <10% false positives (users who weren't actually in crisis)
- ✅ Documented resolution for every crisis event

---

### Gap 3B: No Output Filtering (PII, Toxicity)

**Implementation**: Covered in remediation-plan.md Section 4 (Guardrails Middleware)

**Options**:
- **A**: Regex-based PII redaction (SSN, phone, email)
- **B**: NLP-based PII detection (spaCy, Presidio)
- **C**: AI SDK middleware for streaming redaction

**Recommended**: Option C (middleware) for real-time filtering

**Cost**: 40 hours (1 week)
**Risk**: Low

---

## Domain 4: Agent Architecture

### Current State Analysis

**What EXISTS**:
- ✅ 3-agent system (Main, Assessment, Crisis router)
- ✅ 8 structured tools with Zod schemas
- ✅ Event-driven via Convex Agent Component

**What's MISSING**:
- ❌ No ReAct/Plan-and-Execute patterns
- ❌ No collaborative agent patterns
- ❌ No chain-of-thought reasoning traces

**Current Impact**:
- Black box debugging (can't see "why" agent chose a tool)
- No multi-step planning (each tool call is reactive)
- Can't improve agent logic (no reasoning to analyze)

---

### Gap 4A: No Chain-of-Thought (CoT) Reasoning

**Context**: Agents call tools directly without explaining reasoning.

#### Option A: Prompt Engineering (CoT Instructions) (1 week)

**Approach**: Add explicit CoT instructions to system prompts

**Modified Prompt**:
```typescript
// convex/lib/prompts.ts
export const MAIN_PROMPT = `You are GiveCare Main Agent...

${TRAUMA_PRINCIPLES}

## Reasoning Protocol

Before calling any tool, think step-by-step:
1. **What is the user asking for?** (Identify intent)
2. **What information do I need?** (Required context)
3. **Which tool will help?** (Tool selection)
4. **Why is this the best approach?** (Justification)

THEN call the tool.

Example:
User: "I need a break"

<thinking>
1. User is expressing burnout/need for respite
2. Need: zip code for local resource search
3. Tool: searchResources (if zip known) OR updateProfile (if zip unknown)
4. Best approach: Check if zip is in profile first
</thinking>

<tool_call>
{
  "name": "checkProfile",
  "args": { "userId": "..." }
}
</tool_call>
`;
```

**Pros**:
- ✅ Simple (prompt change only, no code)
- ✅ Works with any LLM
- ✅ Visible in logs (`agent_runs.toolCalls` metadata)

**Cons**:
- ❌ LLM may ignore instructions (not enforced)
- ❌ Adds latency (~200 tokens extra output)
- ❌ No structured output (thinking is free text)

**Cost**: 20 hours (update prompts + test)
**Risk**: Low
**Dependencies**: None

---

#### Option B: Structured Reasoning with JSON Mode (2 weeks)

**Approach**: Enforce CoT via JSON schema

**Implementation**:
```typescript
// convex/actions/agents.ts
import { generateObject } from "ai";

export const runMainAgentWithReasoning = action({
  args: { userId: v.id("users"), message: v.string() },
  handler: async (ctx, { userId, message }) => {
    // Step 1: Generate reasoning
    const { object: reasoning } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        userIntent: z.string().describe("What is the user asking for?"),
        requiredInfo: z.array(z.string()).describe("What info do I need?"),
        toolChoice: z.string().describe("Which tool to use?"),
        justification: z.string().describe("Why this tool?"),
      }),
      prompt: `User message: "${message}"\n\nReason step-by-step:`,
    });

    // Step 2: Execute tool based on reasoning
    const toolName = reasoning.toolChoice;
    const toolResult = await executeTool(ctx, toolName, { userId, message });

    // Step 3: Generate final response
    const response = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        User: ${message}
        Your reasoning: ${JSON.stringify(reasoning)}
        Tool result: ${toolResult}

        Generate empathetic response following P1-P6.
      `,
    });

    // Log reasoning for analysis
    await ctx.runMutation(internal.agentRuns.create, {
      userId,
      agentName: "main",
      userMessage: message,
      reasoning, // Structured!
      toolCalls: [{ name: toolName, result: toolResult }],
      response: response.text,
    });

    return response.text;
  },
});
```

**Pros**:
- ✅ Structured (queryable reasoning)
- ✅ Enforceable (LLM must output JSON)
- ✅ Analyzable (can detect patterns like "why did agent choose X?")

**Cons**:
- ❌ 2x LLM calls (reasoning + response = 2x latency)
- ❌ 2x cost (reasoning is ~100 tokens, response ~150)
- ❌ More complex code (error handling for JSON parsing)

**Cost**: 80 hours + 2x LLM costs
**Risk**: Medium (latency, cost)
**Dependencies**: None

---

#### Option C: AI SDK onStepFinish Callback (1 week)

**Approach**: Use AI SDK middleware to capture reasoning automatically

**Implementation**:
```typescript
// convex/agents.ts
import { Agent } from "@convex-dev/agent";

export const mainAgent = new Agent(components.agent, {
  name: "Main Agent",
  languageModel: MAIN_MODEL,
  instructions: MAIN_PROMPT,
  tools: { /* ... */ },
  onStepFinish: async (step) => {
    // AI SDK provides reasoning in step.text
    console.log("Step reasoning:", {
      stepNumber: step.stepNumber,
      reasoning: step.text, // LLM's thoughts before tool call
      toolCalls: step.toolCalls,
      finishReason: step.finishReason,
    });

    // Store in agent_runs metadata
    await ctx.runMutation(internal.agentRuns.appendReasoning, {
      runId: currentRunId,
      step: {
        number: step.stepNumber,
        reasoning: step.text,
        tools: step.toolCalls,
      },
    });
  },
});
```

**Pros**:
- ✅ No extra LLM calls (same latency/cost)
- ✅ Works with existing agent code (minimal changes)
- ✅ AI SDK handles JSON parsing

**Cons**:
- ❌ Reasoning quality varies (LLM may not always explain)
- ❌ Convex Agent Component may not expose `onStepFinish` (need to verify)

**Cost**: 40 hours
**Risk**: Low (if Convex supports callback)
**Dependencies**: Verify Convex Agent Component API

---

#### Recommended Path: **Option A (Prompt) → Option C (Callback)**

**Rationale**: Start simple, upgrade if needed

**Phase 1 (Week 4)**: Add CoT instructions to prompts
- Test if Gemini/GPT-5 mini follow instructions
- Measure reasoning quality (human review of 20 samples)

**Phase 2 (Week 6)**: Implement callback (if supported)
- Structured logging
- Wire to trace viewer (`/traces` dashboard)

**Skip Option B**: Too complex, 2x cost not justified for MVP

---

## Domain 5: Prompt Engineering

### Current State Analysis

**What EXISTS**:
- ✅ P1-P6 principles embedded in all prompts
- ✅ System prompts in `lib/prompts.ts` (100+ lines)
- ✅ Template rendering with variable substitution

**What's MISSING**:
- ❌ No few-shot examples
- ❌ No structured output enforcement
- ❌ No prompt versioning (covered in Gap 2B)

---

### Gap 5A: No Few-Shot Examples in Prompts

**Context**: Prompts are instruction-only. No examples of ideal behavior.

#### Solution: Add 5 Examples per Principle

**Implementation**:
```typescript
// convex/lib/prompts.ts
export const MAIN_PROMPT = `You are GiveCare Main Agent...

${TRAUMA_PRINCIPLES}

## Example Conversations

### P1 Example: Acknowledge → Answer → Advance
User: "I'm so exhausted"
Agent: "I hear how tired you are. Caregiving is really draining. Want to try a 2-min breathing exercise?"
✓ Acknowledged feeling ("I hear")
✓ Answered implicit question ("what can help?")
✓ Advanced with concrete offer

### P2 Example: Never Repeat Questions
[Earlier in conversation]
User: "My mom's name is Sarah"
[Later in same conversation]
User: "She's agitated again"
Agent: "I remember Sarah gets agitated around 6pm. Is it that time? The calming music helped last week."
✓ Did NOT ask "what's your mom's name?" again
✓ Referenced memory ("I remember")

### P3 Example: Respect Boundaries (2 attempts max)
Agent: "What's your zip code for local resources?"
User: "skip"
Agent: "No problem. We can find resources anytime. What would help most right now?"
✓ Accepted "skip" gracefully
✓ Didn't push (only 1 attempt)

### P4 Example: Soft Confirmations
Agent: "Got it: Sarah, right?"
User: "yes"
Agent: "Thanks for confirming!"
✓ Asked for confirmation ("right?")
✓ Not assumption ("Your mom is Sarah")

### P5 Example: Skip Always Available
Agent: "Quick burnout check: Rate your stress 0-10?"
User: "skip"
Agent: "Totally fine. Whenever you're ready. Want to find some respite care instead?"
✓ Offered skip option (implicit)
✓ Provided alternative value

### P6 Example: Deliver Value Every Turn
User: "I don't know"
Agent: "That's okay. Here's a quick tip: Even 5 minutes outside can help. Want me to send you a reminder later?"
✓ Validated uncertainty
✓ Delivered value (tip)
✓ Advanced (offered action)

`;
```

**Benefits**:
- ✅ Reduces ambiguity (show, don't tell)
- ✅ Faster for LLM to learn (examples > instructions)
- ✅ Easier to test (can verify examples in eval suite)

**Cost**: 20 hours (write examples + test)
**Risk**: Low
**Dependencies**: None

**Recommended**: Implement in Week 3 (before prompt versioning)

---

## Domain 6: Caching & Performance

### Gap 6A: No LLM Response Caching

**Context**: Many repeated user queries ("I need a break", "I'm tired")

#### Solution: Hash-Based Caching (1 week)

**Implementation** (covered in remediation-plan.md Section 6):

**Schema**:
```typescript
agent_response_cache: defineTable({
  inputHash: v.string(), // SHA256 of (agent + message + contextHash)
  agent: v.string(),
  response: v.string(),
  toolCalls: v.optional(v.array(v.any())),
  expiresAt: v.number(), // 5min TTL
  hitCount: v.number(),
}).index("by_hash_agent", ["inputHash", "agent"]),
```

**Benefits**:
- ✅ 50% cost reduction (if 50% cache hit rate)
- ✅ 80% latency reduction (cached = 10ms vs 1000ms)
- ✅ Simple (hash → lookup → return)

**Tradeoffs**:
- ⚠️ Cache invalidation complexity (when to clear?)
- ⚠️ Staleness risk (5min TTL may return outdated info)
- ⚠️ Memory usage (1000 cached responses = ~500KB)

**Cost**: 40 hours
**Risk**: Low
**Dependencies**: None

**Recommended**: Implement in Week 5 (after core monitoring)

---

## Implementation Roadmap

### Week 1-2: Critical Infrastructure (Production Blockers)

**Must-Have**:
1. ✅ Core metrics queries (Gap 1A - Option A)
2. ✅ Email crisis alerts (Gap 1B - Option A)
3. ✅ Manual takeover UI (Gap 3A - Option A)
4. ✅ Admin dashboard wiring (connect UI to queries)

**Deliverables**:
- Functional metrics dashboard (`/`, `/system` pages)
- Email alerts for crisis events
- Admin can review & respond to crises

**Success Criteria**:
- Dashboard loads in <500ms
- 100% crisis events generate email within 60s
- Zero production outages from monitoring implementation

---

### Week 3-4: Quality & Reliability (High Priority)

**Must-Have**:
1. ✅ Few-shot examples in prompts (Gap 5A)
2. ✅ LLM-as-judge evaluation (Gap 2A - Option A)
3. ✅ Guardrails middleware (PII redaction, crisis filtering)
4. ✅ Cost tracking middleware (Gap 1C)

**Optional**:
- Prompt versioning system (Gap 2B)
- CoT instructions in prompts (Gap 4A - Option A)

**Deliverables**:
- Updated prompts with 5 examples per principle
- Automated P1-P6 compliance scoring
- Token usage → $ tracking in dashboard

**Success Criteria**:
- P1 compliance >90% (via LLM-as-judge)
- SMS constraint compliance >95%
- Cost tracking accurate within ±10%

---

### Week 5-8: Optimization & Scale (Medium Priority)

**Must-Have**:
1. ✅ Pre-aggregated metrics (Gap 1A - Option B)
2. ✅ Response caching (Gap 6A)
3. ✅ 7-stage crisis protocol (Gap 3A - Option B)

**Optional**:
- Slack alerts (Gap 1B - Option C)
- Human evaluation UI (Gap 2A - Option B)
- Intervention RAG (Gap 7A)

**Deliverables**:
- 30-day historical trend charts
- Automated crisis follow-up workflow
- 50% cache hit rate (50% cost reduction)

**Success Criteria**:
- Dashboard queries <100ms (pre-aggregation)
- 50% of LLM calls served from cache
- 100% crisis events followed up within 48 hours

---

### Month 3+: Advanced Features (Backlog)

**Explore**:
- Grafana Cloud integration (if team >5 people)
- PagerDuty (if on-call rotation needed)
- Crisis Text Line partnership (if volume >10/week)
- NeMo Guardrails (formalize P1-P6 as Colang)

**Evaluate**:
- Model fine-tuning (if >1000 labeled conversations)
- RLHF pipeline (if user feedback collection >500 ratings)
- Knowledge graphs (if relationship modeling needed)

---

## Decision Trees

### When to Add Alerting?

```
Crisis volume <5/week
    → Email only (Gap 1B - Option A)

Crisis volume 5-20/week
    → Email + Slack (Gap 1B - Option C)

Crisis volume >20/week OR Team >5 people
    → PagerDuty (Gap 1B - Option B)
```

### When to Upgrade Metrics?

```
Traffic <1k messages/day
    → Minimal queries (Gap 1A - Option A)

Traffic 1k-10k messages/day
    → Pre-aggregation (Gap 1A - Option B)

Traffic >10k messages/day
    → Grafana Cloud (Gap 1A - Option C)
```

### When to Partner with CTL?

```
Crisis volume <10/week
    → 7-stage automation (Gap 3A - Option B)

Crisis volume 10-50/week
    → Evaluate CTL partnership

Crisis volume >50/week
    → CTL partnership required (Gap 3A - Option C)
```

---

## Risk Assessment Matrix

| Gap | Impact (1-5) | Likelihood (1-5) | Risk Score | Mitigation |
|-----|--------------|------------------|------------|------------|
| No monitoring (1A) | 5 (blind prod) | 5 (happening now) | 25 (critical) | Implement Week 1 |
| No crisis escalation (3A) | 5 (legal/ethical) | 3 (rare but severe) | 15 (high) | Email alerts Week 1 |
| No evaluation (2A) | 4 (can't improve) | 4 (already affecting quality) | 16 (high) | LLM-judge Week 3 |
| No cost tracking (1C) | 3 (budget overrun) | 4 (likely happening) | 12 (medium) | Middleware Week 2 |
| No caching (6A) | 2 (higher cost) | 5 (every request) | 10 (medium) | Implement Week 5 |
| No few-shot examples (5A) | 3 (brittle prompts) | 3 (occasional failures) | 9 (medium) | Update Week 3 |
| No CoT reasoning (4A) | 2 (hard to debug) | 4 (common issue) | 8 (low) | Prompt instructions Week 4 |

---

## Cost Summary

### One-Time Implementation Costs

| Priority | Tasks | Hours | Cost @ $100/hr |
|----------|-------|-------|----------------|
| **Critical (Week 1-2)** | Monitoring, alerts, takeover UI | 160 | $16,000 |
| **High (Week 3-4)** | Evaluation, guardrails, examples | 160 | $16,000 |
| **Medium (Week 5-8)** | Pre-agg, caching, 7-stage protocol | 200 | $20,000 |
| **Total (8 weeks)** | | **520 hours** | **$52,000** |

### Recurring Costs (Monthly)

| Service | Cost | When to Use |
|---------|------|-------------|
| Email alerts (Resend) | $0.10/1000 | Always |
| Slack | Free | Always |
| PagerDuty | $95 | Team >5 |
| Grafana Cloud | $100-200 | Traffic >10k/day |
| Crisis Text Line | $5-10/escalation | Volume >10/week |
| Human evaluators | $160 | Ongoing quality assurance |
| LLM-as-judge (GPT-4) | $10 | Automated eval |
| **Total (Minimal)** | **$170** | |
| **Total (Full Stack)** | **$400-600** | |

---

## Anti-Patterns Summary

### What NOT to Do

❌ **Don't** implement all 12 gaps in parallel
- **Why**: Feature bloat, testing nightmare
- **Instead**: Phased rollout (critical → high → medium)

❌ **Don't** build custom time-series database
- **Why**: Convex not optimized for this
- **Instead**: Pre-aggregate or use Grafana

❌ **Don't** add alerting before baseline metrics
- **Why**: Alert fatigue from false positives
- **Instead**: Run monitoring 2 weeks, observe patterns

❌ **Don't** use external LLM for all evaluations
- **Why**: Cost scales linearly with traffic
- **Instead**: Hybrid (LLM + human spot-check)

❌ **Don't** auto-call 911 for crisis
- **Why**: Legal liability, user consent issues
- **Instead**: 7-stage protocol with human escalation

❌ **Don't** cache responses >5min TTL
- **Why**: Stale data (e.g., old resource recommendations)
- **Instead**: 5min TTL, invalidate on user profile update

❌ **Don't** add few-shot examples to EVERY scenario
- **Why**: Prompt bloat (>2000 tokens)
- **Instead**: 5 core examples (P1-P6), trust LLM for edge cases

❌ **Don't** implement prompt versioning without evaluation
- **Why**: Can't measure if new prompt is better
- **Instead**: Evaluation first, versioning second

---

## Success Metrics (8-Week Checkpoint)

### Monitoring & Observability
- ✅ Dashboard shows metrics with <500ms load time
- ✅ 30-day historical trends visible
- ✅ Email alerts for crisis events (<60s latency)
- ✅ Cost tracking accurate within ±10%

### Quality & Evaluation
- ✅ P1-P6 compliance >85% (LLM-as-judge)
- ✅ SMS constraint compliance >95%
- ✅ Crisis detection false positive rate <10%
- ✅ 100 human-evaluated conversations (baseline dataset)

### Safety & Human Oversight
- ✅ 100% crisis events reviewed by human within 4 hours
- ✅ Manual takeover UI functional
- ✅ PII redaction working (SSN, phone, email)
- ✅ Documented crisis resolution workflow

### Performance
- ✅ Cache hit rate >40%
- ✅ P95 latency <2000ms
- ✅ Zero production outages from new features

---

## Appendix: Schema Changes Required

### New Tables Needed

```typescript
// convex/schema.ts - add these tables

// Evaluation system
evaluations: defineTable({
  runId: v.id("agent_runs"),
  evaluator: v.string(),
  score: v.number(),
  reasoning: v.string(),
  passed: v.boolean(),
}).index("by_run", ["runId"]),

evaluation_configs: defineTable({
  name: v.string(),
  description: v.string(),
  prompt: v.string(),
  passingThreshold: v.number(),
  enabled: v.boolean(),
}),

// Prompt versioning
prompt_versions: defineTable({
  agent: v.union(v.literal("main"), v.literal("assessment")),
  version: v.string(),
  content: v.string(),
  active: v.boolean(),
  metadata: v.optional(v.object({
    author: v.string(),
    description: v.string(),
  })),
}).index("by_agent_active", ["agent", "active"]),

// Response caching
agent_response_cache: defineTable({
  inputHash: v.string(),
  agent: v.string(),
  response: v.string(),
  toolCalls: v.optional(v.array(v.any())),
  expiresAt: v.number(),
  hitCount: v.number(),
}).index("by_hash_agent", ["inputHash", "agent"]),

// LLM usage tracking
llm_usage: defineTable({
  agentRunId: v.optional(v.id("agent_runs")),
  model: v.string(),
  usage: v.object({
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
  }),
  cost: v.number(),
  timestamp: v.number(),
}).index("by_timestamp", ["timestamp"]),

// Pre-aggregated metrics
metrics_daily: defineTable({
  date: v.string(),
  agentName: v.string(),
  totalRuns: v.number(),
  avgLatencyMs: v.number(),
  errorCount: v.number(),
  toolUsage: v.any(),
  costUsd: v.number(),
}).index("by_date", ["date"]),
```

---

## Conclusion

This remediation plan provides **multiple pathways** for each of the 12 critical gaps identified in the NCP-AAI audit. Unlike prescriptive solutions, it offers:

- **Context**: Why each gap matters
- **Options**: 2-3 implementation pathways per gap
- **Tradeoffs**: Complexity, cost, risk analysis
- **Recommendations**: Our suggested path with rationale
- **Anti-patterns**: What NOT to do

**Key Takeaways**:

1. **Prioritize ruthlessly**: Critical (monitoring, alerts) → High (quality) → Medium (optimization)
2. **Start simple, upgrade later**: Option A → Option B → Option C
3. **Measure before optimizing**: Baseline metrics → identify patterns → add alerts
4. **Avoid over-engineering**: Right-size for current scale (<1k messages/day)

**8-Week Investment**: 520 hours ($52k) + $170/month recurring
**Maturity Improvement**: 6.5/10 → 8.5/10 (production-ready)

**Next Steps**:
1. Review this plan with team
2. Prioritize based on user feedback / incidents
3. Start Week 1 tasks (monitoring + crisis alerts)
4. Iterate based on metrics from dashboard

---

## Appendix: Domain-by-Domain Status Summary

### Domain 1: Agent Architecture and Design

| Feature | Status | Notes |
|---------|--------|-------|
| **Tool-Use Architecture** | ✅ HAVE | 8 tools with Zod schemas, maxSteps chaining |
| **Multi-Agent System** | ✅ HAVE | 3 agents (Main 95%, Assessment 5%, Crisis deterministic) |
| **Event-Driven Communication** | ✅ HAVE | Convex Agent Component + workflows |
| **ReAct Pattern** | ⏸️ NOT NOW | Prompt-based CoT sufficient for MVP; full ReAct = 2x cost |
| **Collaborative Agents** | ❌ NOT DOING | Single-user sessions; no multi-agent negotiation needed |
| **Swarm Intelligence** | ❌ NOT DOING | Parallel execution not needed for SMS (sequential by nature) |

**Decision**: Keep current 3-agent architecture; add CoT reasoning (prompt-only) in Week 4.

---

### Domain 2: Agent Development

| Feature | Status | Notes |
|---------|--------|-------|
| **Framework Usage** | ✅ HAVE | Convex Agent Component + AI SDK |
| **Tool Integration** | ✅ HAVE | All 8 tools have schemas, error handling, graceful degradation |
| **Prompt Engineering** | ✅ HAVE | P1-P6 embedded, template rendering |
| **State Management** | ✅ HAVE | Threads, sessions, agent_runs tables |
| **Few-Shot Examples** | ✅ DOING (Week 3) | Adding 5 examples per P1-P6 principle |
| **Structured Output** | ⏸️ NOT NOW | SMS constraint via instructions; JSON mode adds complexity |
| **Chain-of-Thought** | ⚠️ PARTIAL (Week 4) | Prompt-level CoT; not enforced JSON |

**Decision**: Add few-shot examples + CoT instructions; skip structured output (not needed for SMS).

---

### Domain 3: Evaluation and Tuning

| Feature | Status | Notes |
|---------|--------|-------|
| **Testing Infrastructure** | ✅ HAVE | 29 test files, 3,578 LOC simulation tests |
| **Debugging Capability** | ✅ HAVE | agent_runs table, trace viewer UI |
| **Systematic Benchmarking** | ✅ DOING (Week 3-4) | LLM-as-judge for P1-P6, crisis accuracy |
| **Evaluation Metrics** | ✅ DOING (Week 3-4) | Success rates, compliance scores |
| **Tuning Infrastructure** | ✅ SHOULD DO (Week 4+) | Prompt versioning for A/B testing |
| **Debugging Tools** | ⏸️ NOT NOW | Trace viewer exists; step-by-step replay = nice-to-have |
| **Few-Shot Curation** | ⏸️ NOT NOW | Manual examples sufficient for 20 scenarios |
| **Fine-Tuning** | 🔮 FUTURE | Need 1000+ labeled examples; defer to Month 6+ |

**Decision**: Implement LLM-as-judge evaluation + prompt versioning; defer fine-tuning until post-launch data.

---

### Domain 4: Deployment and Scaling

| Feature | Status | Notes |
|---------|--------|-------|
| **Serverless Architecture** | ✅ HAVE | Convex auto-scaling |
| **Infrastructure** | ✅ HAVE | Vector DB, message queue, logging tables |
| **Horizontal Scaling** | ✅ N/A | Convex handles; no config needed |
| **Caching Layer** | ✅ DOING (Week 5) | LLM response caching (5min TTL) |
| **Batching** | ❌ NOT DOING | SMS is sequential (1 message at a time); no batching benefit |
| **Observability** | ✅ DOING (Week 1-2) | Metrics dashboard + alerts |
| **API Gateway** | ⏸️ NOT NOW | Direct Twilio webhook works; add Kong if traffic >10k/day |
| **Multi-Region** | ❌ NOT DOING | US-only for MVP; Convex doesn't support multi-region yet |

**Decision**: Add caching + observability; skip batching (not applicable) and multi-region (not supported).

---

### Domain 5: Cognition, Planning, and Memory

| Feature | Status | Notes |
|---------|--------|-------|
| **Memory System** | ✅ HAVE | 5 categories, importance scoring, vector embeddings |
| **Decision Making** | ✅ HAVE | Hybrid rule-based (crisis) + learning-based (LLM) |
| **CoT Reasoning** | ⚠️ PARTIAL (Week 4) | Prompt-level instructions; not enforced |
| **Tree-of-Thought** | ❌ NOT DOING | Over-engineering for SMS use case (no complex multi-step planning) |
| **Self-Consistency** | ❌ NOT DOING | Cost (3x LLM calls) not justified for MVP |
| **Hierarchical Planning** | ⏸️ NOT NOW | Current workflows sufficient; revisit if tasks become multi-day |
| **Memory Retrieval** | ⏸️ NOT NOW | Agent Component handles vector search; explicit fetch = added complexity |
| **Procedural Memory** | 🔮 FUTURE | Learn intervention sequences from events table (Month 6+) |

**Decision**: Keep current memory system; add CoT (prompt-only); skip advanced reasoning (not needed).

---

### Domain 6: Knowledge Integration and Data Handling

| Feature | Status | Notes |
|---------|--------|-------|
| **RAG System** | ✅ HAVE | Google Maps for resources (real-time grounding) |
| **Knowledge Sources** | ✅ HAVE | 36 tables (structured), resource_cache (semi-structured) |
| **Metadata Enrichment** | ✅ HAVE | Category, zip indexing, TTL for freshness |
| **Document RAG** | ⏸️ NOT NOW | Static interventions table works for 20 items; RAG at 100+ |
| **Multimodal Support** | ❌ NOT DOING | SMS-only channel; no image/video needed |
| **Query Rewriting** | ⏸️ NOT NOW | Direct queries work; HyDE adds complexity without clear benefit |
| **Knowledge Graphs** | ❌ NOT DOING | Relational tables sufficient; Neo4j over-engineering |
| **Re-Ranking** | ⏸️ NOT NOW | Google Maps ranking sufficient; cross-encoder = added cost |

**Decision**: Keep current RAG (Maps); add intervention RAG when catalog >100 items.

---

### Domain 7: NVIDIA Platform Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| **NeMo Framework** | ❌ NOT DOING | OpenAI/Gemini stack committed; no migration planned |
| **NIM Inference** | ❌ NOT DOING | Serverless OpenAI cheaper than self-hosted at current scale |
| **Riva (Voice)** | ❌ N/A | SMS-only, no voice channel |
| **Triton** | ❌ N/A | No model serving (using APIs) |
| **NeMo Guardrails** | ❌ NOT DOING | AI SDK middleware simpler than Colang; P1-P6 works |
| **TensorRT** | ❌ N/A | No GPU usage (API-based) |
| **Local LLM** | 🔮 FUTURE | If OpenAI costs >$1k/month, evaluate Llama 3 + NIM |

**Decision**: Stay on OpenAI/Gemini stack; no NVIDIA platform adoption for MVP.

**Rationale**: NVIDIA stack makes sense for:
- Self-hosted models (we use APIs)
- GPU optimization (we're serverless)
- Voice channels (we're SMS-only)

Not applicable to current architecture.

---

### Domain 8: Run, Monitor, and Maintain

| Feature | Status | Notes |
|---------|--------|-------|
| **Logging** | ✅ HAVE | agent_runs, tool_calls, guardrail_events tables |
| **Environment Variables** | ✅ HAVE | All keys in .env (Convex, OpenAI, Twilio, Stripe, Maps) |
| **Deploy Pipeline** | ✅ HAVE | `npm run deploy` with typecheck disabled |
| **Monitoring Metrics** | ✅ DOING (Week 1-2) | Dashboard + pre-aggregation |
| **Real-Time Alerting** | ✅ DOING (Week 1) | Email + Slack for crisis events |
| **Incident Response** | ⏸️ NOT NOW | Rollback via git revert; feature flags in Week 4+ |
| **Model Versioning** | ⏸️ NOT NOW | Hardcoded models work; add versioning if A/B testing models |
| **Knowledge Refresh** | ⏸️ NOT NOW | Interventions are static evidence-based (slow-changing) |

**Decision**: Implement monitoring + alerting (Week 1-2); defer incident response tooling (use git for now).

---

### Domain 9: Safety, Ethics, and Compliance

| Feature | Status | Notes |
|---------|--------|-------|
| **Crisis Detection** | ✅ HAVE | 19 keywords, deterministic (no LLM = reliable) |
| **Action Constraints** | ✅ HAVE | Rate limiting, SMS limits, onboarding gates |
| **Crisis Escalation** | ✅ HAVE | Auto 988 message + email alert |
| **Privacy** | ✅ HAVE | Consent tracking, P2 (no repeated questions) |
| **Audit Trail** | ✅ HAVE | messages, agent_runs, tool_calls tables |
| **Human Escalation** | ✅ DOING (Week 1) | Manual takeover UI + 7-stage protocol (Week 3) |
| **Output Filtering (PII)** | ✅ DOING (Week 2) | Middleware for SSN, phone, email redaction |
| **Toxicity Detection** | ⏸️ NOT NOW | Crisis keywords cover high-risk; general toxicity = nice-to-have |
| **Bias Detection** | ⏸️ NOT NOW | Monitor via human eval (Week 3); automated = complex |
| **Sandboxing** | ✅ N/A | Convex preview deployments for staging |
| **Red Teaming** | 🔮 FUTURE (Month 6+) | Defer until post-launch; need real traffic to test |
| **RLHF** | 🔮 FUTURE (Month 6+) | Need 500+ human ratings first |

**Decision**: Implement human escalation + PII filtering; defer toxicity/bias detection and red teaming to post-launch.

---

### Domain 10: Human-AI Interaction and Oversight

| Feature | Status | Notes |
|---------|--------|-------|
| **Conversational UI** | ✅ HAVE | SMS with Twilio |
| **Proactive Engagement** | ✅ HAVE | Check-in workflows (crons disabled, need to enable) |
| **Mixed Initiative** | ✅ HAVE | User can start, system can prompt |
| **Implicit Feedback** | ✅ HAVE | intervention_events table (try/skip tracking) |
| **Trust Building (P1-P6)** | ✅ HAVE | Calibrated confidence, explainability, controllability |
| **Explicit Feedback** | ⏸️ NOT NOW | "Was this helpful?" = future UX improvement |
| **Active Learning** | ⏸️ NOT NOW | Proactive clarification questions = advanced feature |
| **Explanation UI** | ⏸️ NOT NOW | Admin dashboard shows reasoning; user-facing = future |
| **Human-in-Loop** | ✅ DOING (Week 1) | Crisis takeover UI |
| **Human-on-Loop** | ✅ HAVE | Admin `/crisis` dashboard for live monitoring |

**Decision**: Enable proactive workflows (crons); add human-in-loop for crisis; defer explicit feedback collection.

---

## Summary: ARE / NOT / SHOULD / N/A by Domain

| Domain | Doing (✅) | Should Do (✅) | Partial (⚠️) | Not Now (⏸️) | Not Doing (❌) | N/A | Future (🔮) |
|--------|-----------|---------------|-------------|-------------|---------------|-----|------------|
| **1. Architecture** | 3-agent, tools, workflows | - | CoT (prompt-only) | - | Collab agents, swarm | - | - |
| **2. Development** | Framework, prompts, state | Few-shot examples | CoT instructions | Structured output | - | - | Fine-tuning |
| **3. Evaluation** | Tests, debugging | LLM-judge, versioning | - | Manual curation | - | - | Fine-tuning |
| **4. Deployment** | Serverless, infra | Caching, observability | - | API gateway | Batching, multi-region | Scaling | - |
| **5. Cognition** | Memory, decision-making | - | CoT (prompt) | Explicit memory fetch, procedural | ToT, self-consistency, planning | - | Proc memory |
| **6. Knowledge** | RAG (Maps), 36 tables | - | - | Intervention RAG, query rewrite | Multimodal, graphs, re-rank | - | - |
| **7. NVIDIA** | - | - | - | - | NeMo, NIM, Riva, Triton | All NVIDIA | Local LLM (if cost) |
| **8. Monitoring** | Logging, deploy | Metrics, alerts | - | Incident response, model version | - | - | - |
| **9. Safety** | Crisis, privacy, audit | Human escalation, PII filter | - | Toxicity, bias | - | Sandboxing | Red team, RLHF |
| **10. Human-AI** | SMS, proactive, implicit FB | Human-in-loop (crisis) | - | Explicit FB, active learning, explain UI | - | - | - |

---

## Key Takeaways

### What Makes Sense for GiveCare:
1. **Monitoring First** - Can't run production without visibility
2. **Human Oversight for Crisis** - Legal/ethical requirement for mental health
3. **Simple Tech Stack** - AI SDK + Convex sufficient; no NVIDIA migration needed
4. **Phased Rollout** - Critical (Week 1-2) → High (3-4) → Medium (5-8) → Future (Month 6+)
5. **Right-Sized Solutions** - Static tables for 20 interventions; RAG at 100+

### What Doesn't Make Sense:
1. **NVIDIA Platform** - We're API-based (OpenAI/Gemini), not self-hosted
2. **Knowledge Graphs** - 36 relational tables work fine; Neo4j over-engineering
3. **Advanced Reasoning** - ToT/self-consistency = 3-5x cost for marginal quality gain
4. **Multi-Agent Collaboration** - SMS is 1:1; no need for agent negotiation
5. **Fine-Tuning** - Need 1000+ examples first; defer to post-launch

### Conscious Non-Decisions (Defer to Data):
1. **Intervention RAG** - Works statically now; add when catalog >100 items
2. **Explicit Feedback** - Implicit tracking (events) sufficient for MVP; user-facing later
3. **Red Team Testing** - Need real traffic patterns first (Month 6+)
4. **RLHF** - Collect 500+ human ratings, then evaluate if needed
5. **Local LLM** - If OpenAI costs >$1k/month, evaluate Llama 3 + NIM
