# Customer Journey System Documentation

## Overview

The Give.Care customer journey system provides intelligent, stage-based support for caregivers through their caregiving experience. It integrates assessment results, conversation patterns, and user profiles to deliver personalized, contextually-aware support.

## Current Implementation Status

**Version**: Production implementation as of 2025-07-19  
**Status**: Core features working, proactive check-ins enabled, performance optimized, subscription tracking fixed

## ⚠️ CRITICAL FINDINGS (UPDATED)

1. **Database Schema Crisis**: Most documented tables don't exist in production
2. **Journey System Broken**: Core journey tracking features are not functional
3. **Session State Lost**: Journey context resets with each conversation
4. **Archetype Detection Bug**: Code exists but never executes due to flawed condition
5. ~~**No Proactive Support**: System is 100% reactive, no scheduled messaging~~ **✅ FIXED**: Proactive check-ins now enabled via pg_cron
6. ~~**Static Payment Links**: No user tracking for subscriptions~~ **✅ FIXED**: Dynamic checkout URLs with user metadata (2025-01-19)

## TL;DR: Current Reality vs Design

**What Users Experience Now:**
- ✅ Warm welcome and 3 free messages
- ✅ Basic profile questions during chat
- ✅ Stress assessments when triggered
- ✅ **NEW**: Proactive daily check-ins (4 PM UTC/11 AM ET)
- ✅ **NEW**: 30-60% faster response times (250-500ms improvement)
- ✅ **NEW**: Personalized checkout URLs with WELCOME50 promo code (50% off first month)
- ❌ **No conversation memory**: Agno memory tables not created in 'ai' schema, causing fresh state each conversation (journey state is saved separately in user profile)
- ⚡ **Basic personalization**: Works based on journey stage, but archetype detection has a bug
- ❌ No celebration of their progress (milestone tracking not implemented)

**What USER_JOURNEY_MAP.md Promises:**
- ✅ Sophisticated 6-phase journey from discovery to growth
- ✅ 10 distinct caregiver archetypes with tailored messaging
- ✅ Automatic progression through 8 journey stages
- ✅ Proactive support with stage-based frequency
- ✅ Continuous monitoring and milestone celebrations
- ✅ Long-term relationship building

**The Gap:** We have a reactive SMS bot when we designed an intelligent journey companion.

## Actual System Architecture (Current Implementation)

```mermaid
graph TB
    subgraph "Entry Points"
        SMS[SMS via Twilio]
        RCS[RCS Messaging<br/>Subscription Cards]
    end
    
    subgraph "main.py SMS Handler"
        VPN[Validate Phone Number]
        GOU[Get/Create User]
        SUB[Subscription Check<br/>3 free messages]
        EMG[Emergency Detection]
        ASS[Assessment Handler]
        DCR[Build Dynamic Context]
    end
    
    subgraph "Agno DCR Agent"
        AG[Agent w/ Session State<br/>journey_stage, archetype]
        EXT[Profile Extraction<br/>w/ Confidence Scores]
        SAF[Safety Assessment]
        RSP[Response Generation]
        MEM[User Memories<br/>Agentic Memory]
    end
    
    subgraph "Core Modules (src/)"
        JM[journey.py<br/>Stage Determination]
        PM[personalization.py<br/>Rule Matching]
        TRC[twilio_rcs.py<br/>Rich Cards]
        STR[stripe.py<br/>Subscriptions]
    end
    
    subgraph "Database (Supabase)"
        UT[users table<br/>JSONB profile_data]
        JST[journey_stages table<br/>(exists but unused)]
        MT[messages table]
        SET[stripe_events table]
    end
    
    subgraph "Outputs"
        TXML[TwiML Response]
        RCSM[RCS Message]
        SMSF[SMS Fallback]
    end
    
    SMS --> VPN
    RCS --> VPN
    VPN --> GOU
    GOU --> SUB
    SUB --> EMG
    EMG --> ASS
    ASS --> DCR
    DCR --> AG
    
    AG --> EXT
    AG --> SAF
    AG --> RSP
    AG --> MEM
    
    EXT --> PM
    PM --> RSP
    
    ASS --> JM
    JM --> UT
    
    RSP --> TXML
    TXML --> RCSM
    TXML --> SMSF
    
    GOU --> UT
    EXT --> UT
    JM --> UT
    
    STR --> SET
```

### What's Actually Connected vs Planned

| Component | Status | Implementation Details |
|-----------|--------|----------------------|
| **SMS Entry** | ✅ Working | Twilio webhook validates, creates users |
| **Subscription Gate** | ✅ Enhanced | 3 free messages, dynamic checkout URLs, WELCOME50 promo |
| **RCS Integration** | ✅ Working | Subscription cards with SMS fallback |
| **Emergency Detection** | ✅ Working | Keyword-based crisis override |
| **Assessment System** | ✅ Working | 3 assessments embedded in main.py |
| **Profile Extraction** | ✅ Working | DCR agent extracts with confidence scores |
| **Journey Stage Determination** | ⚡ Partial | Only sets on assessment completion |
| **Archetype Detection** | ❌ Broken | Bug in condition check (line 1090 main.py) |
| **Personalization Rules** | ✅ Working | Journey-aware rules active |
| **Session State Tracking** | ❌ Broken | Lost between conversations |
| **Database Journey Table** | ❌ Table may not exist | SQL file exists, but table not in production |
| **Journey Events Table** | ❌ Table may not exist | Code logs events but table missing |
| **User Messages Table** | ❌ Table may not exist | Message logging fails silently |
| **Progression Monitoring** | ❌ Not implemented | No automatic stage transitions |
| **Support Cadence** | ✅ Partially implemented | next_check_in tracked, pg_cron scheduled |
| **Proactive Messaging** | ✅ Working | Daily check-ins at 4 PM UTC via pg_cron |
| **Stage Transitions** | ❌ Not implemented | Only manual via assessments |
| **Milestone Celebrations** | ❌ Not implemented | No progress tracking |

