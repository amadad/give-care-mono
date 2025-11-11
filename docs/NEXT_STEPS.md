# Next Steps: v1.6.0 Refactor

**Date:** 2025-01-14  
**Status:** Ready for Deployment & Testing

---

## Immediate Actions (Today)

### 1. Install Dependencies
```bash
cd give-care-app
pnpm install
```
**Why:** Adds `luxon@^3.4.4` required for timezone-aware scheduling

### 2. Generate Types & Deploy
```bash
npx convex dev
```
**Why:** Generates TypeScript types and deploys to development environment

### 3. Verify Deployment
- Check Convex dashboard for new functions:
  - `workflows.scheduling.updateCheckInSchedule`
  - `workflows.checkIns.dispatchDue`
  - `workflows.interventions.suggestInterventions`
  - `workflows.trends.detectScoreTrends`
  - `workflows.engagement.monitorEngagement`
- Verify cron jobs are registered:
  - `checkIns.dispatchDue` (every 15 minutes)
  - `scores.detectTrends` (every 6 hours)
  - `users.monitorEngagement` (every 24 hours)

---

## Testing Phase (This Week)

### Manual Testing Checklist

**Phase 1: Score Creation**
- [ ] Complete an assessment (EMA, BSFC, REACH-II, or SDOH)
- [ ] Verify `scores` table has new record
- [ ] Verify score includes: `composite`, `band`, `zones`, `confidence`
- [ ] Verify `triggers` table has new/updated record with `rrule` and `nextRun`

**Phase 2: Check-ins**
- [ ] Wait for scheduled check-in time (or manually trigger cron)
- [ ] Verify EMA question sent via SMS
- [ ] Reply with numeric answer (1-5)
- [ ] Verify fast-path response (<200ms)
- [ ] Complete EMA assessment
- [ ] Verify new score created
- [ ] Verify schedule updated (if score changed)

**Phase 3: SDOH Profile Enrichment**
- [ ] Complete SDOH assessment
- [ ] Verify user `metadata.profile` includes:
  - `financialStatus` (struggling/stable/comfortable)
  - `transportationReliability` (reliable/unreliable)
  - `housingStability` (stable/at_risk)
  - `communityAccess` (good/poor)
  - `clinicalCoordination` (good/poor)

**Phase 4: Intervention Suggestions**
- [ ] Complete assessment with pressure zones
- [ ] Verify SMS sent with intervention suggestions
- [ ] Verify interventions filtered by preferences (if any)
- [ ] Test preference tracking: Like/dislike an intervention
- [ ] Complete another assessment
- [ ] Verify disliked interventions excluded

**Phase 5: Trend Detection**
- [ ] Create 3+ scores for a user (declining trend: +5 points)
- [ ] Manually trigger `detectScoreTrends` cron
- [ ] Verify intervention suggestions triggered

**Phase 6: Engagement Monitoring**
- [ ] Create user with no agent runs in 7+ days
- [ ] Manually trigger `monitorEngagement` cron
- [ ] Verify re-engagement SMS sent

---

## Automated Testing (This Week)

### New Tests Needed

**Priority 1: Core Feedback Loop**
```typescript
// tests/assessments.test.ts
- Test score creation on finalizeAssessment
- Test scoreWithDetails() function
- Test zone averages calculation
- Test confidence calculation
```

**Priority 2: Scheduling**
```typescript
// tests/workflows/scheduling.test.ts (NEW)
- Test updateCheckInSchedule mutation
- Test frequency mapping (72+ = daily, 45-71 = weekly, <45 = biweekly)
- Test RRULE generation
- Test nextRun calculation with timezones
```

**Priority 3: Check-ins**
```typescript
// tests/workflows/checkIns.test.ts (NEW)
- Test dispatchDue action
- Test sendEMACheckIn workflow
- Test session creation/continuation
- Test nextRun bumping
```

**Priority 4: Fast-Path**
```typescript
// tests/assessments.test.ts
- Test getAnyActiveSession query
- Test handleInboundAnswer action
- Test numeric reply detection in inbound.ts
- Test skip handling
```

**Priority 5: SDOH Profile**
```typescript
// tests/lib/profile.test.ts (NEW)
- Test extractSDOHProfile function
- Test zone bucket mapping
- Test profile field extraction
```

**Priority 6: Interventions**
```typescript
// tests/workflows/interventions.test.ts (NEW)
- Test suggestInterventions workflow
- Test zone mapping (REACH/SDOH → intervention zones)
- Test preference filtering
- Test liked/disliked prioritization
```

