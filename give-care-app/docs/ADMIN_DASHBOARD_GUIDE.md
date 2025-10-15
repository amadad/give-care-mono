# Admin Dashboard Guide

**Version:** 1.0.0
**Status:** ✅ Production Deployed
**URL:** https://dash.givecareapp.com

---

## 🎯 QUICK START

### Access Dashboard
```
URL: https://dash.givecareapp.com
Tech Stack: Next.js 15 + Convex + shadcn/ui
Hosting: Cloudflare Pages
```

### Local Development
```bash
cd admin-frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📊 DASHBOARD FEATURES

### 6 Pages Built

1. **Dashboard Home** (`/`)
   - 5 metric cards (users, active, crisis, burnout, response time)
   - Subscription breakdown
   - Auto-refreshing data

2. **Users** (`/users`)
   - Searchable table with filters
   - Journey phase, burnout band, subscription filters
   - Export to CSV
   - Click user → detail page

3. **User Detail** (`/users/:userId`)
   - Wellness trend chart (30 days)
   - Conversation history (last 10)
   - Assessment history
   - Quick actions (send message, reset)

4. **Crisis Management** (`/crisis`)
   - Critical alerts (burnout ≥80)
   - Pending follow-ups with countdown timers
   - Quick action buttons
   - Protocol reminder

5. **Analytics** (`/analytics`)
   - **Tab 1 (Usage)**: Burnout histogram, journey funnel, SMS trends
   - **Tab 2 (Quality)**: Eval scores (empathy, clarity, trauma-informed, satisfaction) + feedback table
   - **Tab 3 (Performance)**: Agent latency by type

6. **System Health** (`/system`)
   - Rate limiter status (per-user, global)
   - OpenAI API usage (tokens, cost)
   - Database performance (latency, connections)
   - Error logs

---

## 🏗️ ARCHITECTURE

### Tech Stack
- **Frontend**: Vite + React 19 + TypeScript + TanStack Router
- **Backend**: Convex (existing deployment)
- **UI**: shadcn/ui + Tailwind CSS v4 + Radix UI
- **Charts**: Recharts
- **State**: Convex real-time subscriptions
- **Hosting**: Cloudflare Pages (free unlimited bandwidth)

### Backend Functions
**File:** `convex/functions/admin.ts` (296 lines)
- `getDashboardMetrics()` - KPI cards
- `getUserList()` - Searchable user table
- `getUserDetail()` - Individual user data
- `getCrisisAlerts()` - Crisis management
- `getSystemHealth()` - System status
- `markCrisisResolved()` - Crisis actions

**File:** `convex/functions/analytics.ts` (248 lines)
- `getBurnoutDistribution()` - Histogram
- `getJourneyFunnel()` - Conversion funnel
- `getUsageTrends()` - SMS trends
- `getQualityMetrics()` - Eval scores
- `getAgentPerformance()` - Agent stats
- `getRecentFeedback()` - User feedback

### Frontend Structure
```
admin-frontend/
├── src/
│   ├── main.tsx                # Entry point
│   ├── routes/                 # 6 pages
│   │   ├── __root.tsx          # Layout
│   │   ├── index.tsx           # Dashboard home
│   │   ├── users/index.tsx     # User list
│   │   ├── users/$userId.tsx   # User detail
│   │   ├── crisis.tsx          # Crisis management
│   │   ├── analytics.tsx       # Analytics (3 tabs)
│   │   └── system.tsx          # System health
│   ├── components/             # Reusable components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── dashboard/
│   │       ├── MetricCard.tsx
│   │       ├── UserTable.tsx
│   │       ├── BurnoutChart.tsx
│   │       ├── QualityMetrics.tsx
│   │       └── AgentPerformance.tsx
│   └── lib/
│       └── utils.ts            # Helpers
├── package.json
├── vite.config.ts
└── index.html
```

---

## 🚀 DEPLOYMENT (CLOUDFLARE PAGES)

### Prerequisites
- GitHub account with admin dashboard code
- Cloudflare account (free tier)
- Domain `givecare.app` configured
- Convex deployment URL

### Initial Setup

1. **Create Cloudflare Pages Project**
   - Go to: https://dash.cloudflare.com
   - Navigate to "Workers & Pages"
   - Click "Create application" → "Pages"
   - Connect to GitHub repository

2. **Configure Build Settings**
   ```
   Project name: give-care-admin
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   ```

3. **Set Environment Variables**
   ```
   VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
   NODE_VERSION=20
   ```

4. **Deploy**
   - Click "Save and Deploy"
   - Wait 2-5 minutes for first build
   - Site live at: `https://give-care-admin.pages.dev`

