#!/bin/bash

# Cloudflare Setup Script for give-care-etl
# This script automates the Cloudflare Workers setup process

set -e  # Exit on error

echo "🚀 give-care-etl Cloudflare Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js 20+${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Login to Cloudflare
echo -e "${YELLOW}🔐 Step 2: Login to Cloudflare${NC}"
echo "This will open your browser. Please log in and authorize Wrangler."
read -p "Press Enter to continue..."
npx wrangler login

# Verify login
if npx wrangler whoami &> /dev/null; then
    echo -e "${GREEN}✅ Successfully logged in to Cloudflare${NC}"
else
    echo -e "${RED}❌ Login failed. Please try again.${NC}"
    exit 1
fi
echo ""

# Step 3: Get Account ID
echo -e "${YELLOW}📝 Step 3: Getting Account ID...${NC}"
ACCOUNT_INFO=$(npx wrangler whoami)
echo "$ACCOUNT_INFO"
echo ""
echo "Please copy your Account ID from above and paste it here:"
read -p "Account ID: " ACCOUNT_ID

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Account ID is required${NC}"
    exit 1
fi

# Update wrangler.toml with account ID
sed -i.bak "s/account_id = \"\"/account_id = \"$ACCOUNT_ID\"/" wrangler.toml
echo -e "${GREEN}✅ Updated wrangler.toml with account ID${NC}"
echo ""

# Step 4: Create KV Namespaces
echo -e "${YELLOW}🗄️  Step 4: Creating KV namespaces...${NC}"

echo "Creating ETL_STATE namespace..."
ETL_STATE_OUTPUT=$(npx wrangler kv:namespace create ETL_STATE)
ETL_STATE_ID=$(echo "$ETL_STATE_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating ETL_STATE preview namespace..."
ETL_STATE_PREVIEW_OUTPUT=$(npx wrangler kv:namespace create ETL_STATE --preview)
ETL_STATE_PREVIEW_ID=$(echo "$ETL_STATE_PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

echo "Creating RESOURCE_CACHE namespace..."
RESOURCE_CACHE_OUTPUT=$(npx wrangler kv:namespace create RESOURCE_CACHE)
RESOURCE_CACHE_ID=$(echo "$RESOURCE_CACHE_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating RESOURCE_CACHE preview namespace..."
RESOURCE_CACHE_PREVIEW_OUTPUT=$(npx wrangler kv:namespace create RESOURCE_CACHE --preview)
RESOURCE_CACHE_PREVIEW_ID=$(echo "$RESOURCE_CACHE_PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

echo -e "${GREEN}✅ KV namespaces created${NC}"
echo ""
echo "ETL_STATE ID: $ETL_STATE_ID"
echo "ETL_STATE Preview ID: $ETL_STATE_PREVIEW_ID"
echo "RESOURCE_CACHE ID: $RESOURCE_CACHE_ID"
echo "RESOURCE_CACHE Preview ID: $RESOURCE_CACHE_PREVIEW_ID"
echo ""

# Update wrangler.toml with KV IDs
cat > wrangler_kv_section.tmp << EOF
kv_namespaces = [
  { binding = "ETL_STATE", id = "$ETL_STATE_ID", preview_id = "$ETL_STATE_PREVIEW_ID" },
  { binding = "RESOURCE_CACHE", id = "$RESOURCE_CACHE_ID", preview_id = "$RESOURCE_CACHE_PREVIEW_ID" }
]
EOF

# Replace KV section in wrangler.toml
sed -i.bak '/kv_namespaces = \[/,/\]/d' wrangler.toml
cat wrangler_kv_section.tmp >> wrangler.toml
rm wrangler_kv_section.tmp

echo -e "${GREEN}✅ Updated wrangler.toml with KV namespace IDs${NC}"
echo ""

# Step 5: Set Secrets
echo -e "${YELLOW}🔒 Step 5: Setting secrets...${NC}"
echo ""

echo "Enter your OpenAI API key:"
read -sp "OPENAI_API_KEY: " OPENAI_KEY
echo ""
echo "$OPENAI_KEY" | npx wrangler secret put OPENAI_API_KEY

echo "Enter your Convex URL (default: https://agreeable-lion-831.convex.cloud):"
read -p "CONVEX_URL: " CONVEX_URL
CONVEX_URL=${CONVEX_URL:-https://agreeable-lion-831.convex.cloud}
echo "$CONVEX_URL" | npx wrangler secret put CONVEX_URL

echo "Enter your Convex admin key:"
read -sp "CONVEX_ADMIN_KEY: " CONVEX_KEY
echo ""
echo "$CONVEX_KEY" | npx wrangler secret put CONVEX_ADMIN_KEY

echo -e "${GREEN}✅ Secrets set${NC}"
echo ""

# Step 6: Create .dev.vars for local development
echo -e "${YELLOW}📝 Step 6: Creating .dev.vars for local development...${NC}"

cat > .dev.vars << EOF
OPENAI_API_KEY=$OPENAI_KEY
CONVEX_URL=$CONVEX_URL
CONVEX_ADMIN_KEY=$CONVEX_KEY
ENVIRONMENT=development
LOG_LEVEL=debug
EOF

echo -e "${GREEN}✅ Created .dev.vars${NC}"
echo ""

# Step 7: Test locally
echo -e "${YELLOW}🧪 Step 7: Testing local setup...${NC}"
echo "Starting local dev server (will run for 5 seconds)..."
timeout 5 pnpm dev &
DEV_PID=$!
sleep 3

# Test health endpoint
if curl -s http://localhost:8787/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Local server is working!${NC}"
else
    echo -e "${YELLOW}⚠️  Local server might not be ready yet. Try 'pnpm dev' manually.${NC}"
fi

kill $DEV_PID 2>/dev/null || true
echo ""

# Step 8: Deploy
echo -e "${YELLOW}🚀 Step 8: Deploy to Cloudflare?${NC}"
read -p "Deploy to production now? (y/N): " DEPLOY_NOW

if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
    echo "Deploying to Cloudflare Workers..."
    pnpm deploy
    echo -e "${GREEN}✅ Deployed successfully!${NC}"
    echo ""
    echo "Your worker is now live at:"
    npx wrangler deployments list | head -5
else
    echo -e "${YELLOW}Skipping deployment. Run 'pnpm deploy' when ready.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test locally: pnpm dev"
echo "  2. Deploy: pnpm deploy"
echo "  3. View logs: npx wrangler tail"
echo "  4. View in dashboard: https://dash.cloudflare.com"
echo ""
echo "See CLOUDFLARE_SETUP.md for detailed documentation."