**Priority 7: Trends**
```typescript
// tests/workflows/trends.test.ts (NEW)
- Test detectScoreTrends action
- Test trend detection logic (5+ point increase)
- Test intervention trigger on decline
```

**Priority 8: Engagement**
```typescript
// tests/workflows/engagement.test.ts (NEW)
- Test monitorEngagement action
- Test 7-day window detection
- Test re-engagement message sending
```

---

## Monitoring Phase (First 2 Weeks)

### Key Metrics to Track

**Cron Job Execution**
- `checkIns.dispatchDue`: Execution count, failures, average duration
- `scores.detectTrends`: Execution count, users processed, trends detected
- `users.monitorEngagement`: Execution count, silent users found, messages sent

**Workflow Completion**
- `sendEMACheckIn`: Success rate, average duration, failures
- `suggestInterventions`: Success rate, interventions sent, preference filtering
- `crisisEscalation`: (existing) Success rate

**Score Creation**
- Scores created per day
- Average score by assessment type
- Score distribution (bands: very_low/low/moderate/high)

**Check-in Engagement**
- EMA questions sent
- Response rate (% of questions answered)
- Fast-path usage (% numeric replies)

**Intervention Effectiveness**
- Interventions suggested
- Preference tracking (liked/disliked counts)
- User engagement with interventions

### Dashboard Queries

```typescript
// Scores created today
const scoresToday = await ctx.db
  .query('scores')
  .filter((q) => q.gte(q.field('_creationTime'), startOfToday))
  .collect();

// Check-ins sent today
const checkInsToday = await ctx.db
  .query('triggers')
  .filter((q) => q.eq(q.field('type'), 'recurring'))
  .collect();

// Intervention preferences
const prefs = await ctx.db
  .query('intervention_events')
  .collect();
```

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] Code review complete
- [ ] Documentation updated
- [ ] Changelog updated ✅

### Deployment Steps
1. [ ] Deploy to staging environment
2. [ ] Run smoke tests in staging
3. [ ] Monitor for 24 hours
4. [ ] Deploy to production
5. [ ] Monitor cron jobs
6. [ ] Monitor workflow completion rates
7. [ ] Monitor error logs

### Post-Deployment
- [ ] Verify cron jobs running on schedule
- [ ] Check workflow completion rates
- [ ] Monitor user feedback
- [ ] Track score creation rates
- [ ] Analyze intervention effectiveness

---

## Future Enhancements (After Monitoring)

### Based on Data Collected

**If Check-in Frequency Needs Tuning:**
- Make thresholds configurable (currently 72/45 fixed)
- Add user preference for frequency
- Consider adaptive thresholds based on engagement

**If Trend Detection Needs Improvement:**
- Implement moving averages (currently simple comparison)
- Add multi-point trend analysis
- Consider zone-specific trends

**If Engagement Window Needs Adjustment:**
- Make 7-day window configurable
- Add adaptive windows based on user patterns
- Consider different messages for different silence durations

**If Intervention Matching Needs Refinement:**
- Improve zone mapping logic
- Add more sophisticated preference weighting
- Consider user feedback in ranking

---

## DSPy Integration (Future - After Data Collection)

**Prerequisites:**
- 100+ completed assessments with scores
- 50+ intervention suggestions with user feedback
- 30+ days of engagement data
- Baseline metrics established

**Timeline:** 1-2 weeks after sufficient data collected

**See:** `docs/archive/DSPY_ROLE_AND_IMPACT.md` for detailed plan

---

## Support & Troubleshooting

### Common Issues

**Cron Jobs Not Running**
- Check Convex dashboard → Cron Jobs
- Verify function names match exactly
- Check for errors in logs

**Scores Not Created**
- Verify `finalizeAssessment` is called
- Check `scores` table permissions
- Verify `scoreWithDetails()` returns valid data

**Check-ins Not Sent**
- Verify triggers exist in `triggers` table
- Check `nextRun` timestamps
- Verify cron job execution logs

**Fast-Path Not Working**
- Verify `getAnyActiveSession` query works
- Check numeric reply detection regex
- Verify `handleInboundAnswer` action

### Debug Queries

```typescript
// Check latest scores
const latestScores = await ctx.db
  .query('scores')
  .order('desc')
  .take(10);

// Check active triggers
const activeTriggers = await ctx.db
  .query('triggers')
  .filter((q) => q.eq(q.field('status'), 'active'))
  .collect();

// Check intervention events
const events = await ctx.db
  .query('intervention_events')
  .order('desc')
  .take(20);
```

---

**Last Updated:** 2025-01-14  
**Status:** Ready for Deployment

