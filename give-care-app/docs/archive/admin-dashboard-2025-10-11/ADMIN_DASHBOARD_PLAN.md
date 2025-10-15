# GiveCare Admin Dashboard - Implementation Plan

**Version**: 1.0.0
**Last Updated**: 2025-10-10
**Status**: Planning
**Tech Stack**: Vite + React 19 + TypeScript + Convex + shadcn/ui + TanStack

---

## Executive Summary

Build a **real-time admin dashboard** hosted on Cloudflare Pages at `admin.givecare.app`, using Convex as the backend and shadcn/ui for the component library. The dashboard provides comprehensive visibility into:
- User management (search, filter, bulk actions)
- Crisis monitoring (real-time alerts, 24hr follow-ups)
- Analytics (burnout distribution, user funnels, SMS trends)
- **Quality evaluations** (empathy, clarity, trauma-informed scores with trends)
- System health (rate limits, API usage, errors)

**Expected Outcome**: 10x faster user management, <5min crisis response time, data-driven decision making, continuous quality monitoring.

**Relationship to DASHBOARDS_AND_EVALS.md**:
- **Admin Dashboard (this doc)** = Task 3 (implementation plan for React dashboard)
- **Quality Evaluations** = Integrated into Analytics page (Tab 2)
- **Evaluation Framework** = Task 5 (separate system for collecting feedback, running GPT-4 evals, GEPA optimization)
  - Evals run as standalone Node.js scripts (not part of React dashboard)
  - Eval results are **displayed** in the admin dashboard's Quality tab
  - Dashboard queries `conversation_feedback` table to show metrics

---

## Part 1: Architecture & Hosting

### 1.1 Hosting Strategy

**Frontend Hosting**: **Cloudflare Pages** (Recommended)
- Subdomain: `admin.givecare.app`
- Framework: Vite + React 19 (SPA mode)
- Auto-deploy from GitHub on push to `main`
- Edge caching for static assets (Cloudflare's global CDN)
- **Cost**: Free tier (unlimited bandwidth, unlimited requests)
- **Advantages over Vercel**: Free at any scale, faster global CDN, no bandwidth limits

**Backend**: **Convex** (Already Deployed)
- Database: Existing Convex schema (10 tables)
- Real-time subscriptions: Convex queries with live updates
- Admin functions: New `convex/functions/admin.ts` module
- **Cost**: Free tier (up to 1M function calls/month)

**Authentication**: **Clerk** or **Convex Auth** (Recommended: Convex Auth)
- Email/password for admin users
- Session persistence (JWT tokens)
- Role-based access control (admin role required)
- **Cost**: Free tier (up to 10k MAU for Clerk, unlimited for Convex Auth)

**Why NOT host on Convex directly?**
- Convex provides backend only (database + functions)
- Frontend hosting requires separate service (Cloudflare Pages, Vercel, Netlify)
- Cloudflare Pages integrates seamlessly with Vite/React builds + offers free unlimited bandwidth

---

### 1.2 Tech Stack

| Layer | Technology | Purpose | Why This Choice? |
|-------|------------|---------|------------------|
| **Build Tool** | Vite 6 | Fast dev server, HMR | 10x faster than CRA, native ESM |
| **Framework** | React 19 | UI rendering | Latest version, concurrent features |
| **Language** | TypeScript 5.7 | Type safety | Strict mode, generated Convex types |
| **State Management** | TanStack Query v5 | Server state | Convex real-time subscriptions |
| **Routing** | TanStack Router v1 | File-based routing | Type-safe routes, nested layouts |
| **UI Components** | shadcn/ui | Design system | Copy-paste, customizable, Radix UI |
| **Styling** | Tailwind CSS v4 | Utility-first CSS | Fast, consistent, mobile-first |
| **Theme Editor** | tweakcn.com | Interactive theming | Real-time preview, code generation |
| **Data Tables** | TanStack Table v8 | User lists | Server-side filtering, sorting, pagination |
| **Charts** | Recharts | Analytics visualizations | Responsive, customizable, composable |
| **Forms** | React Hook Form | Admin actions | Validation, error handling |
| **Backend** | Convex | Database + functions | Real-time, serverless, TypeScript SDK |
| **Auth** | Convex Auth | Admin login | Simple, integrated, no external deps |
| **Hosting** | Cloudflare Pages | Frontend CDN | Free unlimited bandwidth, git-based deploys, global edge network |

---

### 1.3 Project Structure

```
give-care-admin/                    # New directory (sibling to give-care-type)
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── routes/                     # TanStack Router file-based routes
│   │   ├── __root.tsx              # Layout wrapper (sidebar, header)
│   │   ├── index.tsx               # Dashboard home (metrics overview)
│   │   ├── users/                  # User management routes
│   │   │   ├── index.tsx           # User list (table)
│   │   │   └── $userId.tsx         # User detail view
│   │   ├── crisis.tsx              # Crisis management panel
│   │   ├── analytics.tsx           # Analytics & charts
│   │   └── system.tsx              # System health monitoring
│   ├── components/                 # shadcn/ui components + custom
│   │   ├── ui/                     # Auto-generated shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── dashboard/              # Dashboard-specific components
│   │   │   ├── MetricCard.tsx      # KPI card (e.g., "Total Users: 1,234")
│   │   │   ├── CrisisAlert.tsx     # Crisis user card with actions
│   │   │   ├── UserTable.tsx       # User list with filters
│   │   │   ├── BurnoutChart.tsx    # Burnout distribution histogram
│   │   │   └── SystemHealthCard.tsx # Rate limiter, API usage
│   │   └── layout/                 # Layout components
│   │       ├── Sidebar.tsx         # Navigation menu
│   │       ├── Header.tsx          # Top bar (search, admin profile)
│   │       └── PageContainer.tsx   # Content wrapper
│   ├── lib/                        # Utilities
│   │   ├── convex.ts               # Convex client setup
│   │   ├── utils.ts                # shadcn utils (cn, formatters)
│   │   └── constants.ts            # Dashboard constants
│   ├── hooks/                      # Custom React hooks
│   │   ├── useConvexQuery.ts       # Wrapper for Convex queries
│   │   └── useAdminAuth.ts         # Admin authentication check
│   └── styles/
│       └── globals.css             # Tailwind + custom styles
├── convex/                         # Shared with give-care-type (symlink)
│   └── functions/
│       ├── admin.ts                # NEW: Admin-specific queries/mutations
│       └── analytics.ts            # NEW: Analytics aggregations
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── tailwind.config.ts              # Tailwind v4 config
├── tsconfig.json
├── components.json                 # shadcn/ui config
└── package.json
```

**Key Decision**: **Monorepo or Separate Repo?**
- **Recommended**: Separate repo (`give-care-admin`) with symlink to `convex/` directory
- **Why**: Separate deployment, different access controls (admin vs user dashboard)
- **Alternative**: Turborepo monorepo with `apps/admin` and `apps/user`

---

### 1.4 Database Schema Additions

**New Table Required**: `conversation_feedback` (for evaluation/quality metrics)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables (users, conversations, assessments, etc.)

  // NEW: Conversation Feedback for Evaluations
  conversation_feedback: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    rating: v.number(), // 1-5 stars
    dimension: v.string(), // "empathy" | "clarity" | "trauma_informed" | "user_satisfaction"
    feedbackText: v.optional(v.string()), // Optional user comment
    timestamp: v.number(),
    source: v.string() // "user" | "gpt4_judge" | "manual_review"
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_dimension", ["dimension"])
    .index("by_conversation", ["conversationId"])
});
```

**When to Add This**:
- **Day 1** (optional): Add schema now but use mock data for Quality tab
- **Week 3** (recommended): Add schema when building evaluation collection system (DASHBOARDS_AND_EVALS.md Task 5, Phase 1)

**No Other Schema Changes Required**: Admin dashboard uses existing 10 tables (`users`, `conversations`, `assessments`, `wellness_scores`, `interventions`, `rateLimiters`, etc.)

---

## Part 2: Design System (shadcn/ui + tweakcn)

### 2.1 shadcn/ui Setup

**Installation** (from admin dashboard directory):
```bash
npx shadcn@latest init
```

**Configuration** (`components.json`):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Install Core Components** (for dashboard):
```bash
npx shadcn@latest add button card table badge avatar dropdown-menu dialog
npx shadcn@latest add form input select checkbox switch
npx shadcn@latest add chart alert separator skeleton
```

**Total Components Needed**: ~20 (installs locally, customizable)

---

### 2.2 Theme Design (tweakcn.com)

**Process**:
1. Go to https://tweakcn.com
2. Select base theme: **"Slate"** (professional, admin-friendly)
3. Customize colors:
   - **Primary**: `hsl(221 83% 53%)` (Blue - GiveCare brand)
   - **Destructive**: `hsl(0 84% 60%)` (Red - crisis alerts)
   - **Warning**: `hsl(38 92% 50%)` (Amber - high burnout)
   - **Success**: `hsl(142 76% 36%)` (Green - thriving)
4. Export theme code (CSS variables)
5. Copy to `src/styles/globals.css`

**Example Theme Output**:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --warning: 38 92% 50%;
    --success: 142 76% 36%;
    /* ... rest of theme variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode overrides */
  }
}
```

