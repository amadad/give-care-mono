# 🎉 Admin Dashboard - Ready to Run!

All code generated! You can see it working in **3 simple steps**.

---

## Quick Start (15 minutes)

### Step 1: Run Setup Script

```bash
cd /Users/amadad/Projects/givecare/give-care-app/admin
./SETUP.sh
```

This will:
- ✅ Install all npm dependencies
- ✅ Initialize Tailwind CSS
- ✅ Setup shadcn/ui components
- ✅ Create symlink to Convex
- ✅ Create `.env.local` file

### Step 2: Get Convex URL

```bash
# In a new terminal
cd /Users/amadad/Projects/givecare/give-care-app
npx convex dashboard
```

1. Dashboard will open in browser
2. Copy the deployment URL (looks like: `https://xxx.convex.cloud`)
3. Paste into `admin/.env.local`:

```bash
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

### Step 3: Start Dev Servers

**Terminal 1** - Convex (leave running):
```bash
cd /Users/amadad/Projects/givecare/give-care-app
npx convex dev
```

**Terminal 2** - Vite:
```bash
cd /Users/amadad/Projects/givecare/give-care-app/admin
npm run dev
```

**Open**: http://localhost:5173

---

## What You'll See 🎨

### Dashboard Home
- 5 metric cards (Total Users, Active Users, Crisis Alerts, Avg Burnout, Response Time)
- Subscription breakdown
- Real-time data from Convex

### Users Page
- Searchable user table
- Filters (journey phase, burnout band, subscription)
- Export to CSV
- Click any user → User detail page

### User Detail
- Wellness trend chart (last 30 days)
- Conversation history
- Assessment history
- Quick actions (send message, reset assessment)

### Crisis Management
- Critical alerts (burnout ≥80)
- Pending follow-ups with countdown timers
- Quick action buttons
- Crisis protocol reminder

### Analytics (3 Tabs)
- **Usage**: Burnout distribution histogram, journey funnel, SMS volume trends
- **Quality**: Evaluation metrics (empathy, clarity, trauma-informed, satisfaction) + recent feedback
- **Performance**: Agent latency by type (main, crisis, assessment)

### System Health
- Rate limiter status (per-user, global quotas)
- OpenAI API usage (tokens, cost)
- Database performance (query latency, connections)
- Error logs

---

## Project Structure

```
admin/
├── src/
│   ├── main.tsx                          Entry point
│   ├── index.css                         Tailwind imports
│   ├── routes/
│   │   ├── __root.tsx                    Layout (sidebar + header)
│   │   ├── index.tsx                     ✅ Dashboard home
│   │   ├── users/
│   │   │   ├── index.tsx                 ✅ User list
│   │   │   └── $userId.tsx               ✅ User detail
│   │   ├── crisis.tsx                    ✅ Crisis management
│   │   ├── analytics.tsx                 ✅ Analytics (3 tabs)
│   │   └── system.tsx                    ✅ System health
│   ├── components/
│   │   ├── ui/                           shadcn/ui (auto-generated)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               Navigation menu
│   │   │   └── Header.tsx                Search + profile
│   │   └── dashboard/
│   │       ├── MetricCard.tsx            KPI cards
│   │       ├── UserTable.tsx             User list table
│   │       ├── BurnoutChart.tsx          Histogram (Recharts)
│   │       ├── QualityMetrics.tsx        Eval metrics
│   │       └── AgentPerformance.tsx      Agent stats
│   └── lib/
│       └── utils.ts                      Helpers
├── convex/ → ../convex (symlink)         Backend functions
├── package.json                          Dependencies
├── vite.config.ts                        Vite config
├── tsconfig.json                         TypeScript config
├── index.html                            HTML template
├── .env.local                            Convex URL (you create)
├── SETUP.sh                              Automated setup
└── README.md                             Full docs
```

---

## Files Created (24 files, ~3,500 lines)

### Backend (3 files)
- ✅ `convex/schema.ts` - Added conversationFeedback table
- ✅ `convex/functions/admin.ts` - 6 admin functions (296 lines)
- ✅ `convex/functions/analytics.ts` - 7 analytics functions (248 lines)

### Frontend (21 files)
- ✅ Entry & Config (6 files): main.tsx, index.css, vite.config.ts, tsconfig.json, package.json, index.html
- ✅ Routes (6 files): __root.tsx, index.tsx, users/index.tsx, users/$userId.tsx, crisis.tsx, analytics.tsx, system.tsx
- ✅ Layout (2 files): Sidebar.tsx, Header.tsx
- ✅ Components (5 files): MetricCard.tsx, UserTable.tsx, BurnoutChart.tsx, QualityMetrics.tsx, AgentPerformance.tsx
- ✅ Utils (1 file): utils.ts
- ✅ Docs (1 file): README.md

---

## Troubleshooting

### Problem: "Cannot find module '@/components/ui/button'"
**Solution**: Run `npx shadcn@latest add button` (or re-run SETUP.sh)

### Problem: "Convex URL not found"
**Solution**: Update `.env.local` with your deployment URL from `npx convex dashboard`

### Problem: Convex types not found
**Solution**: Symlink issue. Run: `ln -s ../convex ./convex`

### Problem: "Module not found" errors
**Solution**: Run `npm install` to install all dependencies

### Problem: Port 5173 already in use
**Solution**: Kill existing Vite process or use `npm run dev -- --port 3000`

---

## Deploy to Cloudflare Pages

Once local dev works:

### 1. Push to GitHub

```bash
cd /Users/amadad/Projects/givecare/give-care-app/admin
git init
git add .
git commit -m "Initial admin dashboard"
git remote add origin https://github.com/YOUR_USERNAME/give-care-admin-dashboard.git
git push -u origin main
```

### 2. Deploy on Cloudflare

1. Go to https://dash.cloudflare.com → Pages
2. "Create application" → "Connect to Git"
3. Select your repo
4. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variable**: `VITE_CONVEX_URL` = `https://YOUR_DEPLOYMENT.convex.cloud`
5. "Save and Deploy"

### 3. Custom Domain

1. Pages → Custom domains → "Set up a custom domain"
2. Enter: `admin.givecare.app`
3. Cloudflare will auto-configure DNS (if domain on Cloudflare)
4. SSL certificate provisioned automatically

**Done!** Your dashboard will be live at `https://admin.givecare.app`

---

## Next Steps

- [ ] Run `./SETUP.sh` (15 min)
- [ ] Start dev servers (see Step 3)
- [ ] Open http://localhost:5173
- [ ] Test all pages (Dashboard, Users, Crisis, Analytics, System)
- [ ] Deploy to Cloudflare Pages (when ready)
- [ ] Set custom domain: admin.givecare.app

---

## Support

- **Setup issues**: Check README.md
- **Convex questions**: See give-care-app/docs/ADMIN_COMPLETE_GUIDE.md
- **Deploy help**: See give-care-app/docs/CLOUDFLARE_PAGES_SETUP.md

---

**Ready to see it?** Run:
```bash
cd /Users/amadad/Projects/givecare/give-care-app/admin
./SETUP.sh
```

Then follow the output instructions!