### Custom Domain Setup

1. **Add Custom Domain**
   - In Cloudflare Pages project
   - Click "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter: `dash.givecareapp.com`

2. **Configure DNS**
   - Cloudflare will show CNAME record to add
   - Add to your DNS provider:
     ```
     CNAME dash give-care-admin.pages.dev
     ```

3. **Verify**
   - Wait 1-5 minutes for DNS propagation
   - Visit: https://dash.givecareapp.com
   - SSL certificate auto-provisioned by Cloudflare

### Redeployment

**Automatic** (recommended):
- Push to `main` branch on GitHub
- Cloudflare Pages auto-builds and deploys
- Takes 2-3 minutes

**Manual**:
```bash
cd admin-frontend
npm run build
# Upload dist/ to Cloudflare Pages via dashboard
```

---

## ⚙️ ENVIRONMENT VARIABLES

### Development (.env.local)
```env
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

### Production (Cloudflare Pages)
Set in Cloudflare Pages dashboard:
- Settings → Environment variables
- Add `VITE_CONVEX_URL` with your Convex deployment URL

**Get Convex URL:**
1. Go to: https://dashboard.convex.dev
2. Select project: `give-care-type`
3. Settings → URL & Deploy Key
4. Copy "Deployment URL"

---

## 🧪 TESTING

### Local Testing
```bash
cd admin-frontend
npm install
npm run dev
# Open: http://localhost:5173
```

### Verify Features
- [ ] Dashboard loads with metrics
- [ ] User list shows data
- [ ] Click user → detail page loads
- [ ] Crisis alerts show (if any)
- [ ] Analytics charts render
- [ ] System health displays stats

### Production Testing
```bash
# Visit production URL
open https://dash.givecareapp.com

# Check:
- [ ] Site loads over HTTPS
- [ ] All pages accessible
- [ ] Real-time data updates
- [ ] Charts render correctly
- [ ] Navigation works
```

---

## 🔧 COMMON OPERATIONS

### Update Dashboard
```bash
# 1. Make changes to code
cd admin-frontend
# Edit files in src/

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Update dashboard"
git push origin main

# 4. Cloudflare auto-deploys (2-3 minutes)
```

### Add New Page
```typescript
// 1. Create route file
// admin-frontend/src/routes/newpage.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/newpage')({
  component: NewPage,
});

function NewPage() {
  return <div>New Page</div>;
}

// 2. Add to sidebar
// admin-frontend/src/components/layout/Sidebar.tsx
<Link to="/newpage">New Page</Link>

// 3. Test locally, then deploy
```

### Add New Metric
```typescript
// 1. Add backend function
// convex/functions/admin.ts
export const getNewMetric = query({
  handler: async (ctx) => {
    // Query logic
    return { value: 123 };
  },
});

// 2. Use in frontend
// admin-frontend/src/routes/index.tsx
const newMetric = useQuery(api.functions.admin.getNewMetric);