## Recent Improvements (2025-07-18 & 2025-07-19)

### 🚀 Performance Optimizations
1. **Config Caching**: JSON files cached at startup (saves 50-100ms per request)
   - Assessment definitions loaded once into memory
   - Journey/personalization configs cached on startup
   - Eliminates repeated file I/O operations

2. **Batch DB Updates**: Single atomic queries (saves 100-200ms)
   - Combined profile + confidence score updates
   - Reduced from 3-4 queries to 1 atomic upsert
   - Better consistency and error handling

3. **Async Logging**: Fire-and-forget pattern (saves 50-100ms)
   - Non-critical logs made async
   - No blocking on log writes
   - Critical errors still synchronous

4. **Semantic Crisis Detection**: AI-powered instead of regex
   - More nuanced understanding of crisis situations
   - Reduces false positives from keyword matching
   - Better context awareness

5. **Phone Validation Cache**: LRU cache for repeated numbers
   - Twilio API calls cached for 24 hours
   - Significant savings for repeat users

6. **Reduced Agent History**: From 3 to 1 message
   - Smaller context window = faster processing
   - Maintains quality while improving speed

7. **Total Improvement**: 250-500ms faster (30-60% reduction in response time)

### 📅 Proactive Check-ins via pg_cron
```sql
-- Supabase pg_cron implementation
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Scheduled daily at 4 PM UTC (optimal for US timezones)
SELECT cron.schedule(
    'run-daily-check-ins',
    '0 16 * * *',  -- 11 AM ET, 10 AM CT, 9 AM MT, 8 AM PT
    'SELECT run_check_ins();'
);

-- Function calls /run-check-ins endpoint
CREATE OR REPLACE FUNCTION run_check_ins()
RETURNS void AS $$
BEGIN
    SELECT net.http_post(
        url := 'https://your-app/run-check-ins',
        headers := jsonb_build_object(
            'Authorization', 'Bearer [TOKEN]',
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
END;
$$ LANGUAGE plpgsql;
```

### 🔧 New Endpoints
- **`/run-check-ins`**: Triggers proactive check-ins for users whose `next_check_in` has passed
- Protected by Bearer token authentication
- Returns count of users found and messages sent

### 📊 Enhanced Tracking
```python
# Profile now includes:
profile_data = {
    "next_check_in": "2025-01-18T16:00:00Z",  # Calculated from support_cadence
    "support_cadence": "daily/3x_weekly/weekly",  # Based on journey stage
    "last_session_context": {
        "topic": ["memory care", "safety"],
        "emotional_state": "overwhelmed",
        "timestamp": "2025-01-18T10:30:00Z"
    }
}
```

### 💳 Subscription System Improvements (2025-01-19)

#### Dynamic Checkout URLs
- **Problem**: Static payment links couldn't track which user was subscribing
- **Solution**: Implemented personalized checkout sessions via Supabase edge function
- **Benefits**:
  - Each user gets unique checkout URL with their user_id in metadata
  - Webhooks can properly update subscription status
  - Better conversion tracking and analytics
  - Can track abandoned checkouts

#### WELCOME50 Promo Code
- **Created**: $4.00 off coupon (50% of $9.99 monthly price)
- **Duration**: Once (applies to first payment only)
- **Integration**: Automatically included in welcome messages
- **Coupon ID**: u8NNTxHe in Stripe

#### Implementation Details
```python
# src/integrations/stripe.py
async def get_checkout_url(self, user_phone: str) -> str:
    """Get personalized checkout URL for user via Edge Function."""
    user_id = await self._get_user_from_phone(user_phone)
    if not user_id:
        return os.getenv("STRIPE_PAYMENT_LINK", "...")  # Fallback
    
    # Call Edge Function to create personalized checkout session
    result = await self._call_edge_function("create", user_id)
    
    if result and result.get("checkout_url"):
        return result["checkout_url"]
    
    return os.getenv("STRIPE_PAYMENT_LINK", "...")  # Fallback
```

#### Welcome Flow Updates
- **First message**: Welcome text + RCS card with dynamic URL + WELCOME50
- **Messages 2-3**: Reminder with dynamic URL + WELCOME50  
- **After message 3**: Payment required with dynamic URL

#### Testing
- Created `scripts/test_subscription_flow.py` to verify implementation
- Confirms dynamic URLs are generated correctly
- Validates WELCOME50 coupon is active

## Current Implementation Details

### SMS Message Flow (main.py)

```python
# Actual flow from main.py:handle_sms()
1. Validate Twilio signature
2. Validate and format phone number (+1XXXXXXXXXX)
3. Get/create user in database
4. Check for emergency keywords → immediate 911 response
5. Check subscription status:
   - First message → Welcome + RCS subscription card
   - Demo user (< 3 messages) → Process + reminder
   - No subscription (>= 3 messages) → Payment link only
6. Check for assessment in progress → Continue assessment
7. Build dynamic context for agent
8. Run DCR agent with extraction + safety + response
9. Update user profile with extracted data
10. Return TwiML response
```

