#!/bin/bash

# GiveCare Admin Dashboard - Automated Setup Script
# Run this to set up the entire project

set -e

echo "🚀 GiveCare Admin Dashboard - Setup Script"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the admin-frontend directory?"
  exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
npm install

# Step 2: Initialize Tailwind
echo "🎨 Step 2/5: Initializing Tailwind CSS..."
if [ ! -f "tailwind.config.ts" ]; then
  npx tailwindcss init -p
fi

# Step 3: Setup shadcn/ui
echo "🎨 Step 3/5: Setting up shadcn/ui..."
if [ ! -f "components.json" ]; then
  npx shadcn@latest init --yes --defaults
fi

# Step 4: Install shadcn components
echo "🧩 Step 4/5: Installing shadcn/ui components..."
components=(
  "button"
  "card"
  "table"
  "badge"
  "dialog"
  "form"
  "input"
  "select"
  "tabs"
  "dropdown-menu"
  "alert"
  "skeleton"
  "progress"
)

for component in "${components[@]}"; do
  echo "  Installing $component..."
  npx shadcn@latest add "$component" --yes --overwrite
done

# Step 5: Create symlink to convex
echo "🔗 Step 5/5: Creating symlink to Convex..."
if [ ! -L "convex" ]; then
  ln -s ../convex ./convex
  echo "  ✅ Symlink created: convex -> ../convex"
else
  echo "  ℹ️  Symlink already exists"
fi

# Step 6: Create .env.local
echo "🔑 Step 6/6: Setting up environment variables..."
if [ ! -f ".env.local" ]; then
  cp .env.local.example .env.local
  echo "  ⚠️  Created .env.local - YOU MUST UPDATE VITE_CONVEX_URL!"
  echo "  📝 Get URL from: cd ../give-care-type && npx convex dashboard"
else
  echo "  ℹ️  .env.local already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Update .env.local with your Convex URL:"
echo "   cd ../give-care-type && npx convex dashboard"
echo "   Copy deployment URL and paste into .env.local"
echo ""
echo "2. Start Convex dev server (in another terminal):"
echo "   cd ../give-care-type"
echo "   npx convex dev"
echo ""
echo "3. Start Vite dev server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
