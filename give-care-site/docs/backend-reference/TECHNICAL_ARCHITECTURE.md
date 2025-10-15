# GiveCare Technical Architecture

## 🏗️ **System Overview**
SMS-first caregiving support platform built on FastAPI + Agno + Supabase stack for scalable, conversational AI experiences.

## 📋 **Core Stack**
- **Backend**: FastAPI with async/await patterns
- **AI Framework**: Agno v2 for agent orchestration and memory
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Memory**: PostgresMemoryDb for session state and conversation history
- **Authentication**: Phone-based user creation (no traditional auth)
- **Payments**: Stripe via Supabase Edge Functions
- **SMS**: Twilio for message delivery and webhooks
- **Models**: 
  - Primary: Azure OpenAI GPT-4.1-prod (SMS responses)
  - Guardrails: GPT-4.1-nano-prod (safety checks)
  - Reasoning: o4-mini (background analysis)
- **Observability**: Phoenix (self-hosted) for tracing

## 🧠 **Agent Architecture**

### **Primary Agent: Caregiving Support**
```python
support_agent = Agent(
    name="GiveCare Support Agent",
    role="Compassionate caregiving advisor",
    instructions=[
        "Provide empathetic, practical caregiving advice",
        "Respect user autonomy and privacy",
        "Deliver immediate value before asking for more information",
        "Use progressive profiling to learn gradually"
    ],
    response_model=CaregivingResponse,
    tools=[extract_profile, get_local_resources, crisis_detection],
    memory=PostgresMemoryDb(table_name="caregiver_conversations"),
    enable_agentic_memory=True,
    add_datetime_to_instructions=True
)
```

### **Specialized Agents**
- **Profile Extraction**: Fast model (gpt-4.1-nano-prod) for structured data
- **Crisis Detection**: Immediate safety assessment and escalation
- **Resource Matching**: Location-based service and facility recommendations
- **Deep Reasoning**: o4-mini for complex analysis (background processing)

### **Hybrid Reasoning Architecture**
```python
# Main SMS agent (must respond in <15 seconds)
main_agent = Agent(
    model=gpt_4_1_prod,
    reasoning=False,  # Prevent timeout issues
    tools=[
        ReasoningTools(think=True, analyze=False),  # Quick reasoning
        analyze_care_situation,  # Queues complex questions
    ]
)

# Background reasoning processor (no timeout)
reasoning_agent = Agent(
    name="DeepReasoningAgent",
    model=o4_mini,
    instructions=["Thorough care situation analysis"],
    max_completion_tokens=1200
)
```

**Flow**: SMS → Quick response → Queue complex task → Background analysis → Follow-up SMS

## 🗄️ **Database Schema**

### **Core Tables**
```sql
-- User profiles with integrated Stripe subscription tracking
users (
    id uuid PRIMARY KEY,
    phone_number text UNIQUE,
    name text,
    email text,
    location text,
    age integer,                      -- Renamed from user_age for consistency
    energy_level integer,
    family_members text,
    notes text,
    created_at timestamp,
    onboarding_completed boolean DEFAULT false,
    subscription_status text DEFAULT 'inactive',
    stripe_customer_id text,          -- Direct Stripe integration (Option 1)
    stripe_subscription_id text,      -- Direct Stripe integration (Option 1)
    last_active timestamp,
    message_count integer DEFAULT 0
)

-- Care recipient information
care_recipients (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    name text,
    relationship text,
    age integer,
    medical_conditions text,
    location text,
    notes text,
    created_at timestamp,
    updated_at timestamp
)

-- Stripe webhook event tracking (simplified approach)
stripe_events (
    id text PRIMARY KEY,
    type text,
    payload jsonb,
    processed_at timestamp DEFAULT now()
)

-- Background reasoning tasks (o4-mini)
reasoning_tasks (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    phone_number text NOT NULL,
    topic text,
    question text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp,
    completed_at timestamp,
    result text,
    error_message text
)

-- Agent memory tables (managed by Agno)
agent_memory          -- Conversation history
agent_sessions        -- Session state
caregiver_text_documents  -- Knowledge base
```

### **Stripe Integration Architecture (Option 1 - Simplified)**
**Design Choice**: Store Stripe IDs directly in users table rather than separate normalization
- **Benefits**: Fewer joins, simpler queries, reduced complexity, single source of truth
- **Tradeoffs**: Slight denormalization but significant operational simplicity
- **Webhook Flow**: Stripe event → Edge Function → Direct users table update
- **Status Tracking**: Single subscription_status field handles all subscription states

### **Row Level Security (RLS)**
All tables have RLS enabled with specific policies:
- **service_role**: Full access to all webhook tables for Stripe integration
- **authenticated**: User-scoped access to own data  
- **public**: No direct access (all operations through service or authenticated roles)

