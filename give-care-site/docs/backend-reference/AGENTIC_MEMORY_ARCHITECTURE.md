# Agentic Memory Architecture

## Overview

The GiveCare SMS assistant implements a **hybrid agentic memory approach** that combines intelligent conversational memory with structured database persistence. This architecture provides both robust context awareness and reliable data storage.

## Architecture Components

### 1. Agentic Memory System (`utils/agentic_memory.py`)

**Core Functions:**
- **Intelligent Context Awareness**: Agents remember conversation context across sessions
- **Automatic Profile Extraction**: LLM-powered extraction from natural conversation
- **Memory Search & Retrieval**: Contextual search for relevant past interactions
- **Background Database Sync**: Async synchronization of memory to structured database

**Key Features:**
```python
# Enable agentic memory in agent
agent = Agent(
    name="CaregivingAssistant",
    model=azure_model,
    enable_agentic_memory=True,
    enable_user_memories=True,
    knowledge=combined_kb
)
```

### 2. Hybrid Processing (`utils/hybrid_processor.py`)

**Dual Approach:**
- **Primary**: Agentic memory processing with conversation continuity
- **Fallback**: Manual profile extraction for reliability
- **Validation**: Cross-reference between memory and database profiles

**Workflow:**
1. Process message with agentic memory
2. Extract structured data from memory 
3. Sync to database in background
4. Validate consistency between sources

### 3. Database Integration

**Structured Persistence:**
- **Users Table**: `name`, `email`, `location`, `onboarding_completed`
- **Care Recipients Table**: `name`, `relationship`, `age`, `medical_conditions`
- **Race Condition Protection**: PostgreSQL upserts prevent data conflicts

**Sync Architecture:**
- **Immediate**: Critical structured data written directly to database
- **Background**: Memory content synced asynchronously
- **Eventual Consistency**: Memory and database converge over time

## Benefits vs. Tradeoffs

### ✅ **Benefits**

**Enhanced Context Awareness:**
- Agents remember user preferences and care recipient details
- Conversation flows naturally with historical context
- Reduces repetitive information gathering

**Intelligent Extraction:**
- LLM automatically identifies profile information in natural conversation
- Adapts to various communication styles and patterns
- Learns from conversation context rather than keyword matching

**Graceful Degradation:**
- System works even if memory service fails
- Fallback to manual extraction ensures reliability
- No data loss if sync fails

**Improved User Experience:**
- More natural, context-aware conversations
- Reduced onboarding friction
- Personalized responses based on care situation

### ⚠️ **Tradeoffs**

**Increased Complexity:**
- More components to monitor and maintain
- Sync architecture requires careful error handling
- Testing requires comprehensive mocking strategies

**Eventual Consistency:**
- Memory updates may lag database writes
- Potential temporary inconsistencies between sources
- Requires validation and reconciliation processes

**Resource Usage:**
- Additional memory storage requirements
- Background sync processes consume resources
- LLM calls for structured extraction

## Implementation Details

### Memory Processing Flow

```python
async def process_message_with_memory(phone_number: str, message: str, agent: Agent) -> str:
    # 1. Search for relevant memories
    relevant_memories = await search_relevant_memories(agent, phone_number, message)
    
    # 2. Build context from memories
    memory_context = build_context_from_memories(relevant_memories)
    
    # 3. Process with context
    response = await agent.arun(f"{memory_context}\n\n{message}", user_id=phone_number)
    
    # 4. Add interaction to memory
    await add_memory_with_sync(agent, phone_number, interaction, metadata)
    
    return response.content
```

### Database Synchronization

```python
async def sync_memory_to_database(phone_number: str, agent: Agent) -> bool:
    # Extract structured data from memory
    user_profile, care_recipient = await extract_structured_data_from_memory(agent, phone_number)
    
    # Update database tables
    if user_profile:
        await update_user_profile_from_memory(phone_number, user_profile)
    if care_recipient:
        await update_care_recipient_profile_from_memory(phone_number, care_recipient)
    
    return True
```

### Hybrid Message Processing

