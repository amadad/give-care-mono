# GiveCare Operations Guide

## 🚀 **Production Deployment**

### **Environment Setup**
```bash
# Required Environment Variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

AZURE_OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_GUARDRAILS_DEPLOYMENT_NAME=gpt-4.1-nano-prod

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Webhook endpoints configured (Twilio, Stripe)
- [ ] Rate limiting configured
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Health check endpoints responding
- [ ] Backup procedures verified

### **Health Checks**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": await check_database_connection(),
        "ai_service": await check_azure_openai(),
        "sms_service": await check_twilio_connection()
    }
```

---

## 📊 **Monitoring & Observability**

### **Key Metrics**

#### **System Performance**
- **Response Time**: SMS processing end-to-end latency (target: <3 seconds)
- **Throughput**: Messages processed per minute
- **Error Rate**: Failed requests percentage (target: <1%)
- **Uptime**: Service availability (target: 99.9%)

#### **User Experience**
- **Time to First Value**: Seconds from first message to helpful response
- **Conversation Completion**: Messages exchanged per session
- **Profile Completion Rate**: Percentage of users with complete profiles
- **User Satisfaction**: Direct feedback and retention metrics

#### **AI Performance**
- **Agent Response Quality**: Human evaluation scores
- **Tool Success Rate**: Percentage of successful tool executions
- **Crisis Detection Accuracy**: True positive/negative rates
- **Memory Recall**: Context retention across conversations

### **Alerting Thresholds**
```yaml
Critical Alerts:
  - SMS processing time > 10 seconds
  - Error rate > 5% over 5 minutes
  - Database connection failures
  - AI service unavailable

Warning Alerts:
  - Response time > 5 seconds
  - Memory usage > 80%
  - Queue depth > 100 messages
  - Daily active user drop > 20%
```

### **Logging Standards**
```python
# Structured logging format
logger.info("SMS processed", extra={
    "user_id": user.id,
    "phone_number": hash_phone(phone),  # Hashed for privacy
    "message_length": len(message),
    "processing_time_ms": processing_time,
    "agent_tools_used": tools_used,
    "session_id": session.id,
    "conversation_state": state
})
```

---

## 🔧 **Troubleshooting Guide**

### **Common Issues**

#### **SMS Delivery Problems**
```
Symptoms: Users not receiving responses
Causes: 
  - Twilio webhook failures
  - Phone number validation errors
  - Rate limiting exceeded
  
Solutions:
  1. Check Twilio logs for delivery status
  2. Verify webhook URL is accessible
  3. Validate phone number format (+1234567890)
  4. Check rate limiting on user/phone number
```

#### **Agent Response Delays**
```
Symptoms: Long response times (>10 seconds)
Causes:
  - Azure OpenAI rate limiting
  - Database query performance
  - Memory loading timeouts
  
Solutions:
  1. Check Azure OpenAI quotas and usage
  2. Review slow query logs
  3. Implement response caching for common queries
  4. Add circuit breakers for external services
```

#### **Profile Extraction Failures**
```
Symptoms: User information not being captured
Causes:
  - Model parsing errors
  - Validation failures
  - Memory storage issues
  
Solutions:
  1. Check structured output format compliance
  2. Review Pydantic validation errors
  3. Verify database write permissions
  4. Test profile extraction with sample data
```

#### **Memory/Context Loss**
```
Symptoms: Agent doesn't remember previous conversations
Causes:
  - Memory database connection issues
  - Session ID mismatches
  - Memory cleanup running too aggressively
  
Solutions:
  1. Verify PostgresMemoryDb connection
  2. Check session_id consistency across requests
  3. Review memory retention policies
  4. Test memory persistence manually
```

### **Diagnostic Commands**
```bash
# Check system health
curl https://api.givecare.com/health

# Review recent logs
tail -f /var/log/givecare/app.log | grep ERROR

# Test SMS webhook
curl -X POST https://api.givecare.com/webhook/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+1234567890&Body=test message&MessageSid=test123"

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM users;"

# Test AI service
python -c "from utils.ai import test_azure_connection; test_azure_connection()"
```