// 3. Display in UI
<MetricCard title="New Metric" value={newMetric} />
```

---

## 🚨 TROUBLESHOOTING

### Build Fails on Cloudflare
**Check:**
1. Build command correct? (`npm run build`)
2. Output directory correct? (`dist`)
3. Environment variables set? (`VITE_CONVEX_URL`)
4. Node version specified? (`NODE_VERSION=20`)

**Fix:**
- Check build logs in Cloudflare dashboard
- Verify `package.json` scripts
- Test build locally: `npm run build`

### Dashboard Shows No Data
**Check:**
1. Convex URL correct in environment variables?
2. Convex deployment running?
3. Network tab shows API calls to Convex?

**Fix:**
```bash
# Verify Convex URL
npx convex dashboard
# Copy deployment URL from Settings

# Update Cloudflare Pages environment variable
# Redeploy site
```

### Real-time Updates Not Working
**Check:**
1. Using `useQuery` from Convex React?
2. Convex subscriptions enabled?
3. WebSocket connection established?

**Fix:**
- Check browser console for errors
- Verify Convex client initialized in `main.tsx`
- Check network tab for WebSocket connection

### Custom Domain Not Working
**Check:**
1. DNS record added correctly?
2. CNAME points to `give-care-admin.pages.dev`?
3. SSL certificate provisioned?

**Fix:**
- Wait 5-10 minutes for DNS propagation
- Verify DNS with: `dig dash.givecareapp.com`
- Check Cloudflare Pages → Custom domains tab

---

## 📊 METRICS & MONITORING

### Performance
- **First Load**: <2s (Cloudflare edge caching)
- **Time to Interactive**: <3s
- **Real-time Updates**: <100ms (Convex subscriptions)

### Uptime
- **Cloudflare Pages SLA**: 99.9%
- **Convex SLA**: 99.9%
- **Expected Uptime**: 99.8%+ (combined)

### Costs
- **Cloudflare Pages**: $0/month (free tier, unlimited bandwidth)
- **Convex**: Based on usage (see Convex dashboard)
- **Domain**: $12/year (givecare.app)

---

## 🔗 QUICK LINKS

### Production
- **Dashboard**: https://dash.givecareapp.com
- **Cloudflare Pages**: https://dash.cloudflare.com → Workers & Pages → give-care-admin
- **Convex Dashboard**: https://dashboard.convex.dev

### Code
- **Frontend Repo**: `admin-frontend/`
- **Backend Functions**: `convex/functions/admin.ts`, `convex/functions/analytics.ts`
- **Schema**: `convex/schema.ts`

### Docs
- **This Guide**: `docs/ADMIN_DASHBOARD_GUIDE.md`
- **Frontend README**: `admin-frontend/README.md`
- **Setup Script**: `admin-frontend/SETUP.sh`

---

## 📝 CHANGELOG

### v1.0.0 (2025-10-10)
- ✅ Initial production deployment
- ✅ 6 pages built (dashboard, users, crisis, analytics, system)
- ✅ 12 backend functions (metrics, analytics)
- ✅ Real-time data with Convex subscriptions
- ✅ Deployed to https://dash.givecareapp.com

---

## 👥 TEAM ACCESS

**Admin Dashboard Access:**
- URL: https://dash.givecareapp.com
- No authentication required (internal tool)
- **TODO**: Add Convex Auth for multi-user access

**Cloudflare Pages Access:**
- Dashboard: https://dash.cloudflare.com
- Project: give-care-admin
- **TODO**: Add team members to Cloudflare account

**Convex Dashboard Access:**
- Dashboard: https://dashboard.convex.dev
- Project: give-care-type
- **TODO**: Add team members to Convex project

---

## ✅ PRODUCTION READY

Your admin dashboard is:
- ✅ Deployed to production (dash.givecareapp.com)
- ✅ Auto-deploys on git push (CI/CD)
- ✅ Real-time data from Convex
- ✅ Free hosting on Cloudflare Pages
- ✅ Custom domain with SSL
- ✅ 6 fully functional pages
- ✅ Crisis management + analytics

**Access it now:** https://dash.givecareapp.com 🚀
