# Cloudflare Setup Guide for give-care-etl

Complete step-by-step guide to connect and deploy give-care-etl to Cloudflare Workers.

---

## Prerequisites

- Cloudflare account (free tier is sufficient)
- Node.js 20+ and pnpm installed
- OpenAI API key

---

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers.

```bash
cd give-care-etl

# Wrangler is already in package.json, so just install dependencies
pnpm install
```

Verify installation:
```bash
npx wrangler --version
```

---

## Step 2: Login to Cloudflare

```bash
npx wrangler login
```

This will:
1. Open your browser
2. Ask you to log in to Cloudflare
3. Authorize Wrangler to access your account
4. Save credentials to `~/.wrangler/config/default.toml`

Verify login:
```bash
npx wrangler whoami
```

Expected output:
```
 ⛅️ wrangler 3.90.0
-------------------
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
```

---

## Step 3: Get Your Cloudflare Account ID

```bash
npx wrangler whoami
```

Look for the line:
```
Account ID: abc123def456ghi789
```

Or get it from the dashboard:
1. Go to https://dash.cloudflare.com
2. Click on "Workers & Pages" in the sidebar
3. Your Account ID is shown at the bottom of the sidebar

Update `wrangler.toml`:
```toml
account_id = "YOUR_ACCOUNT_ID_HERE"
```

---

## Step 4: Create KV Namespaces

KV (Key-Value) stores are used for caching and state management.

### Create ETL State KV
```bash
npx wrangler kv:namespace create ETL_STATE
```

Output will look like:
```
🌀 Creating namespace with title "give-care-etl-ETL_STATE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "ETL_STATE", id = "abc123..." }
```

### Create ETL State KV (Preview)
```bash
npx wrangler kv:namespace create ETL_STATE --preview
```

Output:
```
{ binding = "ETL_STATE", preview_id = "xyz789..." }
```

### Create Resource Cache KV
```bash
npx wrangler kv:namespace create RESOURCE_CACHE
npx wrangler kv:namespace create RESOURCE_CACHE --preview
```

### Update wrangler.toml

Replace the KV namespace section in `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "ETL_STATE", id = "YOUR_PRODUCTION_ID", preview_id = "YOUR_PREVIEW_ID" },
  { binding = "RESOURCE_CACHE", id = "YOUR_PRODUCTION_ID", preview_id = "YOUR_PREVIEW_ID" }
]
```

---

## Step 5: Create D1 Database (Optional - for QA workflow)

D1 is Cloudflare's SQL database (currently in beta).

```bash
npx wrangler d1 create give-care-etl-qa
```

Output:
```
✅ Successfully created DB 'give-care-etl-qa'!

[[d1_databases]]
binding = "DB"
database_name = "give-care-etl-qa"
database_id = "abc123..."
```

Uncomment and update the D1 section in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "give-care-etl-qa"
database_id = "YOUR_DATABASE_ID"
```

---

## Step 6: Enable Browser Rendering API

Browser Rendering API is needed for Puppeteer-based scraping.

### Via Dashboard (Recommended)
1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages" in sidebar
3. Scroll down to "Browser Rendering"
4. Click "Enable" or "Get Started"
5. Accept terms (it's free for first 1M requests/month)

### Verify in wrangler.toml
Ensure this line exists:
```toml
browser = { binding = "BROWSER" }
```

---

## Step 7: Set Environment Secrets

Secrets are encrypted environment variables for production.

```bash
# Set OpenAI API key
npx wrangler secret put OPENAI_API_KEY
# Paste your key when prompted: sk-proj-...

# Set Convex URL
npx wrangler secret put CONVEX_URL
# Paste: https://agreeable-lion-831.convex.cloud

# Set Convex admin key
npx wrangler secret put CONVEX_ADMIN_KEY
# Paste your Convex admin key
```

Verify secrets:
```bash
npx wrangler secret list
```

---

## Step 8: Configure Local Development

For local testing, create `.dev.vars` (NOT committed to git):

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
CONVEX_URL=https://agreeable-lion-831.convex.cloud
CONVEX_ADMIN_KEY=your-convex-admin-key
ENVIRONMENT=development
LOG_LEVEL=debug
```

**Important**: `.dev.vars` is already in `.gitignore` - never commit secrets!

---

## Step 9: Test Locally

Start the local development server:

```bash
pnpm dev
```

Expected output:
```
⛅️ wrangler 3.90.0
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### Test the health endpoint

In another terminal:
```bash
curl http://localhost:8787/health
```

Expected response:
```json
{"status":"ok"}
```

### Test the orchestrator endpoint

```bash
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "discover_eldercare_resources",
    "state": "NY",
    "limit": 5
  }'
```

Expected response (initially):
```json
{
  "sessionId": "orch-1234567890",
  "status": "completed",
  "sources": 0,
  "extracted": 0,
  "categorized": 0,
  "validated": 0,
  "errors": 0,
  "startedAt": "2025-10-16T12:00:00.000Z",
  "completedAt": "2025-10-16T12:00:01.000Z"
}
```

---

## Step 10: Deploy to Cloudflare Workers

### First Deployment

```bash
pnpm deploy
```

Expected output:
```
⛅️ wrangler 3.90.0
-------------------
Total Upload: 125.45 KiB / gzip: 32.18 KiB
Uploaded give-care-etl (1.23 sec)
Published give-care-etl (0.45 sec)
  https://give-care-etl.your-subdomain.workers.dev
