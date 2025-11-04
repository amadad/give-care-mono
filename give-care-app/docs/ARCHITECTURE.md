# GiveCare TypeScript - Architecture

**Audience**: Engineers, technical stakeholders, AI developers
**Purpose**: Understand system design, data flows, and implementation details
**Technical Depth**: High (includes code patterns)

**Version**: 0.8.3
**Last Updated**: 2025-11-04
**Architecture**: Multi-Agent Serverless
**Total Implementation**: ~13,000 LOC core (34,726 LOC total including tests & admin)
- convex/: ~11,000 LOC (database, functions, API)
- src/: ~2,000 LOC (agents, tools, business logic)
- tests/: ~11,000 LOC (235+ tests)
- admin-frontend/: ~6,300 LOC (admin dashboard)

**Recent Streamlining** (2025-11-04): Removed 1,979 LOC of non-functional LLM email system

---

## System Overview

```
SMS → Twilio → Convex HTTP Endpoint → Multi-Agent System → Response
                            ↓
                    [Real-Time Database]
                    - users (profiles)
                    - assessmentSessions
                    - wellnessScores
                    - knowledgeBase
                    - conversations
```

---

## Multi-Agent Architecture

### 3 Specialized Agents

**1. Main Agent (Orchestrator)**
- Tools: `check_wellness_status`, `find_interventions`, `update_profile`
- Handoffs: → crisis, → assessment
- Instructions: Dynamic, context-aware
- Role: General conversation, interventions, wellness tracking

**2. Crisis Agent (200-400ms faster)**
- Tools: None (immediate resource delivery)
- Provides: 988, 741741, 911
- Instructions: Warm, validating, immediate
- Role: Safety-critical situations requiring immediate support

**3. Assessment Agent (300-500ms faster)**
- Tools: `start_assessment`, `record_assessment_answer`
- Behavior: StopAtTools (efficiency optimization)
- Instructions: One question at a time, progress tracking
- Role: Clinical evaluations (EMA, CWBS, REACH-II, SDOH)

**Key Innovation**: Seamless handoffs - users experience ONE unified agent

### Agent Flow

```
User Message
     ↓
[Input Guardrails] (20ms parallel)
- Crisis detection
- Spam filtering
     ↓
Main Agent (determines routing)
     ↓
├─→ Crisis Agent (if safety keyword detected)
├─→ Assessment Agent (if "check-in" requested)
└─→ Main Agent (general conversation)
     ↓
[Output Guardrails]
- Medical advice blocking
- Safety compliance check
     ↓
Response to User
```

---

## Serverless Stack

### Why No Traditional Hosting?

**Python (Old) - Heavy Infrastructure**:
- ❌ FastAPI server running 24/7
- ❌ Uvicorn process management
- ❌ PostgreSQL database (Supabase)
- ❌ SQLite file for conversations
- ❌ Server maintenance, scaling, restarts
- ❌ Cost: ~$20-50/month (Hetzner + Supabase)

**TypeScript (New) - 100% Serverless**:
- ✅ Convex handles EVERYTHING
  - Database (built-in, real-time)
  - Functions (auto-scaling)
  - HTTP endpoints (webhook hosting)
  - Session storage
  - File storage (if needed)
- ✅ No servers to manage
- ✅ Auto-scales to zero (pay only for usage)
- ✅ Global edge deployment
- ✅ Cost: FREE tier covers ~10,000 users!

### Convex Architecture

```
┌─────────────────────────────────────┐
│  Twilio (SMS/RCS Gateway)           │
│  Cost: $1.50/user/month (messages)  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Convex (Everything Else)           │
│  - HTTP endpoint (/twilio/sms)      │
│  - Database (9 tables)              │
│  - Functions (agent runner)         │
│  - Real-time queries                │
│  Cost: FREE (under 1M calls/month)  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  OpenAI API (GPT-4o-mini)           │
│  Cost: ~$0.02/conversation          │
└─────────────────────────────────────┘
```

---

## Database Schema (9 Tables)

### Core Tables

