# GiveCare Reasoning Processor

The reasoning processor handles complex caregiving analysis tasks that would timeout in the SMS flow (Twilio's 15-second limit).

## Architecture

1. **Main SMS Agent (gpt-4.1-prod)**: 
   - Handles immediate responses within 15 seconds
   - Uses lightweight ReasoningTools for quick thinking
   - Queues complex questions for background processing

2. **Background Processor (o4-mini)**:
   - Processes complex reasoning tasks asynchronously
   - No timeout constraints
   - Sends detailed analysis via follow-up SMS

## How It Works

1. User sends complex caregiving question via SMS
2. Main agent detects need for deep analysis
3. Agent responds immediately with acknowledgment
4. Task queued in `reasoning_tasks` table
5. Background processor picks up task
6. o4-mini performs detailed analysis
7. Results sent via follow-up SMS

## Running the Processor

### Local Development
```bash
python reasoning_processor.py
```

### Production (Docker)
```bash
docker build -f Dockerfile.reasoning -t givecare-reasoning .
docker run --env-file .env givecare-reasoning
```

### Production (Systemd)
```bash
sudo cp deployment/reasoning-processor.service /etc/systemd/system/
sudo systemctl enable reasoning-processor
sudo systemctl start reasoning-processor
```

## Database Schema

The processor uses the `reasoning_tasks` table:

```sql
CREATE TABLE reasoning_tasks (
    id UUID PRIMARY KEY,
    phone_number TEXT NOT NULL,
    topic TEXT,
    question TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result TEXT,
    error_message TEXT
);
```

## Monitoring

Check processor logs:
```bash
# Docker
docker logs givecare-reasoning

# Systemd
journalctl -u reasoning-processor -f

# Log files
tail -f /var/log/givecare/reasoning-processor.log
```

## Example Usage

When a user asks:
> "My mom with dementia is becoming increasingly agitated in the evenings and refusing her medications. She's also not sleeping well. What strategies can help?"

The main agent responds:
> "I'm analyzing this care situation in detail. This requires careful consideration of multiple factors. You'll receive my comprehensive assessment via SMS in 1-2 minutes."

Follow-up SMS (from o4-mini):
> "📋 Care Analysis Complete:
> 
> Evening agitation (sundowning) is common in dementia. Strategies:
> 
> 1. **Routine**: Maintain consistent evening schedule
> 2. **Lighting**: Increase lights before sunset to reduce shadows
> 3. **Medication timing**: Work with doctor to adjust timing
> 4. **Calming activities**: Soft music, familiar photos
> 5. **Sleep hygiene**: Limit daytime naps, create peaceful bedroom
> 
> For medication refusal:
> - Mix with favorite foods (check with pharmacist)
> - Use positive reinforcement
> - Try different times when calmer
> 
> Consult her doctor about these behavioral changes - they may adjust medications or suggest additional support."

## Configuration

Required environment variables:
- `AZURE_OPENAI_O4MINI_DEPLOYMENT_NAME`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Error Handling

- Failed tasks are marked with status='failed'
- Fallback SMS sent if analysis fails
- Tasks older than 30 days auto-cleaned
- Retry logic for transient failures