Current Deployment ID: abc123def456
```

### Verify Deployment

```bash
curl https://give-care-etl.your-subdomain.workers.dev/health
```

---

## Step 11: View Logs

### Tail logs in real-time
```bash
npx wrangler tail
```

### View logs in dashboard
1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages"
3. Click "give-care-etl"
4. Click "Logs" tab

---

## Step 12: Configure Custom Domain (Optional)

### Via Dashboard
1. Go to Workers & Pages → give-care-etl
2. Click "Triggers" tab
3. Click "Add Custom Domain"
4. Enter domain: `etl.givecareapp.com`
5. Cloudflare will automatically add DNS records

### Via wrangler.toml
```toml
route = "etl.givecareapp.com/*"
```

Then deploy:
```bash
pnpm deploy
```

---

## Step 13: Set Up Cron Triggers

Cron triggers are already configured in `wrangler.toml`:

```toml
[triggers]
crons = ["0 6 * * 1"] # Every Monday at 6am UTC
```

After deployment, view scheduled runs:
1. Go to Workers & Pages → give-care-etl
2. Click "Triggers" tab
3. View "Cron Triggers" section

### Test cron manually (without waiting)
```bash
npx wrangler dev --test-scheduled
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] `npx wrangler whoami` shows your account
- [ ] `account_id` in wrangler.toml is correct
- [ ] KV namespaces created and IDs in wrangler.toml
- [ ] Browser Rendering API enabled in dashboard
- [ ] Secrets set: `npx wrangler secret list`
- [ ] `.dev.vars` file created with local secrets
- [ ] Local dev works: `pnpm dev` → `curl http://localhost:8787/health`
- [ ] Deployed to Cloudflare: `pnpm deploy`
- [ ] Production works: `curl https://give-care-etl.*.workers.dev/health`
- [ ] Logs visible: `npx wrangler tail`
- [ ] Cron trigger visible in dashboard

---

## Common Issues & Solutions

### "Error: Missing account_id"
**Solution**: Add your account ID to `wrangler.toml`
```bash
npx wrangler whoami # Get your account ID
```

### "Error: KV namespace not found"
**Solution**: Create KV namespaces and update IDs in `wrangler.toml`
```bash
npx wrangler kv:namespace create ETL_STATE
npx wrangler kv:namespace create ETL_STATE --preview
```

### "Error: Browser Rendering API not enabled"
**Solution**: Enable in dashboard
1. https://dash.cloudflare.com → Workers & Pages → Browser Rendering
2. Click "Enable"

### "Error: Unauthorized" when deploying
**Solution**: Re-login to Cloudflare
```bash
npx wrangler logout
npx wrangler login
```

### Local dev works but deployment fails
**Solution**: Check secrets are set for production
```bash
npx wrangler secret list
npx wrangler secret put OPENAI_API_KEY
```

### "Error: route already exists"
**Solution**: Remove or change the `route` in `wrangler.toml`, or delete the existing worker in the dashboard

---

## Next Steps After Deployment

1. **Monitor logs**: `npx wrangler tail`
2. **View analytics**: Dashboard → Workers & Pages → give-care-etl → Analytics
3. **Test orchestrator**: Send POST to `/orchestrate` endpoint
4. **Implement Phase 1**: Complete agent execution logic
5. **Deploy updates**: `pnpm deploy` after code changes

---

## Cloudflare Dashboard Quick Links

- **Workers**: https://dash.cloudflare.com/?to=/:account/workers
- **KV Namespaces**: https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces
- **D1 Databases**: https://dash.cloudflare.com/?to=/:account/workers/d1
- **Browser Rendering**: https://dash.cloudflare.com/?to=/:account/workers/browser-rendering
- **Analytics**: https://dash.cloudflare.com/?to=/:account/workers/analytics

---

## Cost Breakdown (Free Tier)

Cloudflare Workers Free Tier includes:
- **100,000 requests/day** (enough for testing and small-scale production)
- **10ms CPU time per request**
- **KV**: 100,000 reads/day, 1,000 writes/day
- **Browser Rendering**: 1,000,000 requests/month
- **D1**: 25M reads/month, 100K writes/month

**When you'll need to upgrade**:
- >100k requests/day → Workers Paid ($5/month + usage)
- >1M browser rendering requests/month → $0.50 per 1M requests
- Heavy KV usage → Paid KV ($0.50 per 1M reads)

For MVP and testing, you'll stay within free tier.

---

## Support

- **Wrangler docs**: https://developers.cloudflare.com/workers/wrangler/
- **Workers docs**: https://developers.cloudflare.com/workers/
- **Community forum**: https://community.cloudflare.com/
- **Discord**: https://discord.gg/cloudflaredev

---

**Last updated**: 2025-10-16