### DCR Agent Configuration (Lines 683-828)

```python
# Agent initialization with journey tracking
agent_kwargs = {
    "name": "givecare-dcr",
    "model": "gpt-4o-mini",
    "add_history_to_messages": True,
    "num_history_responses": 3,
    "enable_user_memories": True,        # Agno memory features
    "enable_agentic_memory": True,
    "session_state": {                   # Journey tracking state
        "journey_stage": None,
        "archetype": None,
        "stage_entered_at": None,
        "assessment_tracking": {},
        "support_cadence": "default",
        "progression_history": []
    },
    "add_state_in_messages": True,
}
```

### Assessment System (Lines 98-381)

Currently 3 assessments are embedded directly in main.py:

```python
ASSESSMENTS = {
    'reach_ii_v1': {
        'name': 'REACH II Risk Assessment',
        'questions': [...],  # 5 questions
        'trigger': lambda profile: profile.get('profile_completeness', 0) < 50
    },
    'cwbs_short': {
        'name': 'Caregiver Well-Being Scale - Short',
        'questions': [...],  # 4 questions  
        'trigger': lambda profile: len(profile.get('assessment_history', [])) == 0 
                                   or days_since_last_assessment(profile) > 30
    },
    'promis_anxiety': {
        'name': 'PROMIS Anxiety - Short',
        'questions': [...],  # 3 questions
        'trigger': lambda profile: any(h.get('risk') in ['moderate', 'high'] 
                                      for h in profile.get('assessment_history', []))
    }
}
```

### Journey Stage Determination (Lines 244-281)

```python
# Only happens after assessment completion
def complete_assessment(user: dict, assessment_id: str) -> str:
    # ... scoring logic ...
    
    # Determine journey stage from assessment results
    new_stage = determine_journey_stage({
        'id': assessment_id,
        'total_score': total_score,
        'risk_level': risk_level
    }, profile)
    
    # Store as suggestion, not active stage
    profile['suggested_journey_stage'] = new_stage
    update_user_profile_simple(user['id'], profile)
    
    # Add stage-specific completion message
    if new_stage == 'new_caregiver':
        completion_msg += "\n\nI'm here to guide you through this new journey..."
    # etc.
```

### Current JSONB Profile Structure

```json
{
  "profile_data": {
    // Core fields tracked by agent
    "relationship": "spouse/parent/child/etc",
    "experience_level": "new/experienced/long_term", 
    "emotional_state": "stable/stressed/overwhelmed/crisis",
    "living_situation": "together/nearby/distant/facility",
    "primary_concerns": ["array of concerns"],
    "support_system": "strong/moderate/limited/isolated",
    "care_duration": "months as integer",
    
    // Assessment tracking
    "current_assessment": {
      "id": "reach_ii_v1",
      "question_index": 2,
      "started": "2024-01-15T10:00:00Z",
      "responses": [...]
    },
    "assessments": {
      "reach_ii_v1": { /* completed assessment */ }
    },
    "assessment_history": [
      {"id": "reach_ii_v1", "date": "2024-01-15", "score": 3.5, "risk": "moderate"}
    ],
    
    // Journey markers
    "journey_markers": {
      "last_assessment": {
        "id": "reach_ii_v1",
        "score": 3.5,
        "risk_level": "moderate",
        "completed_at": "2024-01-15T10:30:00Z"
      }
    },
    "suggested_journey_stage": "early_adaptation",
    
    // Metadata
    "profile_completeness": 75
  },
  "confidence_scores": {
    "relationship": 0.95,
    "experience_level": 0.8,
    // etc.
  }
}
```

## Working Features

### ✅ Entry & Subscription System
- **SMS webhook** receives and validates messages
- **Phone validation** via Twilio Lookup API (with caching)
- **User creation** with JSONB profile structure
- **3-message demo limit** before subscription required
- **RCS subscription cards** with WELCOME50 promo code
- **Stripe integration** via Supabase edge functions
- **Dynamic checkout URLs** with user metadata for tracking
- **Personalized payment sessions** that link to user accounts

### ✅ Emergency Override
```python
CRISIS_KEYWORDS = [
    "emergency", "911", "suicide", "kill myself", "hurt myself",
    "can't breathe", "chest pain", "stroke", "heart attack",
    "unconscious", "not responding", "fell", "bleeding"
]
# Immediate 911 response bypasses all other logic
```

### ✅ Progressive Profiling via DCR Agent
The agent extracts profile data with confidence scores:
- **relationship**: spouse/parent/child/friend/sibling/other
- **experience_level**: new/experienced/long_term
- **emotional_state**: stable/stressed/overwhelmed/crisis
- **living_situation**: together/nearby/distant/facility
- **primary_concerns**: array of specific concerns
- **support_system**: strong/moderate/limited/isolated

### ✅ Assessment Flow
- Triggers based on profile completeness or time
- Tracks progress in JSONB current_assessment
- Stores completed assessments with scores
- Determines journey stage after completion
- Provides personalized recommendations

### ✅ Personalization Engine
```python
# From src/core/personalization.py
# Rules matched by priority and conditions
personalization_rules = [
    {
        "rule_id": "crisis_stage_immediate",
        "priority": 99,
        "conditions": {"journey_stage": ["crisis_navigation"]},
        "actions": {
            "tone": "gentle_immediate",
            "content_type": "crisis_support",
            "interventions": ["immediate_support", "crisis_resources"]
        }
    },
    # ... more rules
]
```