---

## 🔐 **Security Operations**

### **Data Protection**
- **Encryption**: All data encrypted in transit (TLS) and at rest
- **PII Handling**: Phone numbers hashed in logs, messages encrypted
- **Access Control**: Row-level security on all user data
- **Backup Encryption**: Database backups encrypted with separate keys

### **Incident Response**
```
1. Detection: Automated alerts or user reports
2. Assessment: Classify severity (P0-P4)
3. Containment: Isolate affected systems
4. Investigation: Root cause analysis
5. Resolution: Fix and verify
6. Documentation: Post-incident review
7. Prevention: Update monitoring and procedures
```

### **Security Monitoring**
- **Failed Authentication**: Multiple failed login attempts
- **Unusual Access Patterns**: Off-hours database access
- **Data Export Activities**: Bulk data downloads
- **API Abuse**: Rate limiting violations or suspicious patterns

### **Privacy Compliance**
- **Data Minimization**: Collect only necessary information
- **User Rights**: Data access, correction, and deletion capabilities
- **Retention Policies**: Automatic data purging after inactivity
- **Consent Management**: Clear opt-in/opt-out mechanisms

---

## 📈 **Performance Optimization**

### **Database Optimization**
```sql
-- Essential indexes for performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_memory_agent_id ON memory(agent_id);

-- Query optimization examples
EXPLAIN ANALYZE SELECT * FROM users WHERE phone_number = '+1234567890';
```

### **Caching Strategy**
- **Response Caching**: Common questions and answers
- **User Profile Caching**: Frequently accessed user data
- **Resource Caching**: Local service information by location
- **Model Response Caching**: Similar user inputs and outputs

### **Scaling Considerations**
- **Horizontal Scaling**: Multiple FastAPI instances behind load balancer
- **Database Read Replicas**: Separate read/write database connections
- **Message Queuing**: Redis/SQS for handling SMS volume spikes
- **CDN**: Static content delivery for any web assets

---

## 💾 **Backup & Recovery**

### **Backup Strategy**
```bash
# Daily automated backups
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Weekly full backup with verification
pg_dump $DATABASE_URL > full_backup.sql
psql test_db < full_backup.sql  # Verify restore works
```

### **Recovery Procedures**
1. **Data Loss Detection**: Monitoring alerts or user reports
2. **Assess Scope**: Determine what data is affected
3. **Stop Writes**: Prevent further data corruption
4. **Restore from Backup**: Use most recent clean backup
5. **Verify Integrity**: Confirm all systems working
6. **Resume Operations**: Gradually restore full service

### **Disaster Recovery**
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour (maximum data loss)
- **Backup Retention**: 30 days online, 1 year archived
- **Geographic Distribution**: Backups stored in multiple regions

---

## 🧪 **Testing & Quality Assurance**

### **Testing Strategy**
```python
# Unit tests for core functions
pytest utils/test_profiling.py -v

# Integration tests for agent workflows
pytest tests/test_agent_integration.py -v

# End-to-end SMS flow testing
pytest tests/test_sms_e2e.py -v

# Load testing for high-volume scenarios
locust -f tests/load_test.py --host=https://api.givecare.com
```

### **Quality Gates**
- **Code Coverage**: Minimum 80% for critical paths
- **Performance Tests**: Response time under load
- **Security Scans**: OWASP vulnerability checks
- **Accessibility**: SMS format compatibility testing

### **Production Testing**
- **Canary Deployments**: Test with 5% of traffic first
- **Feature Flags**: Gradual rollout of new capabilities
- **A/B Testing**: Conversation flow optimization
- **User Acceptance**: Beta testing with real caregivers

---

## 📚 **Related Documentation**
- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** - System architecture and components
- **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - Testing and deployment procedures
- **[PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)** - Success metrics and KPIs
- **[FEATURE_SPECIFICATIONS.md](FEATURE_SPECIFICATIONS.md)** - Feature-specific monitoring needs

*Operations procedures designed for reliability, security, and continuous improvement of caregiving support.*