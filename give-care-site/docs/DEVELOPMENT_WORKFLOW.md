# GiveCare Development Workflow

## 🎯 **Development Philosophy**
Build with empathy for both users (caregivers) and future developers. Code should be as caring and thoughtful as the product itself.

## 🏗️ **Code Architecture Patterns**

### **Agent Structure Standards**
```python
# Define one agent per task with clear responsibilities
support_agent = Agent(
    name="Clear, descriptive name",
    role="Specific role description", 
    instructions=[
        "Use bullet points for clear instructions",
        "Scope instructions to specific outcomes",
        "Be explicit about expected behavior"
    ],
    response_model=StructuredOutputModel,  # Always use Pydantic models
    tools=[relevant_tools_only],  # Enable only needed tools
    memory=explicit_memory_config,  # Never assume shared state
    agent_id="unique_identifier",  # Match storage table names
    enable_agentic_memory=True,
    add_datetime_to_instructions=True
)
```

### **Memory Management**
```python
# Memory is always passed explicitly, never hardcoded
memory_manager = MemoryManager(
    db=PostgresMemoryDb(connection_string=DATABASE_URL),
    table_name="agent_conversations"
)

# Wrap agent state with appropriate storage
agent_storage = PostgresAgentStorage(
    db_url=DATABASE_URL,
    table_name="agent_states"
)
```

### **File Organization**
```
main.py                 # FastAPI app + primary agent definition
utils/
├── models.py          # Pydantic data models only
├── memory.py          # Memory management classes
├── profiling.py       # Progressive profiling pure logic
├── guardrails.py      # Safety and medical disclaimers
├── database.py        # Supabase client and async queries
└── ai.py              # AI service configurations
tests/
├── unit/              # Individual function tests
├── integration/       # Agent workflow tests
└── e2e/               # Full SMS conversation tests
```

### **Import Standards**
```python
# Group imports: stdlib, third-party, internal
import asyncio
import os
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field
from agno import Agent
from supabase import create_client

from utils.models import UserProfile, CaregivingResponse
from utils.memory import MemoryManager
from utils.profiling import next_missing_field
```

---

## 🧪 **Testing Strategy**

### **Test Categories**
```python
# Unit Tests: Individual functions and classes
def test_profile_extraction():
    """Test that profile data is correctly extracted from messages."""
    message = "Hi, I'm Sarah and I need help with my mom"
    result = extract_profile_data(message)
    assert result.name == "Sarah"
    assert result.relationship == "daughter"

# Integration Tests: Agent workflows
async def test_progressive_profiling_flow():
    """Test complete profiling conversation flow."""
    agent = create_test_agent()
    
    # First interaction - capture basic info
    response1 = await agent.run("Hi, I'm John, my dad fell")
    assert "John" in response1.memory.get("user_name")
    
    # Second interaction - location profiling
    response2 = await agent.run("We're in Boston")
    assert "Boston" in response2.memory.get("location")

# E2E Tests: Full SMS conversation
async def test_sms_webhook_flow():
    """Test complete SMS processing pipeline."""
    webhook_data = {
        "From": "+1234567890",
        "Body": "I need help with my mom",
        "MessageSid": "test123"
    }
    
    response = await client.post("/webhook/sms", data=webhook_data)
    assert response.status_code == 200
    assert "helpful" in response.text
```

### **Testing Commands**
```bash
# Run all tests with coverage
pytest --cov=utils --cov-report=html

# Run specific test categories
pytest tests/unit/ -v
pytest tests/integration/ -v  
pytest tests/e2e/ -v

# Test with different environments
pytest --env=staging
pytest --env=production --dry-run

# Load testing
locust -f tests/load_test.py --host=http://localhost:8000
```

### **Test Data Management**
```python
# Use factories for consistent test data
@pytest.fixture
def sample_user():
    return {
        "id": "test-user-123",
        "phone_number": "+1234567890",
        "name": "Test User",
        "profile_completion": 0.6
    }

# Clean database state between tests
@pytest.fixture(autouse=True)
async def clean_test_data():
    await cleanup_test_users()
    yield
    await cleanup_test_users()
```

---

## 🔄 **Git Workflow**

### **Branch Strategy**
```bash
main                    # Production-ready code
├── develop            # Integration branch
├── feature/user-auth  # Feature branches
├── bugfix/sms-delay   # Bug fixes
└── hotfix/security    # Emergency fixes
```

### **Commit Standards**
```bash
# Format: type(scope): description
feat(profiling): add progressive data collection
fix(sms): resolve webhook timeout issues
docs(api): update endpoint documentation
test(memory): add agent state persistence tests
refactor(auth): simplify user validation logic

# Include context in commit body
git commit -m "feat(crisis): add emergency detection

- Implement keyword-based crisis detection
- Add emergency resource responses  
- Include safety escalation protocols
- Update agent instructions for crisis handling

Closes #123"
```

### **Code Review Process**
1. **Create Feature Branch**: `git checkout -b feature/description`
2. **Implement Changes**: Following code standards
3. **Write Tests**: Unit, integration, and e2e as needed
4. **Self Review**: Check diff, run tests locally
5. **Create Pull Request**: Clear title and description
6. **Address Feedback**: Respond to review comments
7. **Merge**: Squash commits for clean history