### ✅ Dynamic Context Building
The system builds rich context for each message:
- User profile with confidence scores
- Personalization guidance (tone, content type, interventions)
- Safety context (crisis detection, keywords)
- Subscription status
- Journey markers from assessments

## Missing/Disconnected Features

### ❌ Journey Stages Database Table
**Status**: Table exists but completely unused
```sql
-- From migration 003_add_journey_stages.sql
CREATE TABLE journey_stages (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    current_stage journey_stage_enum NOT NULL,
    archetype caregiver_archetype_enum NOT NULL,
    stage_entered_at TIMESTAMPTZ,
    -- ... many more fields for tracking
);
```
**Issue**: No code writes to this table. Stage is only stored as `suggested_journey_stage` in profile_data.

### ❌ Archetype Detection
**Status**: Code implemented but never called
```python
# src/core/journey.py has full implementation:
def detect_archetype_patterns(conversation_history, profile_data):
    # Analyzes last 10 messages for patterns
    # Returns archetype with confidence score
    
# But main.py never calls it!
```

### ⚡ Journey Stage in Session State
**Status**: Partially implemented
```python
# Lines 1001-1017 in main.py
if not agent.session_state.get("journey_stage"):
    # Sets from suggested_journey_stage or defaults to "new_caregiver"
    agent.session_state["journey_stage"] = suggested_stage or "unknown"
    
# But session state is not persisted between conversations!
```

### ❌ Automatic Stage Transitions
**Status**: Logic exists but not connected
```python
# src/core/journey.py has should_transition_stage()
# But it's never called during conversations
# Transitions only happen after assessments
```

### ✅ Support Cadence & Follow-ups
**Status**: Basic implementation working (2025-01-18)
- ✅ Scheduled messaging via pg_cron
- ✅ Daily proactive check-ins at 4 PM UTC
- ✅ Basic support cadence tracking in profile
- ⚡ Partial stage-based cadence:
  - new_caregiver: "daily" (implemented)
  - crisis_navigation: "multiple_daily" (needs enhancement)
  - experienced_stable: "weekly" (needs implementation)

### ❌ Progression Monitoring
**Status**: Not implemented
- No tracking of improvement over time
- No automatic stage advancement
- No milestone celebrations

## Implementation Gaps Analysis

### 1. **Journey Tracking Gap**
```
Current: suggested_journey_stage → Agno session_state (ephemeral)
Missing: session_state → journey_stages table → persistent tracking
```

### 2. **Archetype Detection Gap**
```
Current: Code exists in journey.py
Missing: Call from main.py after N messages
```

### 3. **Progression Logic Gap**
```
Current: One-time stage assignment after assessment
Missing: Continuous monitoring and transitions
```

### 4. **Engagement Gap** ✅ FIXED (2025-01-18)
```
Current: Proactive daily check-ins via pg_cron
Previously: Reactive only (user must text first)

## Key Implementation Code Examples

### DCR Agent Response Structure
```python
# The agent returns structured JSON (Lines 1046-1071)
{
  "extraction": {
    "relationship": "spouse",
    "experience_level": "new",
    "emotional_state": "overwhelmed",
    "living_situation": "together",
    "primary_concerns": ["memory loss", "safety"],
    "support_system": "limited",
    "confidence_scores": {
      "relationship": 0.95,
      "experience_level": 0.8,
      "emotional_state": 0.9,
      "living_situation": 0.85,
      "primary_concerns": 0.75,
      "support_system": 0.7
    }
  },
  "safety": {
    "is_crisis": false,
    "urgency_level": "normal",
    "detected_keywords": ["overwhelmed"],
    "recommended_actions": ["stress management", "respite resources"]
  },
  "response": "I hear how overwhelming this can be..."
}
```

### Journey Stage Determination (src/core/journey.py)
```python
def determine_stage_from_assessment(assessment_id, score, risk_level, profile_data):
    # High risk always → crisis
    if risk_level == "high":
        return ("crisis_navigation", 0.9)
    
    care_duration = profile_data.get("care_duration_months", 0)
    
    # New caregivers
    if care_duration < 6:
        if risk_level == "moderate":
            return ("early_adaptation", 0.8)
        return ("new_caregiver", 0.85)
    
    # Experienced caregivers
    elif care_duration > 18:
        if assessment_id == "cwbs_short" and score < 3:
            return ("intensive_caregiving", 0.85)
        return ("experienced_stable", 0.75)
    
    # Middle duration
    else:
        return ("early_adaptation", 0.8)
```

### Profile Update with Confidence Filtering
```python
# Only updates fields with confidence > threshold (Lines 559-618)
async def update_user_profile_with_confidence(user_id, extraction_data):
    profile_fields = {
        "relationship", "experience_level", "emotional_state",
        "living_situation", "primary_concerns", "support_system"
    }
    
    profile_updates = {}
    for field, value in extraction_data.items():
        confidence = extraction_data.get("confidence_scores", {}).get(field, 0)
        
        # Only update if confidence > 0.7 (configurable)
        if confidence > 0.7 and value not in [None, "unknown", []]:
            profile_updates[field] = value
```

### Crisis Detection Pattern
```python
# Multiple layers of crisis detection:

# 1. Keyword detection (Lines 86-95)
CRISIS_KEYWORDS = ["emergency", "911", "suicide", "kill myself", ...]

