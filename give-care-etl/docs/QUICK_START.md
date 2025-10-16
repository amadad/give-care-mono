# Quick Start Guide

Get give-care-etl connected to Cloudflare in 10 minutes.

---

## Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
cd give-care-etl
./cloudflare-setup.sh
```

This will:
- ✅ Install dependencies
- ✅ Login to Cloudflare
- ✅ Create KV namespaces
- ✅ Set production secrets
- ✅ Create `.dev.vars` for local development
- ✅ Test local setup
- ✅ Optionally deploy to production

**Time**: ~5 minutes (mostly waiting for browser login)

---

## Option 2: Manual Setup

### 1. Install & Login (2 min)
```bash
cd give-care-etl
pnpm install
npx wrangler login  # Opens browser, authorize Wrangler
```

### 2. Configure Account (1 min)
```bash
# Get your account ID
npx wrangler whoami

# Edit wrangler.toml and add your account ID
account_id = "your-account-id-here"
```

### 3. Create KV Namespaces (2 min)
```bash
# Create namespaces
npx wrangler kv:namespace create ETL_STATE
npx wrangler kv:namespace create ETL_STATE --preview
npx wrangler kv:namespace create RESOURCE_CACHE
npx wrangler kv:namespace create RESOURCE_CACHE --preview

# Copy IDs to wrangler.toml
# Update the kv_namespaces section with your IDs
```

### 4. Set Secrets (2 min)
```bash
npx wrangler secret put OPENAI_API_KEY
# Paste: sk-proj-...

npx wrangler secret put CONVEX_URL
# Paste: https://agreeable-lion-831.convex.cloud

npx wrangler secret put CONVEX_ADMIN_KEY
# Paste your Convex admin key
```

### 5. Local Development (1 min)
```bash
# Create .dev.vars for local testing
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys

# Start local server
pnpm dev

# Test in another terminal
curl http://localhost:8787/health
```

### 6. Deploy (1 min)
```bash
pnpm deploy
```

---

## Verify Everything Works

```bash
# Check you're logged in
npx wrangler whoami

# Check secrets are set
npx wrangler secret list

# Test local
pnpm dev
curl http://localhost:8787/health

# Deploy
pnpm deploy

# Test production
curl https://give-care-etl.YOUR_SUBDOMAIN.workers.dev/health

# View logs
npx wrangler tail
```

---

## Common Commands

```bash
# Local development
pnpm dev                    # Start local server
curl http://localhost:8787  # Test locally

# Deployment
pnpm deploy                 # Deploy to Cloudflare
npx wrangler tail          # View live logs
npx wrangler deployments list  # List deployments

# Secrets management
npx wrangler secret list   # List secret names
npx wrangler secret put SECRET_NAME    # Add/update secret
npx wrangler secret delete SECRET_NAME # Remove secret

# KV management
npx wrangler kv:namespace list         # List namespaces
npx wrangler kv:key list --binding ETL_STATE  # List keys in namespace
npx wrangler kv:key get KEY_NAME --binding ETL_STATE  # Get value

# Account info
npx wrangler whoami        # Show account info
npx wrangler login         # Re-login
npx wrangler logout        # Logout
```

---

## Dashboard Quick Links

- **Workers**: https://dash.cloudflare.com → Workers & Pages
- **Your Worker**: Workers & Pages → give-care-etl
- **KV Storage**: Workers & Pages → KV
- **Browser Rendering**: Workers & Pages → Browser Rendering
- **Logs**: give-care-etl → Logs tab
- **Analytics**: give-care-etl → Analytics tab

---

## Enable Browser Rendering API

Required for web scraping with Puppeteer:

1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages" in sidebar
3. Scroll to "Browser Rendering"
4. Click "Enable" (free for 1M requests/month)

---

## Troubleshooting

### "Error: Missing account_id"
```bash
npx wrangler whoami  # Copy your account ID
# Add to wrangler.toml: account_id = "..."
```

### "Error: KV namespace not found"
```bash
# Create namespaces and update wrangler.toml
npx wrangler kv:namespace create ETL_STATE
npx wrangler kv:namespace create ETL_STATE --preview
```

### "Error: Unauthorized"
```bash
npx wrangler logout
npx wrangler login
```

### Local dev works, deploy fails
```bash
# Check production secrets are set
npx wrangler secret list

# Set missing secrets
npx wrangler secret put OPENAI_API_KEY
```

---

## Next Steps After Setup

1. **Test the orchestrator**:
   ```bash
   curl -X POST https://give-care-etl.*.workers.dev/orchestrate \
     -H "Content-Type: application/json" \
     -d '{"task":"discover_eldercare_resources","state":"NY","limit":5}'
   ```

2. **View logs**: `npx wrangler tail`

3. **Implement Phase 1**: Complete agent execution logic (see `IMPLEMENTATION_STATUS.md`)

4. **Monitor**: Dashboard → give-care-etl → Analytics

---

## Cost (Free Tier)

You'll stay within Cloudflare's free tier for MVP:
- **100,000 requests/day** FREE
- **KV**: 100,000 reads/day FREE
- **Browser Rendering**: 1M requests/month FREE

**Estimated OpenAI cost**: ~$0.17 per 100 resources

---

## Support

- **Detailed setup**: See `CLOUDFLARE_SETUP.md`
- **Architecture**: See `README.md`
- **Implementation**: See `IMPLEMENTATION_STATUS.md`
- **Cloudflare docs**: https://developers.cloudflare.com/workers/

---

**Last updated**: 2025-10-16
