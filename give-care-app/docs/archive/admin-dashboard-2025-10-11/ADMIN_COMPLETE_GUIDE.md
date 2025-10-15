# Admin Dashboard - Complete Build Guide

**Status**: 60% Complete | Ready for Setup & Testing

---

## 🎉 What's Built

### Backend (100% Complete) ✅

1. **Database Schema** (`convex/schema.ts`)
   - ✅ Added `conversationFeedback` table (lines 261-281)

2. **Admin Functions** (`convex/functions/admin.ts` - 296 lines)
   - ✅ `getSystemMetrics()` - Dashboard KPIs
   - ✅ `getAllUsers()` - User list with filters/search/pagination
   - ✅ `getUserDetails()` - User profile + history
   - ✅ `getCrisisAlerts()` - Crisis users + follow-ups
   - ✅ `sendAdminMessage()` - Admin SMS (placeholder)
   - ✅ `resetUserAssessment()` - Clear assessment state

3. **Analytics Functions** (`convex/functions/analytics.ts` - 248 lines)
   - ✅ `getBurnoutDistribution()` - Histogram data
   - ✅ `getUserJourneyFunnel()` - Journey phase distribution
   - ✅ `getDailyMetrics()` - SMS volume trends
   - ✅ `getAgentPerformance()` - Agent latency by type
   - ✅ `getQualityMetrics()` - Eval scores (empathy, clarity, trauma_informed, user_satisfaction)
   - ✅ `getRecentFeedback()` - Last N user ratings
   - ✅ `getQualityTrends()` - Daily quality scores over time

### Frontend (60% Complete) ⚡

**Core Structure** ✅
- ✅ `main.tsx` - Entry point with Convex provider
- ✅ `index.css` - Tailwind imports
- ✅ `lib/utils.ts` - Helper functions (formatPhoneNumber, getRelativeTime, etc.)

**Layout** ✅
- ✅ `routes/__root.tsx` - Root layout with sidebar + header
- ✅ `components/layout/Sidebar.tsx` - Navigation menu (5 links)
- ✅ `components/layout/Header.tsx` - Search bar + profile dropdown

**Dashboard Home** ✅
- ✅ `routes/index.tsx` - Dashboard home page
- ✅ `components/dashboard/MetricCard.tsx` - KPI cards component
- ✅ Shows 5 metrics: Total Users, Active Users, Crisis Alerts, Avg Burnout, Response Time
- ✅ Shows subscription breakdown (Active, Inactive, Past Due, Canceled)

**Remaining Pages** 🚧
- ⏳ User List (`routes/users/index.tsx`) - TODO
- ⏳ User Detail (`routes/users/$userId.tsx`) - TODO
- ⏳ Crisis Management (`routes/crisis.tsx`) - TODO
- ⏳ Analytics (`routes/analytics.tsx`) - TODO (3 tabs)
- ⏳ System Health (`routes/system.tsx`) - TODO

---

## 📋 Your Next Steps

### Step 1: Setup Project (30 minutes)

```bash
cd /Users/amadad/Projects/givecare/give-care-type/admin-frontend

# Create package.json if needed
npm init -y

# Install dependencies
npm install react react-dom @vitejs/plugin-react
npm install convex @tanstack/react-query @tanstack/react-router @tanstack/react-table
npm install recharts react-hook-form zod lucide-react date-fns clsx tailwind-merge
npm install -D vite typescript @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer @tanstack/router-vite-plugin

# Initialize configs
npx tailwindcss init -p

# Setup shadcn/ui
npx shadcn@latest init
# Select: TypeScript=Yes, Style=Default, Color=Slate, CSS variables=Yes,
#         Components=src/components, Utils=src/lib/utils, RSC=No, Alias=@/*

# Install shadcn components
npx shadcn@latest add button card table badge dialog form input select tabs dropdown-menu alert skeleton
```

### Step 2: Create Config Files

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**.env.local**:
```bash
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
# Get URL from: cd ../give-care-type && npx convex dashboard
```

### Step 3: Create Symlink to Convex

```bash
cd /Users/amadad/Projects/givecare/give-care-type/admin-frontend
ln -s ../convex ./convex
```

### Step 4: Test Setup

```bash
# Terminal 1: Start Convex (from give-care-type)
cd /Users/amadad/Projects/givecare/give-care-type
npx convex dev

# Terminal 2: Start Vite
cd /Users/amadad/Projects/givecare/give-care-type/admin-frontend
npm run dev
```

Open http://localhost:5173 - You should see:
- Sidebar with navigation (Dashboard, Users, Crisis, Analytics, System)
- Header with search bar
- Dashboard home with 5 metric cards

---

## 🚀 Option A: Complete It Yourself

Follow the remaining TODO items from `admin-frontend/README.md`:

1. **Create User List Page** (`src/routes/users/index.tsx`)
   - Use `api.functions.admin.getAllUsers` query
   - Implement TanStack Table with filters
   - Add search and pagination