**Custom Dashboard Colors** (add to theme):
```css
:root {
  /* Burnout bands */
  --crisis: 0 84% 60%;        /* Red - burnout 80-100 */
  --high: 25 95% 53%;          /* Orange - burnout 60-79 */
  --moderate: 45 93% 47%;      /* Yellow - burnout 40-59 */
  --mild: 142 76% 36%;         /* Green - burnout 20-39 */
  --thriving: 221 83% 53%;     /* Blue - burnout 0-19 */

  /* Status colors */
  --active: 142 76% 36%;       /* Green - active users */
  --inactive: 215 20% 65%;     /* Gray - churned users */
  --priority: 262 83% 58%;     /* Purple - priority tier */
}
```

---

### 2.3 Component Library Structure

**Base Components** (from shadcn/ui):
- `Button` - Actions (send message, export CSV)
- `Card` - Metric cards, user cards
- `Table` - User list, conversation logs
- `Badge` - Status indicators (burnout band, journey phase)
- `Dialog` - Modals (send message, confirm actions)
- `Form` - Admin actions (send message form)
- `Input` - Search bars, filters
- `Select` - Dropdowns (journey phase filter)
- `Chart` - Analytics visualizations (via Recharts integration)
- `Alert` - Critical warnings (crisis alerts, rate limit warnings)

**Custom Components** (dashboard-specific):
```typescript
// src/components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: { value: number; trend: "up" | "down" };
  icon?: React.ReactNode;
  color?: "primary" | "destructive" | "warning" | "success";
}

// src/components/dashboard/CrisisAlert.tsx
interface CrisisAlertProps {
  user: {
    id: string;
    firstName: string;
    phoneNumber: string;
    burnoutScore: number;
    lastContactAt: number;
  };
  onSendMessage: (userId: string) => void;
  onViewDetails: (userId: string) => void;
}

// src/components/dashboard/UserTable.tsx
interface UserTableProps {
  users: User[];
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onUserClick: (userId: string) => void;
}
```

---

## Part 3: Dashboard Pages & Features

### 3.1 Page 1: Dashboard Home (Metrics Overview)