**1. users** (23 fields)
- Profile: phoneNumber, firstName, relationship, careRecipientName, zipCode
- Journey: journeyPhase, subscriptionStatus
- Assessment state: assessmentInProgress, assessmentType, assessmentCurrentQuestion
- Wellness: burnoutScore, burnoutBand, pressureZones
- Tracking: onboardingAttempts, onboardingCooldownUntil
- Device: rcsCapable, deviceType, languagePreference
- Metadata: createdAt, updatedAt, lastContactAt

**2. assessmentSessions**
- userId, type, completed
- currentQuestion, totalQuestions
- responses (JSON), overallScore, domainScores
- startedAt, completedAt

**3. assessmentResponses**
- sessionId, userId
- questionId, questionText
- responseValue, score
- respondedAt

**4. wellnessScores**
- userId, overallScore, band
- assessmentContributions (JSON)
- pressureZones, pressureZoneScores (JSON)
- recordedAt

**5. knowledgeBase** (Interventions)
- type, category, title, description, content
- pressureZones, tags
- evidenceSource, evidenceLevel, effectivenessPct
- deliveryFormat, deliveryData (JSON)
- language, culturalTags
- locationSpecific, zipCodes
- usageCount, avgRating
- status, createdAt, updatedAt

### Supporting Tables

**6. knowledgeUsage**
- knowledgeId, userId
- pressureZones, userQuery, searchMethod
- delivered, userAction, rating
- createdAt

**7. conversations**
- userId, role, text, mode
- messageSid, agentName
- toolCalls (JSON), latency, tokenUsage (JSON)
- timestamp

**8. scheduledMessages**
- userId, messageType, scheduledFor
- content, deliveryStatus
- sentAt, createdAt

**9. twilioMessages**
- userId, messageSid, direction
- from, to, body, status
- receivedAt, processedAt, errorCode

### Indexes (12 total)

- users: by_phone
- assessmentSessions: by_user, by_user_type
- assessmentResponses: by_session, by_user
- wellnessScores: by_user_recorded
- knowledgeBase: by_type_status, search_content
- knowledgeUsage: by_knowledge, by_user
- conversations: by_user_timestamp
- scheduledMessages: by_user_scheduled, by_status_scheduled
- twilioMessages: by_user, by_sid

---

## Component Breakdown

### Core Business Logic (2,100 LOC)

**src/agents.ts** (151 LOC)
- 3 agent definitions with specialized tools
- Seamless handoff configuration
- Conditional tool availability

**src/tools.ts** (550 LOC)
- 5 agent tools with OpenAI Agents SDK integration
- `start_assessment` - Initiate wellness assessments
- `record_assessment_answer` - Process responses, calculate burnout
- `check_wellness_status` - Show trends and progress
- `find_interventions` - Match resources to pressure zones
- `update_profile` - Manage user information

**src/assessmentTools.ts** (610 LOC)
- 4 clinical assessment definitions (EMA, CWBS, REACH-II, SDOH)
- Complete scoring algorithms
- Band classification (minimal, low, moderate, high, severe)

**src/burnoutCalculator.ts** (330 LOC)
- Composite burnout score calculation
- Weighted contributions by assessment type
- Temporal decay (recent assessments weighted higher)
- Pressure zone extraction (7 categories)
- Trend analysis with historical data

**src/safety.ts** (403 LOC)
- 4 guardrails (crisis, spam, medical advice, safety)
- Tripwire pattern for immediate stops
- ~20ms parallel execution
- P1-P6 trauma-informed compliance

**src/instructions.ts** (323 LOC)
- 3 dynamic instruction functions (not static strings!)
- Shared trauma-informed principles (P1-P6)
- Seamless handoff rules
- Context-aware personalization

**src/context.ts** (100 LOC)
- GiveCareContext dataclass (23 fields)
- Shared across all agents
- Type-safe with Zod schemas
- Helper methods (profileComplete, missingProfileFields)

### Infrastructure (1,400 LOC)

**convex/functions/twilio.ts** (193 LOC)
- HTTP endpoint handler (`/twilio/sms`)
- Form data parsing (Twilio webhook format)
- User creation/retrieval
- Agent execution orchestration
- TwiML response generation
- Health check endpoint (`/health`)