### **Memory Management**
- **Session Memory**: Short-term conversation context
- **User Memory**: Progressive profile data and preferences
- **Conversation History**: Full message logs for continuity
- **Agent Memory**: Tool usage patterns and successful strategies

## 🔄 **Progressive Profiling System**

### **Proactive Data Collection Strategy**
```python
# Automatic profile detection keywords
PROFILE_INDICATORS = [
    "i'm", "my name", "i am", "call me", "i live", "my mom", "my dad", 
    "my wife", "my husband", "years old", "has diabetes", "alzheimer", 
    "dementia", "cancer", "stroke", "email", "location", "city"
]

# Profile extraction flow
if has_profile_indicators:
    # Attempt to extract user profile
    user_result = await extract_profile(phone_number, "user", message)
    # Attempt to extract care recipient profile  
    recipient_result = await extract_profile(phone_number, "recipient", message)
    # Mark onboarding complete when basic profile exists
```

### **Profiling Logic**
- **Automatic Detection**: Every message scanned for profile information
- **Dual Extraction**: Attempts both user and care recipient profile extraction
- **Immediate Capture**: Profile data stored as soon as detected
- **Completion Tracking**: Onboarding marked complete when name + (email OR location) provided
- **User Feedback**: Confirmation shown when profile data is captured
- **Value-First**: Always provide help while collecting information

## 🚨 **Crisis Detection & Safety**

### **Guardrails Pipeline**
1. **Immediate Safety Check**: Emergency keywords and urgent language (Verdict enum values must be lowercase)
2. **Medical Disclaimer**: Clear boundaries on medical advice
3. **Resource Escalation**: Professional referrals for complex needs
4. **Documentation**: Audit trail for safety-related interactions

### **Crisis Response Flow**
```python
if crisis_detected:
    # Immediate response with emergency resources
    response = generate_crisis_response(severity_level)
    # Log for review and follow-up
    log_crisis_interaction(user_id, crisis_type, response)
    # Optional: Human escalation for high-severity cases
```

## 📱 **SMS Integration**

### **Twilio Webhook Processing**
```python
@app.post("/webhook/sms")
async def handle_sms(request: TwilioSMSRequest):
    # Validate webhook signature
    # Extract user context and conversation history
    # Process through agent pipeline
    # Send response via Twilio
    # Update conversation state
```

### **Message Flow**
1. **Incoming SMS** → Webhook validation → User lookup
2. **Context Retrieval** → Memory loading → Agent processing
3. **Response Generation** → Safety checks → Outbound SMS
4. **State Update** → Memory persistence → Analytics logging

## ⚡ **Performance Patterns**

### **Async Architecture**
```python
# All I/O operations use async/await
async def process_user_message(phone: str, message: str):
    user = await get_user_async(phone)
    memory = await load_conversation_memory(user.id)
    response = await agent.run_async(message, memory=memory)
    await send_sms_async(phone, response.content)
    await update_memory_async(user.id, response.memory)
```

### **Database Optimization**
- **Singleton Pattern**: Single global Supabase client (50-70% fewer connections)
- **Atomic Operations**: Upserts with on_conflict for race condition prevention
- **Batch Updates**: Combined profile operations in single transaction
- **Indexing**: Phone numbers, user IDs, reasoning task status
- **Foreign Keys**: reasoning_tasks → users for data integrity
- **RLS Policies**: service-role policies on all webhook tables (users, stripe_events)

## 🔐 **Security & Privacy**

### **Data Protection**
- **Encryption**: TLS for all communications
- **Storage**: Encrypted fields for sensitive data
- **Access Control**: RLS policies per user
- **Audit Logging**: All profile updates and sensitive operations

### **Input Validation**
```python
# Pydantic models for all inputs
class SMSWebhookRequest(BaseModel):
    From: str = Field(..., regex=r'^\+\d{10,15}$')
    Body: str = Field(..., max_length=1600)
    MessageSid: str
```

## 🔧 **Development Patterns**

### **File Organization**
```
main.py                 # FastAPI app + SMS webhook handler
reasoning_processor.py  # Background o4-mini task processor
utils/
├── db.py              # Singleton Supabase client
├── models.py          # Pydantic data models
├── profile_manager.py # Profile extraction & management
├── profile_batch.py   # Batch profile operations
├── guardrails.py      # Safety and emergency detection
├── validators.py      # Phone & text sanitization
├── subscription_enforcer.py  # Subscription checks
└── stripe_toolkit.py  # Subscription management tools
```

### **Agent Patterns**
- **One agent per task**: Focused, single-responsibility agents
- **Explicit memory**: Never assume shared state
- **Structured outputs**: Pydantic models for all responses
- **Error handling**: Graceful degradation for failed tools
- **Testing isolation**: Each agent testable independently