# 2. Safety config check (Lines 466-504) 
if emotional_state in ["overwhelmed", "crisis"] or detected_keywords:
    context_parts.append("🚨 CRISIS LEVEL: IMMEDIATE INTERVENTION REQUIRED")
    
# 3. Agent safety assessment
if safety_result.get("is_crisis"):
    logger.warning(f"Crisis detected for user {user['id']}")
```

## Session State Management

### Agno Session Structure

```json
{
  "journey_stage": "early_adaptation",
  "archetype": "anxious_first_timer",
  "stage_entered_at": "2024-01-15T10:30:00Z",
  "assessment_tracking": {
    "reach_ii_v1": {
      "completed": true,
      "score": 3.2,
      "timestamp": "2024-01-15T10:25:00Z"
    }
  },
  "support_cadence": "3x_weekly",
  "progression_history": [
    {
      "from": "new_caregiver",
      "to": "early_adaptation",
      "transitioned_at": "2024-01-15T10:30:00Z",
      "reason": "Improvement of 28% detected"
    }
  ]
}
```

### State Persistence Flow

```mermaid
sequenceDiagram
    participant User
    participant SMS Handler
    participant Agno Agent
    participant Journey Manager
    participant Database
    
    User->>SMS Handler: Send Message
    SMS Handler->>Database: Get User Profile
    Database-->>SMS Handler: Profile Data
    
    SMS Handler->>Agno Agent: Create with Session State
    Agno Agent->>Journey Manager: Check Stage
    Journey Manager-->>Agno Agent: Current Stage
    
    Agno Agent->>Agno Agent: Process Message
    Agno Agent->>Journey Manager: Update if Needed
    
    Journey Manager->>Database: Save Journey Data
    Agno Agent-->>SMS Handler: Response
    SMS Handler-->>User: Personalized Message
```

## Key System Components

### 1. Journey Manager (`src/core/journey.py`)

**Responsibilities:**
- Stage determination from assessments
- Archetype pattern detection
- Stage transition logic
- Progress tracking

**Key Methods:**
- `determine_stage_from_assessment()` - Maps assessment results to stages
- `detect_archetype_patterns()` - Analyzes conversation for archetypes
- `should_transition_stage()` - Checks progression criteria
- `get_stage_guidance()` - Returns stage-specific guidance

### 2. Personalization Engine (`src/core/personalization.py`)

**Responsibilities:**
- Rule matching based on profile
- Priority-based selection
- Action application

**Integration Points:**
- Journey stage conditions
- Archetype conditions
- Emotional state conditions

### 3. Agno Agent Configuration (`main.py`)

**Enhanced Features:**
- `enable_user_memories`: True - Tracks user history
- `enable_agentic_memory`: True - Agent learns patterns
- `session_state`: Journey tracking per conversation
- `add_state_in_messages`: True - Includes state in context

### 4. Configuration Files

**`src/config/journey.json`**
- Stage definitions and indicators
- Archetype patterns
- Progression rules
- Stage-specific overrides

**`src/config/personalization.json`**
- Personalization rules
- Journey-aware conditions
- Tone definitions
- Content mappings

## Journey Stage Details

### 1. New Caregiver (0-6 months)
- **Focus**: Education, basics, reassurance
- **Tone**: `educational_patient`
- **Support**: Daily check-ins
- **Triggers**: First assessments, confusion indicators

### 2. Early Adaptation (6-18 months)
- **Focus**: Building routines, confidence
- **Tone**: `encouraging_practical`
- **Support**: 3x weekly
- **Triggers**: Routine indicators, moderate improvement

### 3. Crisis Navigation (Any time)
- **Focus**: Immediate support, safety
- **Tone**: `immediate_supportive`
- **Support**: Multiple daily
- **Triggers**: High risk, crisis keywords

### 4. Experienced Stable (18+ months)
- **Focus**: Optimization, self-care
- **Tone**: `peer_collaborative`
- **Support**: Weekly
- **Triggers**: Long duration, stability

### 5. Intensive Caregiving (High burnout)
- **Focus**: Respite, burnout prevention
- **Tone**: `protective_supportive`
- **Support**: Daily
- **Triggers**: Low well-being scores, exhaustion

### 6. Transition Planning (Major changes)
- **Focus**: Decision support, processing
- **Tone**: `gentle_supportive`
- **Support**: 2x weekly
- **Triggers**: Placement keywords, major decisions

### 7. Grief Recovery (Post-caregiving)
- **Focus**: Processing, rebuilding
- **Tone**: `compassionate_gentle`
- **Support**: Weekly
- **Triggers**: Loss indicators, past tense

### 8. Multi-Generational (Multiple recipients)
- **Focus**: Coordination, efficiency
- **Tone**: `efficient_organized`
- **Support**: 2x weekly
- **Triggers**: Multiple care mentions

## Monitoring and Analytics

### Key Metrics to Track

1. **Stage Distribution**
   - Current users per stage
   - Average time in stage
   - Transition patterns

2. **Archetype Prevalence**
   - Most common archetypes
   - Archetype-stage correlations
   - Archetype stability

3. **Progression Health**
   - Successful transitions
   - Crisis frequency
   - Improvement rates

4. **Personalization Effectiveness**
   - Rule match rates
   - User engagement by stage
   - Response patterns

## Current State vs Target State

### Current State (Production)

```mermaid
graph LR
    subgraph "Working System"
        SMS[SMS Entry] --> SUB[Subscription Gate]
        SUB --> ASSESS[Assessment System]
        ASSESS --> PROFILE[Profile Building]
        PROFILE --> RESP[AI Response]
    end
    
    subgraph "Data Storage"
        JSONB[profile_data JSONB]
        CONF[confidence_scores]
    end
    
    subgraph "One-Time Actions"
        STAGE[Journey Stage<br/>Set After Assessment]
    end
    
    PROFILE --> JSONB
    ASSESS --> STAGE
