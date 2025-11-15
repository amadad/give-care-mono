# GiveCare Admin Dashboard

**Status**: Synced with backend ✅ | Running on localhost:5173 ✅ | User list page pending 🚧

Real-time admin dashboard for GiveCare built with:
- **Vite** + **React 19** + **TypeScript**
- **Convex** (backend/database)
- **TanStack Router** (file-based routing)
- **shadcn/ui** (component library)
- **Recharts** (analytics charts)
- **Cloudflare Pages** (hosting)

---

## Quick Start

### 1. Navigate to Project

```bash
cd /Users/amadad/Projects/givecare/give-care-admin
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install

# If package.json doesn't exist yet, create it first:
npm init -y

# Then install all dependencies:
npm install react react-dom @vitejs/plugin-react
npm install convex @tanstack/react-query @tanstack/react-router @tanstack/react-table
npm install recharts react-hook-form zod lucide-react date-fns clsx tailwind-merge
npm install -D vite typescript @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D @tanstack/router-vite-plugin
```

### 3. Initialize Configs

```bash
# Tailwind
npx tailwindcss init -p

# shadcn/ui
npx shadcn@latest init
```

When prompted for shadcn/ui:
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**
- Tailwind config: **tailwind.config.ts**
- Components: **src/components**
- Utils: **src/lib/utils**
- React Server Components: **No**
- Import alias: **@/***

### 4. Install shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert
npx shadcn@latest add skeleton
```

### 5. Setup Environment Variables

Create `.env.local`:

```bash
# Get Convex URL from:
# cd ../give-care-app && npx convex dashboard
# Copy deployment URL (e.g., https://YOUR_DEPLOYMENT.convex.cloud)

VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

### 6. Start Development Server

```bash
# In one terminal: Start Convex backend
cd /Users/amadad/Projects/givecare/give-care-app
npx convex dev

# In another terminal: Start Vite dev server
cd /Users/amadad/Projects/givecare/give-care-admin
pnpm dev
```

Open http://localhost:5173

---

## Project Structure

```
admin/
├── src/
│   ├── main.tsx                      # ✅ Entry point
│   ├── index.css                     # ✅ Tailwind imports
│   ├── routes/
│   │   ├── __root.tsx                # ✅ Layout wrapper
│   │   ├── index.tsx                 # ✅ Dashboard home
│   │   ├── users/
│   │   │   ├── index.tsx             # User list
│   │   │   └── $userId.tsx           # User detail
│   │   ├── crisis.tsx                # Crisis management
│   │   ├── analytics.tsx             # Analytics (3 tabs)
│   │   └── system.tsx                # System health
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (auto-generated)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # ✅ Navigation
│   │   │   └── Header.tsx            # ✅ Search + profile
│   │   └── dashboard/
│   │       └── MetricCard.tsx        # ✅ KPI cards
│   └── lib/
│       └── utils.ts                  # ✅ Helper functions
├── convex/_generated/                # Imported from ../give-care-app/convex/_generated
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## What's Complete ✅

1. **Project structure** - Organized folder layout
2. **Entry point** (main.tsx) - Convex provider + routing
3. **Layout** (__root.tsx) - Sidebar + header + main content area
4. **Components**:
   - Sidebar - Navigation menu with icons
   - Header - Search bar + profile dropdown
   - MetricCard - KPI cards for metrics
   - BurnoutChart - Recharts histogram for burnout distribution
   - QualityMetrics - Evaluation metric cards
   - AgentPerformance - Agent latency charts
   - SummaryPerformance - Summary quality metrics
5. **Dashboard Home** (index.tsx) - 5 metric cards + subscription breakdown
6. **User Detail** (`src/routes/users/$userId.tsx`) - Wellness chart, conversation history, assessment history
7. **Crisis Management** (`src/routes/crisis.tsx`) - Crisis alerts (burnout ≥80), pending follow-ups with timers
8. **Analytics** (`src/routes/analytics.tsx`) - 3 tabs: Usage (burnout histogram, user funnel, SMS trends), Quality (eval scores), Performance (agent latency)
9. **System Health** (`src/routes/system.tsx`) - Rate limiter status, API usage, database performance
10. **Backend Integration** - Queries raw Convex tables (users, scores, assessments, alerts, events, subscriptions)
11. **Utilities** (lib/utils.ts) - Helper functions for formatting

---

## What's TODO 🚧

### High Priority (Week 1)

1. **User List** (`src/routes/users/index.tsx`)
   - TanStack Table with filters
   - Search by name/phone
   - Pagination
   - Link to user detail pages

### Medium Priority (Week 2-3)

1. **Backend Metrics Queries** - Replace mock data in system.tsx with real metrics:
   - Token usage tracking (requires `llm_usage` table)
   - Rate limit tracking
   - Agent run latency aggregation
   - Error log aggregation

2. **Alert Management UI** - When crisis escalation is implemented:
   - Alert detail view
   - Mark as processed
   - Alert history

3. **Evaluation Dashboard** - When LLM-as-judge is implemented:
   - P1-P6 compliance scores
   - Evaluation history
   - Failed evaluations detail view

### Low Priority (Week 4+)

1. **Advanced Filters** - Add filtering to all list views:
   - Date range pickers
   - Multi-select filters
   - Search across multiple fields

2. **Export Functionality** - Export data to CSV/Excel:
   - User lists
   - Analytics data
   - Audit logs

3. **Real-time Updates** - Add WebSocket subscriptions for:
   - Crisis alerts
   - New user registrations
   - Agent run completion

---

## Configuration Files Needed

### package.json

```json
{
  "name": "give-care-admin-dashboard",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "convex": "^1.11.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/react-table": "^8.0.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tanstack/router-vite-plugin": "^1.0.0",
    "eslint": "^8.56.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Next Steps

### Option 1: Complete Yourself
1. Run setup commands above
2. Create remaining pages (users, crisis, analytics, system)
3. Use existing Convex queries from `convex/functions/admin.ts` and `analytics.ts`
4. Test locally → deploy to Cloudflare Pages

### Option 2: I Generate Remaining Code
Tell me "continue generating code" and I'll create:
- All remaining route pages
- All dashboard components
- Complete working dashboard

### Option 3: Get Help
- Ask questions about specific pages
- Request specific components
- Debug issues

---

## Deployment (Cloudflare Pages)

The admin dashboard is part of the givecare monorepo and deploys from the root.

1. **Configure Cloudflare Pages Project**:
   - Go to https://dash.cloudflare.com → Pages
   - Create application → Connect to Git
   - Select `give-care-mono` repository
   - Build settings:
     - **Framework preset**: None (Vite)
     - **Build command**: `pnpm install && pnpm --filter give-care-admin-dashboard build`
     - **Build output directory**: `give-care-admin/dist`
     - **Root directory**: `/` (leave empty for monorepo root)
     - **Environment variables**:
       - `VITE_CONVEX_URL` = `https://YOUR_DEPLOYMENT.convex.cloud`
   - Deploy!

2. **Custom Domain**:
   - Pages → Custom domains → Set up domain
   - Add `admin.givecareapp.com`
   - Configure DNS (automatic if domain on Cloudflare)

---

## Troubleshooting

**Problem**: "Cannot find module '@/components/ui/button'"
- **Solution**: Run `npx shadcn@latest add button`

**Problem**: Convex types not found
- **Solution**: Ensure vite.config.ts alias points to: `../give-care-app/convex/_generated`

**Problem**: Import alias '@/' not working
- **Solution**: Check vite.config.ts has alias configured

**Problem**: Tailwind styles not applying
- **Solution**: Verify index.css has `@tailwind` directives

---

Ready to build! Choose your path:
- **Run setup now** → Follow commands above
- **Continue code generation** → Say "generate more code"
- **Ask questions** → I'm here to help