**convex/functions/users.ts** (200 LOC)
- Complete user CRUD operations
- Internal queries: getUser, getUserByPhone
- Internal mutations: createUser, updateProfile, updateWellness, updateAssessmentState
- Public mutations: getOrCreateByPhone, patchProfile

**convex/functions/agents.ts** (160 LOC)
- OpenAI Agents SDK integration
- Context building from database records
- `Runner.run()` orchestration
- State updates based on context changes
- Usage tracking (tokens, latency, tool calls)

**convex/functions/conversations.ts** (98 LOC)
- Message history logging
- Recent conversation queries
- Analytics metrics (avg latency, tokens)

**convex/functions/wellness.ts** (144 LOC)
- Latest score queries
- Historical score tracking
- Trend analysis with time windows
- Pressure zone aggregation
- Score persistence with auto-updates

**convex/functions/assessments.ts** (305 LOC)
- Session lifecycle management
- Auto-scoring on completion
- Response storage
- Progress tracking
- Integration with assessment tools

**convex/functions/interventions.ts** (240 LOC)
- Pressure zone scoring algorithm
- Location-based filtering (zip code)
- Effectiveness-based ranking
- Usage tracking and analytics
- Search functionality

**convex/schema.ts** (400 LOC)
- 9 table definitions
- 12 optimized indexes
- Type-safe field definitions
- Real-time subscription ready

---

## Key Features

### Clinical Assessments

**EMA (Exhaustion and Malaise Assessment)** - 13 questions
- Domains: Physical exhaustion, emotional exhaustion, sleep quality, motivation
- Band thresholds: minimal (<20), low (20-35), moderate (35-50), high (50-65), severe (>65)

**CWBS (Caregiver Well-Being Scale)** - 15 questions
- Domains: Emotional, physical, social, financial well-being
- Band thresholds: minimal (<20), low (20-35), moderate (35-50), high (50-65), severe (>65)