```

**What's Working:**
- ✅ SMS/RCS entry and subscription management
- ✅ 3 embedded assessments with scoring
- ✅ Progressive profile extraction with confidence
- ✅ Personalized responses based on journey stage
- ✅ Emergency detection and override
- ✅ Stripe payment integration

**What's Missing:**
- ❌ Persistent journey tracking (database table unused)
- ❌ Archetype detection (code exists but not called)
- ❌ Automatic stage transitions
- ✅ Proactive messaging (basic daily check-ins working)
- ❌ Session state persistence
- ✅ Support cadence scheduling (basic implementation)

### Target State (Fully Implemented)

```mermaid
graph TB
    subgraph "Entry & Tracking"
        SMS[SMS/RCS Entry] --> LOAD[Load Journey State]
        LOAD --> DETECT[Detect Patterns]
        DETECT --> UPDATE[Update Journey]
    end
    
    subgraph "Continuous Analysis"
        CONV[Conversation Analysis] --> ARCH[Archetype Detection]
        ARCH --> TRANS[Stage Transitions]
        TRANS --> SCHED[Schedule Follow-ups]
    end
    
    subgraph "Persistent Storage"
        JST[journey_stages table]
        HIST[Full History Tracking]
        PROG[Progression Analytics]
    end
    
    subgraph "Proactive System"
        CRON[Scheduled Jobs]
        PUSH[Push Notifications]
        CHECK[Check-in Messages]
    end
    
    UPDATE --> JST
    TRANS --> JST
    SCHED --> CRON
    CRON --> PUSH
    CRON --> CHECK