**Route**: `/` (`src/routes/index.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header (Search, Admin Profile, Notifications)         │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  METRICS OVERVIEW                            │
│         │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┤
│ • Home  │  │ 1,234│ │  892 │ │  12  │ │ 48.2 │ │ 42ms │
│ • Users │  │Users │ │Active│ │Crisis│ │Score │ │ p95  │
│ • Crisis│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
│ • Analyt│                                               │
│ • System│  RECENT ACTIVITY (Last 24h)                  │
│         │  ┌───────────────────────────────────────────┤
│         │  │ 🔴 Crisis Alert: Sarah J. (burnout 92)   │
│         │  │ 📊 Assessment Completed: Michael T.       │
│         │  │ 💬 SMS Volume: 2,847 messages sent        │
│         │  └───────────────────────────────────────────┘
└─────────┴──────────────────────────────────────────────┘
```

**Components Used**:
- 6 × `MetricCard` (Total users, Active users, Crisis alerts, Avg burnout, Response time, SMS usage)
- 1 × `Card` (Recent activity feed)
- Auto-refresh: Every 30 seconds via Convex subscription

**Convex Query**:
```typescript
// convex/functions/admin.ts
export const getSystemMetrics = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = users.filter(u => u.lastContactAt > sevenDaysAgo);
    const crisisUsers = users.filter(u => u.burnoutBand === "crisis");

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      crisisAlerts: crisisUsers.length,
      avgBurnoutScore: users.reduce((sum, u) => sum + (u.burnoutScore || 0), 0) / users.length,
      // ... more metrics
    };
  }
});
```

**React Component**:
```tsx
// src/routes/index.tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function DashboardHome() {
  const metrics = useQuery(api.admin.getSystemMetrics);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-5 gap-4">
      <MetricCard
        title="Total Users"
        value={metrics.totalUsers}
        icon={<Users />}
        color="primary"
      />
      <MetricCard
        title="Active Users (7d)"
        value={metrics.activeUsers}
        change={{ value: 12, trend: "up" }}
        icon={<Activity />}
        color="success"
      />
      <MetricCard
        title="Crisis Alerts (24h)"
        value={metrics.crisisAlerts}
        icon={<AlertTriangle />}
        color="destructive"
      />
      {/* ... more metric cards */}
    </div>
  );
}
```

---

### 3.2 Page 2: User Management

**Route**: `/users` (`src/routes/users/index.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  USER MANAGEMENT                             │
│         │  ┌─────────────────────────────────────────┐ │
│         │  │ Search: [____________] 🔍 Export CSV ⬇️  │ │
│         │  │ Filters: [Journey] [Burnout] [Status]   │ │
│         │  └─────────────────────────────────────────┘ │
│         │  ┌───┬──────────┬────────┬─────────┬───────┤│
│         │  │ ✓ │ Name     │Burnout │ Phase   │Actions││
│         │  ├───┼──────────┼────────┼─────────┼───────┤│
│         │  │ □ │Sarah J.  │  92    │ Crisis  │ View  ││
│         │  │ □ │Michael T.│  45    │ Active  │ View  ││
│         │  │ □ │Emily R.  │  12    │Thriving │ View  ││
│         │  └───┴──────────┴────────┴─────────┴───────┘│
│         │  Page 1 of 25 (1,234 users)     [<] [>]     │
└─────────┴──────────────────────────────────────────────┘
```

**Features**:
1. **Search** (by name, phone number)
2. **Filters**:
   - Journey Phase: All | Onboarding | Active | Maintenance | Crisis | Churned
   - Burnout Band: All | Crisis | High | Moderate | Mild | Thriving
   - Subscription: All | Active | Inactive | Past Due | Canceled
   - Date Range: Last 7d | 30d | 90d | All Time
3. **Bulk Actions**:
   - Export CSV (selected users or all)
   - Send Message (via Twilio)
   - Reset Assessment (clear current session)
4. **Table Columns**:
   - Checkbox (select)
   - Name (firstName + relationship)
   - Phone Number (masked: +1-XXX-XXX-1234)
   - Burnout Score (with color badge)
   - Journey Phase (badge)
   - Last Contact (relative time: "2 hours ago")
   - Actions (View, Send Message)

**Convex Query** (with filtering):
```typescript
// convex/functions/admin.ts
export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    burnoutBand: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    limit: v.number(),
    offset: v.number()
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users");

    // Apply filters
    if (args.journeyPhase) {
      query = query.filter(q => q.eq(q.field("journeyPhase"), args.journeyPhase));
    }
    if (args.burnoutBand) {
      query = query.filter(q => q.eq(q.field("burnoutBand"), args.burnoutBand));
    }
    if (args.subscriptionStatus) {
      query = query.filter(q => q.eq(q.field("subscriptionStatus"), args.subscriptionStatus));
    }

    const users = await query
      .order("desc")
      .paginate({ numItems: args.limit, cursor: null });

    return {
      users: users.page,
      hasMore: users.isDone === false,
      total: users.page.length
    };
  }
});
```

**React Component** (using TanStack Table):
```tsx
// src/components/dashboard/UserTable.tsx
import { useReactTable, getCoreRowModel, createColumnHelper } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor("firstName", {
    header: "Name",
    cell: (info) => `${info.getValue()} ${info.row.original.relationship || ""}`
  }),
  columnHelper.accessor("burnoutScore", {
    header: "Burnout",
    cell: (info) => (
      <Badge variant={getBurnoutVariant(info.getValue())}>
        {info.getValue()}
      </Badge>
    )
  }),
  columnHelper.accessor("journeyPhase", {
    header: "Phase",
    cell: (info) => <Badge>{info.getValue()}</Badge>
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <Button size="sm" onClick={() => handleView(info.row.original._id)}>
        View
      </Button>
    )
  })
];

export function UserTable({ users, filters, onFilterChange }) {
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return <Table>{/* ... table rendering */}</Table>;
}
```

---

### 3.3 Page 3: User Detail View

**Route**: `/users/$userId` (`src/routes/users/$userId.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  USER DETAILS: Sarah Johnson                │
│         │  ┌────────────────────────────────────────┐ │
│         │  │ 📊 WELLNESS OVERVIEW                   │ │
│         │  │ Current Score: 92 (Crisis Band) 🔴     │ │
│         │  │ [Burnout Trend Chart - Last 30 Days]   │ │
│         │  │ Pressure Zones: Physical, Financial    │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌────────────────────────────────────────┐ │
│         │  │ 💬 CONVERSATION HISTORY (Last 10)      │ │
│         │  │ User: I'm so exhausted...              │ │
│         │  │ Assistant: I hear you. Would you like..│ │
│         │  │ [Load More]                            │ │
│         │  └────────────────────────────────────────┘ │
│         │  ┌────────────────────────────────────────┐ │
│         │  │ 📋 ASSESSMENT HISTORY                  │ │
│         │  │ • CWBS (10/8) - Score: 28              │ │
│         │  │ • EMA (10/5) - Score: 3.2              │ │
│         │  └────────────────────────────────────────┘ │
│         │  [Send Message] [Reset Assessment]        │
└─────────┴──────────────────────────────────────────────┘
```

**Convex Query**:
```typescript
// convex/functions/admin.ts
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    // Wellness history (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const wellnessScores = await ctx.db
      .query("wellnessScores")
      .withIndex("by_user_recorded", q => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("recordedAt"), thirtyDaysAgo))
      .collect();

    // Conversation history (last 10)
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_time", q => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Assessment history
    const assessments = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("completed"), true))
      .order("desc")
      .take(5);

    return { user, wellnessScores, conversations, assessments };
  }
});
```

---

### 3.4 Page 4: Crisis Management

**Route**: `/crisis` (`src/routes/crisis.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  CRISIS MANAGEMENT                           │
│         │  🔴 CRITICAL ALERTS (12 users)               │
│         │  ┌───────────────────────────────────────┐  │
│         │  │ Sarah J. • Burnout: 92 • 2h ago       │  │
│         │  │ "I can't do this anymore..."          │  │
│         │  │ [Send Check-In] [View Details]        │  │
│         │  ├───────────────────────────────────────┤  │
│         │  │ Michael T. • Burnout: 88 • 5h ago     │  │
│         │  │ "Everything is falling apart"         │  │
│         │  │ [Send Check-In] [View Details]        │  │
│         │  └───────────────────────────────────────┘  │
│         │                                             │
│         │  ⏰ PENDING FOLLOW-UPS (5 users)            │
│         │  ┌───────────────────────────────────────┐  │
│         │  │ Emily R. • Follow-up due: 3h 24m      │  │
│         │  │ Last crisis: 21h ago                  │  │
│         │  │ [Send Now] [Snooze 4h]                │  │
│         │  └───────────────────────────────────────┘  │
└─────────┴──────────────────────────────────────────────┘
```

**Features**:
- **Critical Alerts**: Users with burnout ≥80 (crisis band)
- **Pending Follow-Ups**: Users requiring 24hr crisis follow-up (from `crisisFollowupCount`)
- **Countdown Timers**: Real-time countdown to next follow-up (via `setInterval`)
- **Quick Actions**: Send check-in message, view user details, snooze follow-up

**Convex Query**:
```typescript
// convex/functions/admin.ts
export const getCrisisAlerts = query({
  args: {},
  handler: async (ctx) => {
    // Users in crisis band
    const crisisUsers = await ctx.db
      .query("users")
      .withIndex("by_burnout_band", q => q.eq("burnoutBand", "crisis"))
      .collect();

    // Users pending 24hr follow-up
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const pendingFollowups = await ctx.db
      .query("users")
      .withIndex("by_crisis_event")
      .filter(q =>
        q.and(
          q.gte(q.field("lastCrisisEventAt"), oneDayAgo),
          q.lt(q.field("crisisFollowupCount"), 7) // Not yet completed 7-stage follow-up
        )
      )
      .collect();

    return { crisisUsers, pendingFollowups };
  }
});
```

---

### 3.5 Page 5: Analytics & Insights

**Route**: `/analytics` (`src/routes/analytics.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  ANALYTICS & INSIGHTS                        │
│         │  [Tabs: Usage | Quality | Performance]      │
│         │                                              │
│         │  TAB 1: USAGE ANALYTICS                      │
│         │  📊 BURNOUT DISTRIBUTION                     │
│         │  [Histogram: Score 0-100, grouped by 10s]    │
│         │                                              │
│         │  🚦 USER JOURNEY FUNNEL                      │
│         │  Onboarding: 345 →                           │
│         │  Active: 892 →                               │
│         │  Maintenance: 78 →                           │
│         │  Churned: 19                                 │
│         │                                              │
│         │  📱 SMS VOLUME TRENDS                         │
│         │  [Line Chart: Daily/Weekly messages]         │
│         │                                              │
│         │  TAB 2: QUALITY EVALUATIONS ⭐               │
│         │  📈 QUALITY TRENDS (Last 30 Days)            │
│         │  Empathy: 4.2/5 ⬆️ +0.3 (vs last week)       │
│         │  Clarity: 4.5/5 ➡️ ±0.0                      │
│         │  Trauma-Informed: 4.8/5 ⬆️ +0.1              │
│         │  User Satisfaction: 4.3/5 ⬆️ +0.2            │
│         │  [Line Chart: Quality scores over time]     │
│         │                                              │
│         │  📋 RECENT FEEDBACK (Last 10)                │
│         │  ┌──────────────────────────────────────┐   │
│         │  │ Sarah J. • 5⭐ • 2h ago                │   │
│         │  │ Empathy: "Very supportive and caring" │   │
│         │  │ [View Conversation]                   │   │
│         │  └──────────────────────────────────────┘   │
│         │                                              │
│         │  TAB 3: AGENT PERFORMANCE                    │
│         │  ⚡ AGENT PERFORMANCE                         │
│         │  Main Agent: 1,234 calls, 1.2s avg latency  │
│         │  Crisis Agent: 42 calls, 0.8s avg latency   │
│         │  Assessment Agent: 156 calls, 1.5s avg      │
└─────────┴──────────────────────────────────────────────┘
```

**Charts Used** (via Recharts):
- **Bar Chart**: Burnout distribution (histogram)
- **Funnel Chart**: User journey stages
- **Line Chart**: SMS volume trends, Quality scores over time
- **Area Chart**: Agent performance over time

**Convex Queries**:
```typescript
// convex/functions/analytics.ts

// Usage Analytics
export const getBurnoutDistribution = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Group by burnout score buckets (0-9, 10-19, ..., 90-100)
    const distribution = Array(10).fill(0);
    users.forEach(u => {
      const bucket = Math.floor((u.burnoutScore || 0) / 10);
      distribution[bucket]++;
    });

    return distribution.map((count, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      count
    }));
  }
});

// Quality Evaluations
export const getQualityMetrics = query({
  args: { days: v.optional(v.number()) }, // Default 30 days
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const feedback = await ctx.db
      .query("conversation_feedback")
      .withIndex("by_timestamp", q => q.gte("timestamp", startDate))
      .collect();

    // Calculate average ratings by dimension
    const dimensions = ["empathy", "clarity", "trauma_informed", "user_satisfaction"];
    const avgRatings = dimensions.map(dim => {
      const ratings = feedback.filter(f => f.dimension === dim);
      const avg = ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length || 0;
      return { dimension: dim, avgRating: avg, count: ratings.length };
    });

    // Calculate week-over-week change
    const lastWeekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const prevWeekStart = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const lastWeekRatings = feedback.filter(f => f.timestamp >= lastWeekStart);
    const prevWeekRatings = feedback.filter(f =>
      f.timestamp >= prevWeekStart && f.timestamp < lastWeekStart
    );

    const changes = dimensions.map(dim => {
      const lastWeekAvg = lastWeekRatings
        .filter(f => f.dimension === dim)
        .reduce((sum, f) => sum + f.rating, 0) /
        lastWeekRatings.filter(f => f.dimension === dim).length || 0;

      const prevWeekAvg = prevWeekRatings
        .filter(f => f.dimension === dim)
        .reduce((sum, f) => sum + f.rating, 0) /
        prevWeekRatings.filter(f => f.dimension === dim).length || 0;

      return { dimension: dim, change: lastWeekAvg - prevWeekAvg };
    });

    return { avgRatings, changes };
  }
});

export const getRecentFeedback = query({
  args: { limit: v.optional(v.number()) }, // Default 10
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const feedback = await ctx.db
      .query("conversation_feedback")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    // Join with users table to get user names
    const enrichedFeedback = await Promise.all(
      feedback.map(async (f) => {
        const user = await ctx.db.get(f.userId);
        return {
          ...f,
          userName: user?.firstName || "Unknown",
          timeAgo: getRelativeTime(f.timestamp)
        };
      })
    );

    return enrichedFeedback;
  }
});

// Helper function
function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
```

**React Components**:

```tsx
// src/routes/analytics.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BurnoutChart } from "@/components/dashboard/BurnoutChart";
import { QualityMetrics } from "@/components/dashboard/QualityMetrics";
import { RecentFeedback } from "@/components/dashboard/RecentFeedback";

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics & Insights</h1>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="quality">Quality Evaluations ⭐</TabsTrigger>
          <TabsTrigger value="performance">Agent Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Burnout Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <BurnoutChart />
            </CardContent>
          </Card>
          {/* User funnel, SMS trends, etc. */}
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <QualityMetrics />
          <RecentFeedback />
        </TabsContent>

        <TabsContent value="performance">
          {/* Agent performance metrics */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// src/components/dashboard/BurnoutChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function BurnoutChart() {
  const data = useQuery(api.analytics.getBurnoutDistribution);

  if (!data) return <div>Loading chart...</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// src/components/dashboard/QualityMetrics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";

export function QualityMetrics() {
  const metrics = useQuery(api.analytics.getQualityMetrics, { days: 30 });

  if (!metrics) return <div>Loading quality metrics...</div>;

  const getTrendIcon = (change: number) => {
    if (change > 0.1) return <ArrowUp className="text-green-500" />;
    if (change < -0.1) return <ArrowDown className="text-red-500" />;
    return <ArrowRight className="text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {metrics.avgRatings.map((dim) => {
            const change = metrics.changes.find(c => c.dimension === dim.dimension)?.change || 0;
            return (
              <Card key={dim.dimension}>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground capitalize">
                    {dim.dimension.replace('_', ' ')}
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {dim.avgRating.toFixed(1)}/5
                    {getTrendIcon(change)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {change > 0 ? '+' : ''}{change.toFixed(1)} vs last week
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dim.count} ratings
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* TODO: Add line chart showing quality over time */}
      </CardContent>
    </Card>
  );
}

// src/components/dashboard/RecentFeedback.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function RecentFeedback() {
  const feedback = useQuery(api.analytics.getRecentFeedback, { limit: 10 });

  if (!feedback) return <div>Loading recent feedback...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback (Last 10)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((f) => (
          <div key={f._id} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.userName}</span>
                <Badge variant="outline">{f.rating}⭐</Badge>
                <span className="text-sm text-muted-foreground">{f.timeAgo}</span>
              </div>
              <Button variant="ghost" size="sm">
                View Conversation
              </Button>
            </div>
            <div className="text-sm">
              <span className="font-medium capitalize">{f.dimension.replace('_', ' ')}:</span>{' '}
              {f.feedbackText || '(No comment)'}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

### 3.6 Page 6: System Health

**Route**: `/system` (`src/routes/system.tsx`)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  SYSTEM HEALTH MONITORING                    │
│         │  🚦 RATE LIMITER STATUS                      │
│         │  • Per-User Quota: 50/60 msg/day (OK)       │
│         │  • Global Quota: 2,847/5,000 msg/day (OK)   │
│         │  • Priority Tier: 12 active users            │
│         │                                              │
│         │  🤖 OPENAI API USAGE (Today)                 │
│         │  • Tokens Consumed: 1.2M / 2M (60%)         │
│         │  • Cost: $4.20 / $10.00 budget (42%)        │
│         │  • Quota Remaining: 40%                      │
│         │                                              │
│         │  💾 DATABASE PERFORMANCE                     │
│         │  • Query Latency (p95): 42ms (Good)         │
│         │  • Connection Pool: 8/10 active              │
│         │  • Storage Used: 1.2GB / 10GB (12%)         │
│         │                                              │
│         │  ⚠️ ERROR LOGS (Last 24h)                    │
│         │  • Twilio Send Failure: 3 errors            │
│         │  • OpenAI Timeout: 1 error                   │
│         │  • Rate Limit Hit: 0 errors                  │
└─────────┴──────────────────────────────────────────────┘
```

**Convex Query**:
```typescript
// convex/functions/admin.ts
export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    // Rate limiter status (query rateLimiters table - Task 2)
    const rateLimits = await ctx.db.query("rateLimiters").collect();

    // OpenAI API usage (aggregate from conversations table tokenUsage)
    const today = new Date().setHours(0, 0, 0, 0);
    const conversations = await ctx.db
      .query("conversations")
      .filter(q => q.gte(q.field("timestamp"), today))
      .collect();

    const totalTokens = conversations.reduce((sum, c) =>
      sum + (c.tokenUsage?.total || 0), 0
    );

    // Error logs (TODO: add errorLogs table)
    // For now, return placeholder data

    return {
      rateLimits: {
        perUserQuota: { used: 50, limit: 60 },
        globalQuota: { used: 2847, limit: 5000 },
        priorityUsers: 12
      },
      openai: {
        tokensConsumed: totalTokens,
        tokensLimit: 2000000,
        costToday: totalTokens * 0.000003, // $3 per 1M tokens estimate
        budget: 10
      },
      database: {
        queryLatency: 42, // ms (p95) - TODO: instrument queries
        connectionPoolActive: 8,
        connectionPoolMax: 10,
        storageUsed: 1.2, // GB
        storageLimit: 10
      }
    };
  }
});
```

---

## Part 4: Implementation Timeline

### Phase 1: Setup (Week 1 - Days 1-5)

**Day 1: Project Initialization**
- [ ] Create `give-care-admin/` directory
- [ ] Initialize Vite + React 19 + TypeScript project
- [ ] Install dependencies:
  ```bash
  npm create vite@latest give-care-admin -- --template react-ts
  cd give-care-admin
  npm install
  npm install convex @tanstack/react-query @tanstack/react-router @tanstack/react-table
  npm install recharts react-hook-form zod
  npm install -D tailwindcss@next postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Configure Tailwind CSS v4
- [ ] Setup shadcn/ui:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card table badge dialog form input select chart
  ```

**Day 2: Authentication & Layout**
- [ ] Setup Convex Auth (email/password for admins)
- [ ] Create layout components:
  - [ ] `Sidebar.tsx` (navigation menu)
  - [ ] `Header.tsx` (search bar, admin profile)
  - [ ] `PageContainer.tsx` (content wrapper)
- [ ] Setup TanStack Router (file-based routing)
- [ ] Implement protected routes (admin role required)

**Day 3: Theme & Design System**
- [ ] Go to https://tweakcn.com
- [ ] Customize theme (primary: blue, destructive: red, warning: amber, success: green)
- [ ] Export theme CSS variables to `src/styles/globals.css`
- [ ] Add custom burnout band colors (crisis, high, moderate, mild, thriving)
- [ ] Test dark mode toggle

**Day 4-5: Convex Functions**
- [ ] Create `convex/functions/admin.ts`:
  - [ ] `getSystemMetrics` (dashboard overview)
  - [ ] `getAllUsers` (user list with filters)
  - [ ] `getUserDetails` (user detail view)
  - [ ] `getCrisisAlerts` (crisis users + pending follow-ups)
  - [ ] `sendAdminMessage` (mutation: send SMS via Twilio)
- [ ] Create `convex/functions/analytics.ts`:
  - [ ] `getBurnoutDistribution` (histogram data)
  - [ ] `getUserJourneyFunnel` (funnel data)
  - [ ] `getDailyMetrics` (time-series SMS volume)
  - [ ] `getAgentPerformance` (latency by agent)
  - [ ] `getQualityMetrics` (evaluation scores by dimension)
  - [ ] `getRecentFeedback` (last 10 user ratings)

---

### Phase 2: Core Pages (Week 2 - Days 6-10)

**Day 6: Dashboard Home**
- [ ] Create `src/routes/index.tsx`
- [ ] Build `MetricCard.tsx` component (6 KPIs)
- [ ] Integrate `getSystemMetrics` query
- [ ] Add auto-refresh (30 seconds)
- [ ] Test real-time updates

**Day 7: User Management (List)**
- [ ] Create `src/routes/users/index.tsx`
- [ ] Build `UserTable.tsx` component (TanStack Table)
- [ ] Implement filters (journey phase, burnout band, subscription status)
- [ ] Add search bar (by name, phone)
- [ ] Implement pagination (50 users per page)

**Day 8: User Management (Detail)**
- [ ] Create `src/routes/users/$userId.tsx`
- [ ] Display wellness overview (current score, trend chart)
- [ ] Show conversation history (last 10 messages)
- [ ] Show assessment history (last 5 completed)
- [ ] Add actions (send message, reset assessment)

**Day 9: Crisis Management**
- [ ] Create `src/routes/crisis.tsx`
- [ ] Build `CrisisAlert.tsx` component (user card with actions)
- [ ] Display critical alerts (burnout ≥80)
- [ ] Display pending follow-ups (with countdown timers)
- [ ] Add quick actions (send check-in, view details, snooze)

**Day 10: Analytics & Quality**
- [ ] Create `src/routes/analytics.tsx` with tabs (Usage | Quality | Performance)
- [ ] **Tab 1 (Usage):**
  - [ ] Build `BurnoutChart.tsx` (Recharts bar chart)
  - [ ] Build `UserJourneyFunnel.tsx` (funnel visualization)
  - [ ] Build `SMSVolumeChart.tsx` (line chart)
- [ ] **Tab 2 (Quality Evaluations):**
  - [ ] Build `QualityMetrics.tsx` (4 metric cards with trends)
  - [ ] Build `RecentFeedback.tsx` (last 10 ratings table)
  - [ ] Use mock data if `conversation_feedback` table not yet populated
- [ ] **Tab 3 (Performance):**
  - [ ] Build `AgentPerformanceCard.tsx` (metrics by agent)

---

### Phase 3: Polish & Deploy (Week 3 - Days 11-14)

**Day 11: System Health**
- [ ] Create `src/routes/system.tsx`
- [ ] Display rate limiter status (per-user, global quotas)
- [ ] Display OpenAI API usage (tokens, cost, quota remaining)
- [ ] Display database performance (query latency, connection pool)
- [ ] TODO: Add error logs table + integration

**Day 12: Mobile Responsive**
- [ ] Test all pages on tablet/mobile (Chrome DevTools)
- [ ] Adjust table columns (collapse on mobile)
- [ ] Make sidebar collapsible (hamburger menu on mobile)
- [ ] Test touch interactions (buttons min 44px)

**Day 13: Performance & Testing**
- [ ] Lighthouse audit (target: 90+ performance score)
- [ ] Test real-time updates (multiple tabs, auto-refresh)
- [ ] Test bulk actions (export CSV, send message)
- [ ] Test error handling (network failures, API errors)

**Day 14: Deploy to Cloudflare Pages**
- [ ] Create Cloudflare Pages project (connect GitHub repo)
- [ ] Configure build settings (Vite build command, output directory)
- [ ] Configure environment variables (Convex deployment URL)
- [ ] Setup custom domain: `admin.givecare.app`
- [ ] Test production build
- [ ] Enable auto-deploy on push to `main`

---

## Part 5: Advanced Features (Future Enhancements)

### 5.1 Phase 4: Admin Actions (Week 4)

**Send Message to User** (mutation):
```typescript
// convex/functions/admin.ts
export const sendAdminMessage = mutation({
  args: {
    userId: v.id("users"),
    message: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Send SMS via Twilio (reuse existing twilioSendSMS helper)
    await twilioSendSMS(user.phoneNumber, args.message);

    // Log conversation
    await ctx.db.insert("conversations", {
      userId: args.userId,
      role: "assistant",
      text: args.message,
      mode: "sms",
      agentName: "admin",
      timestamp: Date.now()
    });

    return { success: true };
  }
});
```

**React Component** (dialog with form):
```tsx
// src/components/dashboard/SendMessageDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function SendMessageDialog({ userId, open, onClose }) {
  const sendMessage = useMutation(api.admin.sendAdminMessage);

  const onSubmit = async (data) => {
    await sendMessage({ userId, message: data.message });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message to User</DialogTitle>
        </DialogHeader>
        <Form onSubmit={onSubmit}>
          <FormField name="message">
            <FormLabel>Message</FormLabel>
            <FormControl>
              <Textarea placeholder="Type your message here..." />
            </FormControl>
          </FormField>
          <Button type="submit">Send</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.2 Phase 5: Audit Logs (Future)

**Schema Addition**:
```typescript
// convex/schema.ts
auditLogs: defineTable({
  adminId: v.string(), // Email of admin who performed action
  action: v.string(), // "send_message" | "reset_assessment" | "export_csv"
  targetUserId: v.optional(v.id("users")),
  metadata: v.any(), // Additional context (e.g., message content)
  timestamp: v.number()
})
  .index("by_admin", ["adminId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_action", ["action"])
```

**Query**:
```typescript
export const getAuditLogs = query({
  args: {
    adminId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.number()
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs");

    if (args.adminId) {
      query = query.withIndex("by_admin", q => q.eq("adminId", args.adminId));
    }

    const logs = await query
      .filter(q => {
        const conditions = [];
        if (args.startDate) conditions.push(q.gte(q.field("timestamp"), args.startDate));
        if (args.endDate) conditions.push(q.lte(q.field("timestamp"), args.endDate));
        return conditions.length > 0 ? q.and(...conditions) : true;
      })
      .order("desc")
      .take(args.limit);

    return logs;
  }
});
```

**UI**:
- Add "Audit Logs" link to sidebar
- Display table with admin email, action, target user, timestamp
- Filters: By admin, by action type, by date range

---

### 5.3 Phase 6: Real-Time Notifications (Future)

**Feature**: Toast notifications for critical events (new crisis alert, rate limit hit)

**Implementation**:
- Use shadcn/ui `Sonner` (toast library)
- Subscribe to `getCrisisAlerts` query
- Show toast when new crisis user detected

```tsx
// src/routes/__root.tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export function Root() {
  const crisisAlerts = useQuery(api.admin.getCrisisAlerts);
  const prevCount = useRef(0);

  useEffect(() => {
    if (crisisAlerts && crisisAlerts.crisisUsers.length > prevCount.current) {
      const newUser = crisisAlerts.crisisUsers[0];
      toast.error(`New Crisis Alert: ${newUser.firstName} (burnout ${newUser.burnoutScore})`);
    }
    prevCount.current = crisisAlerts?.crisisUsers.length || 0;
  }, [crisisAlerts]);

  return <Outlet />;
}
```

---

## Part 6: Deployment Checklist

### 6.1 Pre-Deployment

**Code Quality**:
- [ ] All TypeScript errors resolved (strict mode)
- [ ] ESLint warnings addressed
- [ ] Prettier formatting applied
- [ ] No console.log statements (use proper logging)

**Testing**:
- [ ] All pages load without errors
- [ ] Filters work correctly (user table)
- [ ] Real-time updates functional (30-second auto-refresh)
- [ ] Crisis alerts display correctly
- [ ] Charts render properly (Recharts)
- [ ] Mobile responsive (tablet + phone)

**Performance**:
- [ ] Lighthouse audit: 90+ performance score
- [ ] Query latency <1s (p95)
- [ ] Dashboard loads in <2s
- [ ] No memory leaks (React DevTools Profiler)

**Security**:
- [ ] Admin authentication required (Convex Auth)
- [ ] Protected routes (redirect to login if not authenticated)
- [ ] Phone numbers masked in UI (+1-XXX-XXX-1234)
- [ ] Environment variables not exposed (CONVEX_URL in .env.local)

---

### 6.2 Cloudflare Pages Deployment

**Step 1: Create Cloudflare Pages Project**
```bash
# Option A: Deploy via Cloudflare Dashboard (Recommended)
# 1. Go to https://dash.cloudflare.com
# 2. Click "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
# 3. Select your GitHub repo (give-care-admin)
# 4. Configure build settings:
#    - Build command: npm run build
#    - Build output directory: dist
#    - Environment variables: VITE_CONVEX_URL = https://YOUR_DEPLOYMENT.convex.cloud

# Option B: Deploy via Wrangler CLI
npm install -g wrangler
wrangler login
wrangler pages deploy dist --project-name=give-care-admin
```

**Step 2: Configure Build Settings**
- **Framework preset**: None (or Vite if available)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node version**: `18` or `20` (set via environment variable `NODE_VERSION`)

**Step 3: Environment Variables**
- Go to Cloudflare dashboard → Workers & Pages → give-care-admin → Settings → Environment Variables
- Add `VITE_CONVEX_URL` = `https://YOUR_DEPLOYMENT.convex.cloud`
- **Important**: Use `VITE_` prefix for Vite to inject at build time
- **Scope**: Production (also add to Preview if you want preview deployments to work)

**Step 4: Custom Domain**
- Go to Cloudflare dashboard → Workers & Pages → give-care-admin → Custom domains
- Add custom domain: `admin.givecare.app`
- **If domain is on Cloudflare DNS** (recommended):
  - Click "Add domain" → Cloudflare automatically creates CNAME record
  - SSL certificate provisioned automatically (instant)
- **If domain is on external DNS**:
  - Create CNAME record: `admin.givecare.app` → `give-care-admin.pages.dev`
  - SSL certificate may take a few minutes

**Step 5: Enable Auto-Deploy**
- Cloudflare Pages automatically connected to GitHub repo
- Every push to `main` branch triggers automatic deployment
- Every pull request gets preview deployment (e.g., `pr-123.give-care-admin.pages.dev`)
- Preview deployments include environment variables (if set for "Preview" scope)

---

### 6.3 Post-Deployment

**Monitoring**:
- [ ] Verify dashboard loads at `admin.givecare.app`
- [ ] Test authentication (create admin user)
- [ ] Test real-time updates (open 2 tabs, trigger event in one)
- [ ] Check Cloudflare Pages Analytics (page views, bandwidth - free tier includes basic analytics)
- [ ] Monitor Convex usage (function calls, bandwidth)
- [ ] Test edge caching (static assets should load instantly from nearest Cloudflare datacenter)

**User Acceptance Testing**:
- [ ] Invite clinical supervisor to test crisis management
- [ ] Invite operations team to test user management
- [ ] Gather feedback on UX/UI
- [ ] Prioritize feature requests

---

## Part 7: Cost Estimate

### 7.1 Monthly Costs

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Convex** | Free → Team | $0 → $25/month | Free: 1M function calls, 1GB storage; Team: 10M calls, 10GB storage |
| **Cloudflare Pages** | Free | $0 | **Unlimited bandwidth**, unlimited requests, 500 builds/month |
| **Convex Auth** | Included | $0 | Unlimited admins (vs Clerk $25/month for 10k MAU) |
| **Domain** | (existing) | $0 | Assumes `givecare.app` already owned |
| **TOTAL** | | **$0-$25/month** | Free tier sufficient for <100 admins, unlimited traffic |

**Recommendation**: Start with **free tier** ($0/month), upgrade when needed:
- Upgrade Convex to Team ($25) when >1M function calls/month
- **Cloudflare Pages remains free** at any scale (no bandwidth charges ever)

---

### 7.2 Development Costs (One-Time)

| Phase | Duration | Effort | Cost (if outsourced) |
|-------|----------|--------|---------------------|
| Phase 1: Setup | 5 days | 40 hours | $4,000 (@ $100/hr) |
| Phase 2: Core Pages | 5 days | 40 hours | $4,000 |
| Phase 3: Polish & Deploy | 4 days | 32 hours | $3,200 |
| **TOTAL** | **14 days** | **112 hours** | **$11,200** |

**If building in-house**:
- Junior developer: 3-4 weeks full-time
- Senior developer: 2 weeks full-time
- Founder (part-time): 4-6 weeks @ 20 hrs/week

---

## Part 8: Success Metrics

### 8.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Dashboard Load Time** | <2s | Lighthouse Performance score 90+ |
| **Query Latency** | <1s (p95) | Convex dashboard analytics |
| **Real-Time Update Delay** | <30s | Auto-refresh every 30s via subscription |
| **Uptime** | 99.99% | Cloudflare Pages (99.99% uptime) + Convex (99.9% SLA) |
| **Mobile Responsive** | 100% pages | Manual testing on tablet + phone |

---

### 8.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Support Time Reduction** | 50% | Time to look up user info (before: 5min, after: 30sec) |
| **Crisis Response Time** | <5min | Time from alert to action (dashboard alert → send check-in) |
| **Data-Driven Decisions** | 100% leadership | Weekly metrics review using analytics page |
| **Admin Satisfaction** | 8/10 NPS | Survey clinical supervisors, operations team |

---

## Part 9: Maintenance & Iteration

### 9.1 Weekly Tasks

- [ ] Review system health metrics (rate limits, API usage)
- [ ] Check crisis alerts (ensure no pending follow-ups missed)
- [ ] Monitor Convex function call usage (approach limits?)
- [ ] Review error logs (Twilio failures, OpenAI timeouts)

---

### 9.2 Monthly Tasks

- [ ] Lighthouse audit (performance regression check)
- [ ] User feedback review (feature requests, bug reports)
- [ ] Analytics review (user growth, burnout trends, SMS volume)
- [ ] Convex billing review (upgrade if needed - Cloudflare Pages remains free)
- [ ] Security audit (admin access logs, failed login attempts)

---

### 9.3 Quarterly Roadmap

**Q1 2026** (Months 1-3):
- [ ] Launch admin dashboard MVP (Phases 1-3)
- [ ] Train clinical supervisors + operations team
- [ ] Gather user feedback (NPS survey)

**Q2 2026** (Months 4-6):
- [ ] Add audit logs (Phase 5)
- [ ] Add real-time notifications (Phase 6)
- [ ] Build user dashboard (see `DASHBOARDS_AND_EVALS.md` Task 4)

**Q3 2026** (Months 7-9):
- [ ] Add evaluation framework (see `DASHBOARDS_AND_EVALS.md` Task 5)
- [ ] GEPA prompt optimization (when 100+ rated conversations available)

---

## Part 10: FAQ

### Q1: Can Convex host the frontend?
**A**: No. Convex provides backend only (database + functions). Frontend must be hosted on Vercel, Cloudflare Pages, or similar.

### Q2: Why Cloudflare Pages over Vercel?
**A**: Both are excellent, but Cloudflare Pages has significant advantages for this use case:

| Feature | Cloudflare Pages | Vercel |
|---------|------------------|--------|
| **Bandwidth** | **Unlimited (free)** | 100GB free, then $20/month |
| **Requests** | **Unlimited (free)** | Unlimited free |
| **Build minutes** | 500/month (free) | 6,000/month (free) |
| **Edge network** | **275+ cities** | 100+ cities |
| **DDoS protection** | **Included free** | Pro plan only ($20/month) |
| **Web Application Firewall** | Available ($5/month) | Not available |
| **Custom domains** | Unlimited (free) | Unlimited (free) |
| **Preview deployments** | **Unlimited (free)** | Unlimited (free) |

**Recommendation**: **Cloudflare Pages** for this project (free at any scale, better performance, more secure).

### Q3: Can I use Supabase instead of Convex Auth?
**A**: Yes, but not recommended. Convex Auth is simpler (no external dependency), free (unlimited admins), and integrated with Convex queries. Supabase Auth adds complexity (separate service, API keys, CORS).

### Q4: How do I test locally without deploying?
**A**:
```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Start Vite dev server
npm run dev

# Open http://localhost:5173 (Vite dev server)
# Convex will use dev deployment (dev.convex.cloud)
```

**Testing Production Build Locally**:
```bash
# Build for production
npm run build

# Preview production build locally (using Vite's preview server)
npm run preview

# Or use Wrangler to test Cloudflare Pages environment locally
npx wrangler pages dev dist
```

### Q5: How do I add new shadcn/ui components?
**A**:
```bash
npx shadcn@latest add <component-name>
# Example: npx shadcn@latest add dropdown-menu

# Component added to: src/components/ui/dropdown-menu.tsx
# Import in your page: import { DropdownMenu } from "@/components/ui/dropdown-menu"
```

### Q6: Can I use dark mode?
**A**: Yes! shadcn/ui includes dark mode by default (via Tailwind dark mode). Add theme toggle button:
```bash
npx shadcn@latest add theme-toggle
# Adds theme provider + toggle button component
```

### Q7: How do I customize the theme (colors)?
**A**:
1. Go to https://tweakcn.com
2. Adjust colors (primary, destructive, etc.)
3. Copy generated CSS variables
4. Paste into `src/styles/globals.css`
5. Refresh dashboard (colors update instantly)

### Q8: How do I debug Convex queries?
**A**:
- Open Convex dashboard: https://dashboard.convex.dev
- Go to "Logs" tab
- Filter by function name (e.g., `admin:getSystemMetrics`)
- See query results, errors, execution time
- **Tip**: Add `console.log()` in Convex functions (shows in logs)

### Q9: How do I handle admin authentication?
**A**: Use Convex Auth (simplest):
```bash
npm install @convex-dev/auth
npx convex dev --once # Generate auth tables
```
Follow Convex Auth docs: https://docs.convex.dev/auth

### Q10: Can I reuse components from give-care-user dashboard?
**A**: Yes! If both dashboards use shadcn/ui, components are compatible. Copy components from `give-care-user/src/components/` to `give-care-admin/src/components/`. **Tip**: Consider creating shared component library (npm package or monorepo).

---

## Conclusion

**You now have a complete plan** to build a production-ready admin dashboard with:
- ✅ Modern tech stack (Vite, React 19, TypeScript, Convex, shadcn/ui)
- ✅ Real-time data (Convex subscriptions, auto-refresh)
- ✅ Beautiful UI (shadcn/ui + tweakcn theming)
- ✅ 6 core pages (dashboard, users, crisis, analytics, system health)
- ✅ 14-day implementation timeline
- ✅ Hosting on Vercel ($0-$45/month)
- ✅ Success metrics & maintenance plan

**Next Steps**:
1. **Review this plan** with your team
2. **Decision**: Separate repo or monorepo?
3. **Day 1**: Initialize project, install dependencies
4. **Week 1**: Setup + authentication + layout
5. **Week 2**: Build core pages (dashboard, users, crisis, analytics)
6. **Week 3**: Polish + deploy to Vercel
7. **Launch**: Train admins, gather feedback, iterate

**Questions?** Let me know which phase you'd like to start with, and I can create detailed implementation guides for each component!