**REACH-II (Resources for Enhancing Alzheimer's Caregiver Health)** - 14 questions
- Domains: Role captivity, relationship strain, social support, self-care
- Band thresholds: minimal (<20), low (20-35), moderate (35-50), high (50-65), severe (>65)

**SDOH (Social Determinants of Health)** - 10 questions
- Domains: Housing, food security, transportation, social connections
- Band thresholds: minimal (<15), low (15-30), moderate (30-45), high (45-60), severe (>60)

### Burnout Calculator

**Composite Score Algorithm**:
```typescript
// Weighted contributions
EMA weight: 0.35 (35%)
CWBS weight: 0.25 (25%)
REACH-II weight: 0.25 (25%)
SDOH weight: 0.15 (15%)

// Temporal decay (recent = more important)
Decay rate: 7 days (each week old reduces weight by 15%)
Max age: 90 days (scores older than 90 days excluded)

// Pressure zone extraction
7 categories:
- emotional (from EMA emotional_exhaustion, CWBS emotional)
- physical (from EMA physical_exhaustion, CWBS physical)
- financial_strain (from CWBS financial, SDOH food_security)
- social_isolation (from REACH social_support, SDOH social_connections)
- caregiving_tasks (from REACH role_captivity)
- self_care (from REACH self_care, EMA sleep_quality)
- social_needs (from SDOH housing, transportation)
```

### Intervention Matching

**Scoring Algorithm**:
```typescript
1. Match pressure zones
   - Count overlapping zones between intervention and user
   - Higher overlap = higher priority

2. Check location
   - If intervention is location-specific, verify zip code match
   - Exclude if user's zip not in intervention's zipCodes

3. Rank by effectiveness
   - Sort by match count (most zones matched first)
   - Then by effectivenessPct (most effective first)
   - Then by usageCount (most used first)

4. Return top N matches
```

---

## Performance

### Target Metrics
- Response time: <1000ms (p95)
- Function execution: <500ms
- Database queries: <50ms
- Guardrails: ~20ms (parallel)

### Current Performance
- Average response time: ~900ms (50% faster than Python ~1500ms)
- Agent execution: 800-1200ms (GPT-5 nano with minimal reasoning)
- Guardrails: ~20ms (non-blocking)
- Database: Async background logging (0ms user-facing latency)

---

## Cost Analysis

### Free Tier (Convex)
- 1M function calls/month (~10K users)
- 1GB database storage
- 1GB bandwidth
- Real-time subscriptions
- Global CDN

### Realistic Costs

**100 users/month**:
- Messages: 3,000 (30 per user)
- Function calls: 15,000 (~5 per message)
- Convex: $0 (under free tier)
- Twilio: $150 (SMS delivery)
- OpenAI: $2 (GPT-4o-mini)
- **Total: $152/month**

**1,000 users/month**:
- Messages: 30,000 (30 per user)
- Function calls: 150,000
- Convex: $0 (under free tier)
- Twilio: $1,500
- OpenAI (GPT-5 nano): $20
- **Total: $1,520/month**

**10,000 users/month**:
- Messages: 300,000 (30 per user)
- Function calls: 1.5M
- Convex: $25 (over free tier)
- Twilio: $15,000
- OpenAI (GPT-5 nano): $210
- **Total: $15,235/month ($1.52/user)**

### Cost Comparison

| Component | Python (Hetzner) | TypeScript (Convex) |
|-----------|------------------|---------------------|
| Server | $20-50/month | $0 (serverless) |
| Database | Supabase (free) | Convex (free) |
| Orchestration | Coolify | None needed |
| Scaling | Manual | Auto |
| **Total** | $20-50/month | $0-25/month |

---

## Security

### Built-In Protections
- ✅ HTTPS enforced (all endpoints)
- ✅ Rate limiting (Convex default)
- ✅ Twilio signature validation
- ✅ Environment variables encrypted (Convex)
- ✅ Database access control (Convex auth)

### Application-Level Safety
- ✅ 4 guardrails (crisis, spam, medical, safety)
- ✅ P1-P6 trauma-informed principles
- ✅ Crisis detection with immediate resources
- ✅ Medical advice blocking
- ✅ Tripwire pattern for safety stops

---

## Scalability

### Automatic Scaling (Convex)
- Functions scale to thousands of concurrent executions
- Database queries optimized with 12 indexes
- Global CDN serves requests from nearest edge
- Real-time subscriptions push updates automatically

### Manual Optimizations (If Needed)
1. Add more database indexes
2. Optimize slow queries (use Convex dashboard)
3. Cache frequently accessed data
4. Batch operations for admin tasks

### When to Upgrade
- Free → Paid: When hitting 1M function calls/month (~10K users)
- Paid tiers: Scale automatically, pay for usage

---

## Monitoring

### Convex Dashboard
- Real-time function execution logs
- Database queries and performance
- Error rates and stack traces
- Usage metrics (calls, storage, bandwidth)
- Environment variables
- Deployment history

### Key Metrics to Track
- Response time (target: <1000ms)
- Function call volume (vs free tier limit)
- Database size (vs 1GB limit)
- Error rate (target: <1%)
- Token usage (OpenAI costs)

---

## Backup & Recovery

### Automatic Backups (Convex)
- Continuous snapshots
- Point-in-time recovery
- Cross-region replication
- No configuration needed

### Disaster Recovery
1. **Database corruption**: Restore from Convex snapshot
2. **Code bug deployed**: Rollback deployment in dashboard
3. **Convex outage**: Wait (99.95% uptime SLA)

---

## Future Enhancements

### Nice-to-Have (Not Blockers)
- RCS rich media templates
- Comprehensive test suite
- Performance benchmarks
- Admin dashboard UI
- A/B testing infrastructure
- Ax prompt optimization layer

### Potential Improvements
- Multi-language support (es, zh, etc.)
- Voice call integration
- WhatsApp/Facebook Messenger
- Push notifications
- Email summaries
- Calendar integration
- Family member portal

---

## References

### Internal Documentation
- README.md - Project overview
- START_HERE.md - Entry point
- DEPLOYMENT.md - Deployment guide
- docs/ - Historical implementation docs

### External Resources
- Convex: https://docs.convex.dev
- OpenAI Agents SDK: https://github.com/openai/agents-sdk
- Twilio: https://www.twilio.com/docs/sms

---

**Architecture Status**: ✅ Production-ready, fully implemented, deployment-tested patterns