### **Code Standards**
- **Type hints**: Full typing for all functions
- **Async by default**: Use asyncio for all I/O
- **Minimal dependencies**: Only essential packages
- **Structured logging**: Python logging over print()
- **Environment config**: All secrets in environment variables

## 📊 **Monitoring & Observability**

### **Phoenix Arize Observability Platform**

**Self-Hosted Phoenix Instance:**
- **URL**: https://admin.givecareapp.com (Cloudflare proxy)
- **Container**: `phoenix-admin.livelybush-dbb26c32.eastus.azurecontainerapps.io`
- **Infrastructure**: Azure Container Apps (East US)
- **Image**: `arizephoenix/phoenix:latest` from Docker Hub
- **Persistence**: Azure File Share `phoenix-fresh` mounted at `/data`
- **Database**: SQLite with WAL mode in persistent storage: `/data/phoenix.db`

**Phoenix Configuration:**
```yaml
Environment:
  PHOENIX_HOST: 0.0.0.0
  PHOENIX_PORT: 80                    # Cloudflare integration
  PHOENIX_ENABLE_AUTH: true
  PHOENIX_SECRET: x8gWF68cPo29Sm6zybGGtq2O+s1cwde5mKKROKRlYNI=
  PHOENIX_GRPC_PORT: 4317            # OpenTelemetry OTLP ingestion
  PHOENIX_SQL_DATABASE_URL: sqlite:////data/phoenix.db?mode=rwc&cache=shared&_journal_mode=WAL

Network:
  Custom Domain: admin.givecareapp.com
  SSL: Managed certificate via Azure
  CDN: Cloudflare proxy
  
Storage:
  Volume: phoenix-storage → Azure File Share (phoenix-fresh)
  Mount: /data
  Database: /data/phoenix.db (persistent across restarts)
  Size: 100GB quota
```

**Application Telemetry Integration:**
```python
# OpenTelemetry → Phoenix configuration
tracer_provider = register(
    project_name="givecare-prod",
    endpoint=f"{os.getenv('PHOENIX_COLLECTOR_ENDPOINT')}/v1/traces",
    batch=True,
    auto_instrument=True,
    headers={"api_key": os.getenv("PHOENIX_API_KEY")}
)

# Agno instrumentation
AgnoInstrumentor().instrument(tracer_provider=tracer_provider)
```

**Trace Collection:**
- **Agent Conversations**: Full conversation flows with tools and memory
- **SMS Processing**: Twilio webhook → response latency tracking  
- **Database Operations**: Supabase query performance and errors
- **External API Calls**: Azure OpenAI, SerpAPI, Stripe interactions
- **Error Tracking**: Exception traces with full stack context

**Recent Fixes & Troubleshooting:**
- **✅ FIXED (2025-06-15)**: Database persistence issue resolved - moved from ephemeral `/phoenix.db` to persistent `/data/phoenix.db`
- **✅ FIXED (2025-06-15)**: API key authentication - Phoenix migrated existing API keys to persistent storage, no user action required
- **Authentication**: Create API keys through Phoenix web UI, update `PHOENIX_API_KEY` environment variable
- **Database Location**: Now properly stored in Azure File Share for full persistence
- **Container Restarts**: Data now persists across all restarts and deployments
- **Log Access**: Use `az containerapp logs show --name phoenix-admin --resource-group givecare-prod`
- **Current Revision**: `phoenix-admin--0000043` (persistence fix deployed)

**Deployment History:**
- **2025-06-13 18:10 UTC**: Container redeployed (revision 42), database reset due to ephemeral storage causing trace loss
- **2025-06-15 13:29 UTC**: **PERSISTENCE FIX** deployed (revision 43), database moved to Azure File Share for permanent data retention

### **Key Metrics Tracked**
- **Response Time**: SMS processing latency (p50, p95, p99)
- **Agent Performance**: Tool success rates and failure modes
- **User Engagement**: Message frequency and session depth  
- **System Health**: Database performance and error rates
- **Trace Volume**: Daily trace ingestion and storage growth

### **Logging Strategy**
```python
logger.info("SMS received", extra={
    "user_id": user.id,
    "message_length": len(message),
    "session_id": session.id,
    "trace_id": trace.get_current_span().get_span_context().trace_id
})
```

### **Error Handling**
- **Graceful Degradation**: Basic responses when advanced features fail
- **User Communication**: Friendly error messages
- **Developer Visibility**: Structured error logging with context + Phoenix traces
- **Recovery Mechanisms**: Retry logic for transient failures

---

## 📚 **Related Documentation**
- **[PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)** - Strategic context and priorities
- **[FEATURE_SPECIFICATIONS.md](FEATURE_SPECIFICATIONS.md)** - Feature implementation details
- **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - Code standards and patterns
- **[OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)** - Production deployment and monitoring

*Architecture prioritizes user experience reliability over technical complexity.*