---

## 📋 **Code Standards**

### **Python Style**
```python
# Use type hints for all functions
async def process_user_message(
    phone: str, 
    message: str, 
    session_id: Optional[str] = None
) -> CaregivingResponse:
    """Process incoming user message and generate response."""
    pass

# Pydantic models for all data structures
class UserProfile(BaseModel):
    name: Optional[str] = Field(None, description="User's preferred name")
    relationship: Optional[str] = Field(None, description="Relationship to care recipient")
    location: Optional[str] = Field(None, description="City/state for local resources")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Sarah",
                "relationship": "daughter", 
                "location": "Chicago, IL"
            }
        }

# Async by default for all I/O operations
async def get_user_profile(user_id: str) -> Optional[UserProfile]:
    """Retrieve user profile from database."""
    result = await supabase.table("users").select("*").eq("id", user_id).execute()
    return UserProfile(**result.data[0]) if result.data else None
```

### **Error Handling**
```python
# Structured exception handling
class GiveCareException(Exception):
    """Base exception for GiveCare application."""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)

class ProfileExtractionError(GiveCareException):
    """Raised when profile data cannot be extracted."""
    pass

# Graceful degradation
async def extract_profile_with_fallback(message: str) -> UserProfile:
    try:
        return await extract_profile_structured(message)
    except ProfileExtractionError:
        logger.warning("Structured extraction failed, using basic parsing")
        return extract_profile_basic(message)
    except Exception as e:
        logger.error(f"Profile extraction failed: {e}")
        return UserProfile()  # Return empty profile
```

### **Logging Standards**
```python
import logging
import structlog

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Log with context
logger.info(
    "SMS message processed",
    user_id=user.id,
    message_length=len(message),
    processing_time_ms=processing_time,
    agent_tools_used=tools_used,
    session_id=session.id
)

# Error logging with full context
logger.error(
    "Profile extraction failed",
    user_id=user.id,
    message_preview=message[:50],
    error_type=type(e).__name__,
    error_message=str(e),
    stack_trace=traceback.format_exc()
)
```

---

## 🚀 **Deployment Process**

### **Environment Management**
```bash
# Development
cp .env.example .env.dev
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt

# Staging
docker build -t givecare:staging .
docker run --env-file .env.staging givecare:staging

# Production
# Use CI/CD pipeline with automated testing
# Deploy only after all tests pass
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy GiveCare
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest --cov=utils
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy only if tests pass
          ./deploy.sh production
```

### **Database Migrations**
```python
# Use Supabase migrations for schema changes
# migrations/001_initial_schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

# Apply migrations
supabase db push
```

---

## 📊 **Performance Guidelines**

### **Database Optimization**
```python
# Use indexes for frequent queries
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

# Optimize queries
# Good: Select only needed fields
user = await supabase.table("users").select("id, name, phone_number").eq("id", user_id).execute()

# Bad: Select all fields
user = await supabase.table("users").select("*").eq("id", user_id).execute()
```

### **Memory Management**
```python
# Clean up large objects
def process_large_conversation_history():
    history = load_full_history()  # Large dataset
    try:
        result = analyze_patterns(history)
        return result
    finally:
        del history  # Explicit cleanup
        
# Use generators for large datasets
def process_users_batch():
    for batch in get_users_in_batches(batch_size=100):
        yield process_batch(batch)
```

### **Async Best Practices**
```python
# Concurrent execution for independent operations
async def handle_user_request(user_id: str, message: str):
    # Run independent operations concurrently
    user_task = asyncio.create_task(get_user(user_id))
    memory_task = asyncio.create_task(load_memory(user_id))
    
    user, memory = await asyncio.gather(user_task, memory_task)
    
    # Process with both results
    return await generate_response(user, memory, message)
```

---

## 🎯 **Definition of Done**

### **Feature Completion Checklist**
- [ ] **Functionality**: Feature works as specified
- [ ] **Tests**: Unit, integration, and e2e tests passing
- [ ] **Documentation**: Code comments and user docs updated
- [ ] **Performance**: Meets response time requirements
- [ ] **Security**: No new vulnerabilities introduced
- [ ] **Accessibility**: SMS compatibility verified
- [ ] **Error Handling**: Graceful failure modes implemented
- [ ] **Monitoring**: Metrics and alerts configured
- [ ] **Rollback Plan**: Can safely revert if issues arise

### **Code Quality Gates**
- **Test Coverage**: Minimum 80% for new code
- **Linting**: Passes flake8, black, and mypy checks
- **Security Scan**: No high-severity vulnerabilities
- **Performance**: No regression in key metrics
- **Documentation**: All public APIs documented

---

## 📚 **Related Documentation**
- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** - Architecture patterns and standards
- **[FEATURE_SPECIFICATIONS.md](FEATURE_SPECIFICATIONS.md)** - Feature requirements and specs
- **[OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)** - Production deployment procedures
- **[TASKS.md](TASKS.md)** - Current development work items

*Development processes designed to maintain code quality while shipping features that genuinely help caregivers.*