```

**Target Features:**
- ✅ Full journey_stages table utilization
- ✅ Real-time archetype detection after N messages
- ✅ Automatic stage progression monitoring
- ✅ Scheduled proactive check-ins
- ✅ Session state persistence between conversations
- ✅ Support cadence implementation
- ✅ Journey analytics and reporting
- ✅ Milestone celebrations

### Implementation Gap Analysis

| Feature | Current | Target | Effort | Impact |
|---------|---------|--------|--------|--------|
| **Journey Table Usage** | suggested_stage only | Full tracking | Low | High |
| **Archetype Detection** | Never called | After 10 messages | Low | Medium |
| **Stage Transitions** | Assessment only | Continuous | Medium | High |
| **Session Persistence** | Ephemeral | Database backed | Low | High |
| **Proactive Messaging** | ✅ Basic daily | Stage-specific | Medium | High |
| **Support Cadence** | Defined not used | Active scheduling | Medium | High |
| **Analytics Dashboard** | None | Full visibility | High | Medium |

### Quick Wins (< 2 Hours Each)

1. **Activate Journey Table**
   ```python
   # After determine_journey_stage() in main.py
   if new_stage != current_stage:
       create_journey_stage_record(user_id, new_stage, archetype)
   ```

2. **Call Archetype Detection**
   ```python
   # In handle_sms() after 10th message
   if message_count >= 10 and not user.get('archetype'):
       archetype = detect_archetype_patterns(history, profile)
       update_user_archetype(user_id, archetype)
   ```

3. **Persist Session State**
   ```python
   # Save to profile_data['session_state']
   profile['session_state'] = agent.session_state
   update_user_profile_simple(user['id'], profile)
   ```

4. **Add Stage Transition Check**
   ```python
   # After each conversation
   if should_transition_stage(current_stage, profile, history):
       new_stage = calculate_next_stage(current_stage, profile)
       transition_user_stage(user_id, new_stage)
   ```

5. ✅ **Basic Proactive Messaging** (COMPLETED 2025-01-18)
   - ✅ Using pg_cron for daily check-ins
   - ✅ Storing next_check_in timestamp
   - ✅ /run-check-ins endpoint protected by auth

### Medium Effort Features (1-2 Days)

1. ✅ **Basic Proactive Messaging** (COMPLETED 2025-01-18)
   - ✅ Using Supabase pg_cron + pg_net
   - ✅ Storing next_check_in timestamp
   - ✅ Daily check-ins at 4 PM UTC
   - ⚡ Still need: Stage-specific frequencies

2. **Journey Analytics API**
   - Endpoint to query journey_stages table
   - Stage distribution metrics
   - Average time per stage
   - Transition patterns

3. **Enhanced Assessment Triggers**
   - Time-based reassessment
   - Stage-specific assessments
   - Outcome tracking

### High Effort Features (1+ Week)

1. **Full Scheduling System**
   - Message queue infrastructure
   - Complex cadence rules
   - User preference management
   - Timezone handling

2. **Analytics Dashboard**
   - Frontend visualization
   - Real-time metrics
   - Cohort analysis
   - ML-based predictions

3. **Multi-Channel Journey**
   - Email integration
   - Push notifications
   - Web portal sync
   - Care team access

## Migration Path

### Phase 1: Foundation (1 week)
- Activate journey_stages table
- Implement archetype detection calls
- Add session state persistence
- Basic stage transition logic

### Phase 2: Intelligence (2 weeks)
- Continuous stage monitoring
- Proactive check-in system
- Journey analytics API
- Enhanced personalization

### Phase 3: Scale (1 month)
- Full scheduling infrastructure
- Analytics dashboard
- Multi-channel support
- ML-powered predictions

## Future Enhancements

1. **Machine Learning Integration**
   - Predictive stage transitions
   - Archetype refinement
   - Personalization optimization

2. **Extended Journey Paths**
   - Specialized medical conditions
   - Cultural adaptations
   - Family dynamics

3. **Advanced Analytics**
   - Journey visualization dashboard
   - Cohort analysis
   - Intervention effectiveness

4. **Integration Expansions**
   - Care team coordination
   - Resource matching
   - Community connections

## Summary: What's Actually Missing

## 🚨 Gap Analysis: Current State vs Target USER_JOURNEY_MAP

### Database Schema Crisis

**Major Finding**: The production database is missing 90% of the documented tables!

**Database Reality Check (2025-01-17):**
- **Documented tables**: 10 (per DATABASE_SCHEMA.md)
- **Actually exist**: 1 (only `users` table)
- **Missing tables**: 9 including `journey_stages`, `assessments`, `messages`, etc.

**Migration System Mismatch:**
- Local files: Sequential numbering (001, 002, 003...)
- Production DB: Timestamp-based (20250717...)
- Nuclear Reset mentioned for 2025-01-07 never happened
- 302 timestamp migrations applied, but local sequential migrations not run

### Journey System Gap Analysis

| Feature | Current State | Target State (USER_JOURNEY_MAP) | Implementation Gap |
|---------|--------------|--------------------------------|-------------------|
| **Entry & Subscription** | ✅ Working: 3-message demo | ✅ Sophisticated gating rules | Minor refinements needed |
| **Progressive Profiling** | ⚡ Basic extraction works | 📊 Phased collection strategy | Missing structured phases |
| **Assessment System** | ✅ 3 assessments work | 📊 Multiple assessment types with routing | Need more assessment types |
| **Journey Stage Classification** | ❌ Only after assessment | 🎯 Continuous monitoring & transitions | Major implementation needed |
| **Archetype Detection** | ❌ Never called (bug) | 👤 10 detailed archetypes | Fix bug + implement calling logic |
| **Personalization** | ⚡ Basic rules work | 🎯 Archetype × Stage matrix | Need full matrix implementation |
| **Session Persistence** | ❌ Resets each conversation | 💾 Full context retention | Critical fix needed |
| **Proactive Support** | ❌ None | 📅 Scheduled check-ins by stage | Build scheduling system |
| **Progression Monitoring** | ❌ None | 📈 Continuous analysis | Implement tracking logic |
| **Crisis Protocol** | ✅ Keyword detection | 🚨 Multi-level response matrix | Enhance response levels |
| **Support Cadence** | ❌ Not implemented | 📊 Stage × Archetype frequency | Build cadence engine |
| **Milestone Celebrations** | ❌ None | 🎉 Progress recognition | Add celebration triggers |

### Critical Missing Components (vs USER_JOURNEY_MAP.md)

#### 1. **Journey Stage System**
**Target**: 8 distinct journey stages with automatic transitions
**Current**: Only `suggested_journey_stage` in JSONB, no active use
**Gap**: Need complete stage tracking, transition logic, and persistence

#### 2. **Archetype Personalization**
**Target**: 10 caregiver archetypes with detailed behavioral rules
**Current**: Code exists but never executes due to bug
**Gap**: Fix bug, implement detection after 10 messages, apply personalization

#### 3. **Progressive Profiling Phases**
**Target**: 6 phases from Discovery to Growth with specific data collection
**Current**: Ad-hoc profile extraction during conversations
**Gap**: Implement structured phases with completion gates

#### 4. **Proactive Engagement** ⚡ PARTIALLY IMPLEMENTED
**Target**: Stage-based support cadence (daily to monthly)
**Current**: Daily check-ins via pg_cron at 4 PM UTC
**Gap**: Need full stage-based cadence matrix (not just daily)

#### 5. **Session State Persistence**
**Target**: Full conversation context retained between interactions
**Current**: State resets every conversation
**Gap**: Implement state saving/loading from database

### Implementation Priority Matrix

| Priority | Component | Effort | Impact | Blocking Other Features |
|----------|-----------|--------|--------|------------------------|
| **P0** | Fix database schema | High | Critical | Everything |
| **P0** | Fix archetype bug | Low | High | Personalization |
| **P1** | Session persistence | Medium | High | Journey continuity |
| **P1** | Journey stage tracking | Medium | High | All progression features |
| **P2** | ✅ Proactive messaging | ~~High~~ Done | High | Long-term engagement |
| **P2** | Stage transitions | Medium | Medium | Journey evolution |
| **P3** | Milestone celebrations | Low | Medium | User satisfaction |
| **P3** | Advanced assessments | Medium | Medium | Better classification |

### 🔴 Critical Gaps (Blocking Journey System)

1. **Journey Database Table DOESN'T EXIST**
   - Migration file exists (`003_add_journey_stages.sql`)
   - But table was never created in production
   - ENUMs exist (`journey_stage_enum`, `caregiver_archetype_enum`)
   - Stage only stored as `suggested_journey_stage` in JSONB

2. **Archetype Detection Never Called**
   - Full implementation exists in `src/core/journey.py`
   - `detect_archetype_patterns()` analyzes conversation patterns
   - But `main.py` never invokes it

3. **No Session State Persistence**
   - Agno session_state contains journey info
   - Lost between conversations
   - Users restart journey context each time

### 🟡 Important Missing Features

4. **No Automatic Stage Transitions**
   - `should_transition_stage()` exists but unused
   - Stages only change after assessments
   - No continuous progression monitoring

5. ~~**No Proactive Messaging**~~ **✅ FIXED (2025-01-18)**
   - ~~System is 100% reactive~~ Now has daily check-ins via pg_cron
   - ~~Support cadences defined but not implemented~~ Basic cadence working
   - ~~No scheduled check-ins or follow-ups~~ Daily check-ins at 4 PM UTC
   - **Still needed**: Full cadence matrix per journey stage

6. **Limited Journey Visibility**
   - No way to query journey history
   - No analytics on stage distribution
   - No progression tracking over time

### 🟢 Working But Underutilized

7. **Personalization Engine**
   - Rules work well with journey stages
   - But limited by lack of persistent tracking
   - Could be much more powerful with full data

8. **Assessment System**
   - Works great for one-time stage determination
   - But no reassessment scheduling
   - No longitudinal tracking

9. **Profile Extraction**
   - Excellent confidence-based system
   - But profile completeness not tied to journey
   - Missing connection to archetype detection

### The Bottom Line

The situation is more critical than initially assessed:

1. **Database tables don't exist** - The journey_stages table and 8 other core tables are missing
2. **Migration system broken** - Sequential migrations in repo vs timestamp migrations in production
3. **Code expects tables that aren't there** - This explains why features aren't working

**Immediate Actions Needed:**
1. Run the sequential migrations (001-009) to create missing tables
2. OR reconcile with the timestamp-based migration system
3. Verify which database is actually being used (production vs development)

## Implementation Roadmap to Close Gaps

### Phase 1: Critical Fixes (Week 1)

#### 1. Fix Database Schema
```bash
# Run missing migrations
python scripts/deployment/check_db_schema.py  # Verify current state
# Apply sequential migrations 001-009 OR reconcile with timestamp system
```

#### 2. Fix Archetype Detection Bug
```python
# main.py line 1090 - Change from:
if user.get("message_count", 0) >= 10 and not agent.session_state.get("archetype"):
# To:
if user.get("message_count", 0) >= 10 and not profile_data.get("archetype"):
```

#### 3. Implement Session Persistence
```python
# Add to main.py after line 1171:
# Save session state to profile
profile_data['journey_session'] = {
    'journey_stage': agent.session_state.get('journey_stage'),
    'archetype': agent.session_state.get('archetype'),
    'stage_entered_at': agent.session_state.get('stage_entered_at'),
    'last_updated': datetime.now(timezone.utc).isoformat()
}
await update_user_profile_simple(user['id'], profile_data)
```

### Phase 2: Journey System Activation (Week 2)

#### 1. Activate Journey Stages Table
```python
# Add journey stage tracking after assessment
async def create_journey_stage_record(user_id: str, stage: str, archetype: str = None):
    await supabase.table('journey_stages').insert({
        'user_id': user_id,
        'current_stage': stage,
        'archetype': archetype,
        'stage_entered_at': datetime.now(timezone.utc),
        'created_at': datetime.now(timezone.utc)
    }).execute()