2. **Create User Detail Page** (`src/routes/users/$userId.tsx`)
   - Use `api.functions.admin.getUserDetails` query
   - Add Recharts for wellness trends
   - Show conversation history

3. **Create Crisis Page** (`src/routes/crisis.tsx`)
   - Use `api.functions.admin.getCrisisAlerts` query
   - Add countdown timers for follow-ups
   - Add quick action buttons

4. **Create Analytics Page** (`src/routes/analytics.tsx`)
   - 3 tabs: Usage | Quality | Performance
   - Use Recharts for all visualizations
   - Use quality metrics queries from analytics.ts

5. **Create System Page** (`src/routes/system.tsx`)
   - Show rate limiter status
   - Show API usage
   - Show database performance

**Estimated Time**: 8-12 hours

---

## 🤖 Option B: I Generate Rest of Code

Say **"continue generating"** and I'll create:
1. All 5 remaining page files
2. All dashboard components (UserTable, BurnoutChart, QualityMetrics, etc.)
3. Complete working dashboard

**Estimated Time**: 1-2 hours (your time to test)

---

## 📦 File Inventory

### ✅ Files Created (9 files)

```
admin-frontend/
├── src/
│   ├── main.tsx                         ✅ Entry point (41 lines)
│   ├── index.css                        ✅ Tailwind imports (59 lines)
│   ├── routes/
│   │   ├── __root.tsx                   ✅ Root layout (22 lines)
│   │   └── index.tsx                    ✅ Dashboard home (83 lines)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx              ✅ Navigation (62 lines)
│   │   │   └── Header.tsx               ✅ Search + profile (53 lines)
│   │   └── dashboard/
│   │       └── MetricCard.tsx           ✅ KPI cards (37 lines)
│   └── lib/
│       └── utils.ts                     ✅ Helpers (41 lines)
└── README.md                            ✅ Setup guide (400+ lines)
```

**Total**: 398 lines of React/TypeScript code generated

### 🚧 Files Needed (13+ files)

```
admin-frontend/
├── src/
│   ├── routes/
│   │   ├── users/
│   │   │   ├── index.tsx                🚧 User list (~150 lines)
│   │   │   └── $userId.tsx              🚧 User detail (~200 lines)
│   │   ├── crisis.tsx                   🚧 Crisis management (~150 lines)
│   │   ├── analytics.tsx                🚧 Analytics (3 tabs) (~300 lines)
│   │   └── system.tsx                   🚧 System health (~150 lines)
│   └── components/
│       └── dashboard/
│           ├── UserTable.tsx            🚧 Table component (~200 lines)
│           ├── BurnoutChart.tsx         🚧 Recharts histogram (~80 lines)
│           ├── QualityMetrics.tsx       🚧 Eval metrics (~120 lines)
│           ├── RecentFeedback.tsx       🚧 Feedback table (~100 lines)
│           ├── CrisisAlert.tsx          🚧 Crisis card (~80 lines)
│           └── ... (more components)
├── vite.config.ts                       🚧 Vite config (~15 lines)
├── tsconfig.json                        🚧 TS config (~20 lines)
├── tailwind.config.ts                   🚧 Tailwind config (~50 lines)
├── package.json                         🚧 Dependencies (~40 lines)
└── index.html                           🚧 HTML template (~15 lines)
```

**Estimated**: ~1,800 lines remaining

---

## 🎯 Quick Decision Matrix

| Want | Then | Time |
|------|------|------|
| **See it work now** | Run setup commands → Test dashboard home | 30 min |
| **Build rest yourself** | Follow README.md → Create 5 pages | 8-12h |
| **I finish it** | Say "continue generating" → I create all files | 1-2h |
| **Mix** | Run setup → I generate pages → You customize | 3-4h |

---

## 💡 Recommendations

**For fastest working dashboard**:
1. ✅ Run Step 1-4 (setup) - **30 minutes**
2. ✅ Test dashboard home works - **5 minutes**
3. ✅ Say "continue generating" - **I finish remaining pages**
4. ✅ Test full dashboard - **30 minutes**
5. ✅ Deploy to Cloudflare Pages - **15 minutes**

**Total time**: ~1.5 hours to fully working dashboard

---

## 📊 Progress Tracker

- [x] Backend schema (conversationFeedback table)
- [x] Backend admin functions (6 functions)
- [x] Backend analytics functions (7 functions)
- [x] Frontend project structure
- [x] Frontend layout (sidebar, header, root)
- [x] Dashboard home page
- [ ] User list page
- [ ] User detail page
- [ ] Crisis management page
- [ ] Analytics page (3 tabs)
- [ ] System health page
- [ ] Deploy to Cloudflare Pages

**Progress**: 60% complete

---

## 🔥 Ready to Continue?

Choose your path:

1. **"setup now"** → I'll wait while you run commands (Step 1-4)
2. **"continue generating"** → I'll create all remaining files now
3. **"questions"** → Ask about anything unclear
4. **"pause"** → We'll continue later

What do you want to do?