```python
async def process_message_hybrid(phone_number: str, message: str, agent: Agent) -> str:
    results = []
    
    # Try agentic memory first
    try:
        memory_response = await process_message_with_memory(phone_number, message, agent)
        results.append(f"Memory-aware response: {memory_response}")
        asyncio.create_task(sync_memory_to_database(phone_number, agent))
    except Exception:
        results.append("Memory processing unavailable")
    
    # Always run manual extraction as backup
    try:
        profile_extracted, feedback = await process_profile_extraction(phone_number, message)
        if profile_extracted:
            results.append(f"Profile extraction: {feedback}")
    except Exception:
        results.append("Profile extraction unavailable")
    
    return "\n".join(results)
```

## Configuration & Setup

### Environment Variables

```bash
# Enable agentic memory features
ENABLE_AGENTIC_MEMORY=true
ENABLE_USER_MEMORIES=true

# Memory storage configuration
MEMORY_STORAGE_TYPE=persistent  # or ephemeral
MEMORY_SYNC_INTERVAL=300       # seconds

# Database configuration for sync
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Agent Configuration

```python
# Build agent with memory capabilities
def build_agent_with_memory() -> Agent:
    model = AzureOpenAI(
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION")
    )
    
    return Agent(
        name="CaregivingAssistant",
        model=model,
        enable_agentic_memory=True,
        enable_user_memories=True,
        knowledge=build_knowledge_base(),
        tools=[...],  # Profile extraction tools as fallback
        # Memory will automatically store user interactions
        # and enable context-aware responses
    )
```

## Testing Strategy

### Integration Tests (`test_agentic_memory_integration.py`)

**Memory Workflow Testing:**
- Message processing with memory context
- Profile extraction from conversation memory
- Database synchronization workflows
- Error handling and fallback mechanisms

**Hybrid Processing Testing:**
- Combined memory + manual extraction
- Fallback to manual methods when memory fails
- Consistency validation between sources

**Mock Strategy:**
```python
# Mock agent with memory interface
mock_agent = MagicMock()
mock_memory = MagicMock()
mock_memory.search_memories = AsyncMock(return_value=[...])
mock_memory.add_memory = AsyncMock()
mock_agent.memory = mock_memory
```

## Performance Considerations

### Memory Efficiency
- **Selective Storage**: Only store relevant conversation context
- **Periodic Cleanup**: Remove old memories based on retention policy
- **Compression**: Summarize long conversation histories

### Sync Optimization
- **Batch Updates**: Group database updates to reduce transaction overhead
- **Smart Diffing**: Only sync changed profile data
- **Retry Logic**: Handle temporary database unavailability

### Monitoring & Observability
- **Memory Usage Tracking**: Monitor memory storage consumption
- **Sync Success Rates**: Track successful database synchronizations
- **Fallback Frequency**: Monitor how often fallback mechanisms activate

## Future Enhancements

### Advanced Memory Features
- **Semantic Clustering**: Group related memories by topic
- **Importance Scoring**: Prioritize memories by relevance and recency
- **Cross-User Insights**: Learn patterns across anonymous user base

### Enhanced Sync Mechanisms
- **Real-Time Sync**: Immediate sync for critical profile changes
- **Conflict Resolution**: Handle conflicting updates between memory and manual extraction
- **Audit Trail**: Track all profile changes with timestamps and sources

### AI-Powered Improvements
- **Intent Recognition**: Better understanding of user needs from context
- **Proactive Suggestions**: Offer relevant information based on memory patterns
- **Personalized Onboarding**: Adapt onboarding flow based on user communication style

## Security & Privacy

### Data Protection
- **Memory Encryption**: Encrypt stored memories at rest
- **Access Controls**: Restrict memory access to authorized components
- **Data Retention**: Automatic deletion of old memories per privacy policy

### HIPAA Compliance
- **PHI Handling**: Careful handling of protected health information in memories
- **Audit Logging**: Track all access to medical information
- **User Consent**: Clear consent for memory storage and usage

The hybrid agentic memory approach represents a significant advancement in conversational AI for caregiving, providing both the intelligence of modern LLMs and the reliability required for production healthcare applications.