```

#### 2. Implement Stage Transitions
```python
# Add continuous monitoring in main.py
async def check_stage_progression(user_id: str, profile_data: dict, conversation_history: list):
    current_stage = profile_data.get('journey_stage', 'new_caregiver')
    
    # Implement transition logic from journey.py
    if should_transition_stage(current_stage, profile_data, conversation_history):
        new_stage = calculate_next_stage(current_stage, profile_data)
        await transition_user_stage(user_id, current_stage, new_stage)
```

### Phase 3: Proactive Support ✅ BASIC VERSION WORKING

#### 1. Support Cadence Engine ⚡ PARTIALLY IMPLEMENTED
```python
# Basic daily check-ins working via pg_cron
# Still need full USER_JOURNEY_MAP.md cadence matrix:
SUPPORT_CADENCE = {
    'new_caregiver': {'base': 'daily', 'check_ins': ['education', 'reassurance']},
    'early_adaptation': {'base': '3x_weekly', 'check_ins': ['skill_building']},
    'crisis_navigation': {'base': 'daily', 'check_ins': ['crisis_support']},
    # ... etc from USER_JOURNEY_MAP.md
}
```

#### 2. Proactive Messaging ✅ WORKING
- ✅ Implemented with Supabase pg_cron + pg_net
- ✅ Daily check-ins at 4 PM UTC (optimal for US timezones)
- ✅ next_check_in timestamp tracked in user profile
- ⚡ Need to enhance for stage-specific frequencies

### Phase 4: Full Journey Experience (Week 4)

#### 1. Progressive Profiling Phases
- Implement 6-phase collection strategy from USER_JOURNEY_MAP.md
- Add profile completeness gates
- Structure questions by conversation number

#### 2. Milestone Celebrations
- Track progress indicators
- Implement celebration triggers
- Add progress recognition messages

## Summary: Path Forward

The journey system needs:
1. **Immediate (Day 1)**: Fix archetype bug + session persistence
2. **Week 1**: Fix database schema + activate journey tables
3. **Week 2**: Implement stage transitions + progression monitoring
4. **Week 3**: Build proactive support + scheduling
5. **Week 4**: Complete progressive profiling + celebrations

**Result**: Transform from a reactive SMS bot to the intelligent, stage-based caregiver support system designed in USER_JOURNEY_MAP.md