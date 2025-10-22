# GiveCare Monorepo

AI-powered SMS/RCS caregiving support platform built with TypeScript, Convex, and Next.js.

## 🏗️ Architecture

This monorepo contains 4 core applications:

| App | Description | Tech Stack | Status |
|-----|-------------|------------|--------|
| **give-care-app** | Multi-agent SMS backend + admin dashboard | TypeScript, Convex, OpenAI Agents SDK | ✅ Production (v0.8.2) |
| **give-care-site** | Marketing website | Next.js 15, Tailwind CSS v4 | 🚧 Active development |
| **give-care-story** | Presentation system | Next.js 15, Framer Motion | ✅ Stable (v1.0.0) |
| **give-care-etl** | Resource discovery ETL pipeline | Cloudflare Workers, OpenAI Agents SDK | 🚧 In progress (v0.1.0) |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.0.0 (`npm install -g pnpm@9.0.0`)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd givecare

# Install all dependencies (REQUIRED)
pnpm install
```

### Development

```bash
# Backend + Admin Dashboard
cd give-care-app && npx convex dev

# Marketing Website
cd give-care-site && pnpm dev

# Presentations
cd give-care-story && pnpm dev
```

## 📦 Project Structure

```
givecare/
├── give-care-app/          # Backend + admin (531 MB)
│   ├── src/                 # Multi-agent system
│   ├── convex/             # Serverless database
│   ├── admin-frontend/     # Admin dashboard
│   ├── tests/              # 179 passing tests
│   └── docs/               # Comprehensive documentation
├── give-care-site/         # Marketing (1.8 GB)
│   ├── app/                # Next.js App Router
│   ├── components/         # UI components
│   └── content/            # MDX blog posts
├── give-care-story/        # Presentations (989 MB)
│   ├── app/                # Next.js App Router
│   └── components/slides/  # Slide component library
├── give-care-etl/          # ETL pipeline
│   ├── src/agents/         # 5 specialized agents
│   └── src/schemas/        # Zod validation schemas
├── package.json            # Workspace root
└── pnpm-workspace.yaml     # Workspace config
```

## 🛠️ Key Technologies

### give-care-app (Backend)
- **OpenAI Agents SDK 0.1.9** - Multi-agent AI system (GPT-5 nano)
- **Convex** - Serverless database + real-time sync
- **Twilio** - SMS/RCS messaging
- **Vitest** - Testing framework (179 tests)
- **Performance**: ~900ms average response time

**Features**:
- 3 specialized AI agents (Main, Crisis, Assessment)
- 4 clinical assessments (EMA, CWBS, REACH-II, SDOH)
- Composite burnout scoring (0-100)
- 5 pressure zones with 20 interventions
- Admin dashboard at https://dash.givecareapp.com

### give-care-site (Marketing)
- **Next.js 15.3.2** - React framework with App Router
- **Tailwind CSS v4** - Utility-first styling
- **MDX** - Markdown + JSX for blog content
- **Framer Motion** - Animations
- **Vitest + Playwright** - Testing

### give-care-story (Presentations)
- **Next.js 15.1** - Static slide generation
- **Framer Motion** - Slide animations
- **Custom slide library** - Reusable components
- **Typography**: Gabarito + Alegreya fonts

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete development guide
- **[give-care-app/docs/](./give-care-app/docs/)** - Backend architecture (14 docs)
- **[give-care-site/CLAUDE.md](./give-care-site/CLAUDE.md)** - Marketing guidelines
- **[give-care-story/CLAUDE.md](./give-care-story/CLAUDE.md)** - Presentation patterns

## 🧪 Testing

```bash
# Backend (179 tests)
cd give-care-app && npm test

# Marketing (unit + E2E)
cd give-care-site && pnpm test

# Run all tests
pnpm --recursive test
```

## 🏗️ Building

```bash
# Build all projects
pnpm --recursive build

# Build specific project
pnpm --filter give-care-app build
pnpm --filter give-care-site build
pnpm --filter give-care-story build
```

## 🚢 Deployment

### give-care-app (Backend)
```bash
cd give-care-app
npx convex deploy --prod
```

### give-care-site (Marketing)
Deployed to Vercel with automatic deployments on push to `main`.

### give-care-story (Presentations)
Static export to hosting provider.

## 🔧 Common Commands

### Workspace Management
```bash
pnpm install                        # Install all dependencies
pnpm --recursive build              # Build all projects
pnpm --recursive lint               # Lint all projects
pnpm --recursive test               # Test all projects
```

### Development
```bash
pnpm --filter give-care-app dev     # Backend dev server
pnpm --filter give-care-site dev    # Marketing dev server
pnpm --filter give-care-story dev   # Presentation dev server
```

### Cleaning
```bash
pnpm --recursive clean              # Clean all projects
rm -rf node_modules                 # Remove workspace node_modules
pnpm install                        # Reinstall fresh
```

## 🌍 Environment Variables

Each project requires its own `.env.local` file (never committed):

**give-care-app**:
- `CONVEX_DEPLOYMENT` - Convex deployment URL
- `OPENAI_API_KEY` - OpenAI API key
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - Twilio credentials
- `STRIPE_SECRET_KEY` - Stripe secret key

**give-care-site**:
- `NEXT_PUBLIC_CONVEX_URL` - Convex URL (public)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase
- `RESEND_API_KEY` - Email API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key

See `.env.example` in each project directory.

## 📊 Project Status

| Project | Version | Tests | Status |
|---------|---------|-------|--------|
| give-care-app | 0.8.2 | 235+ passing | ✅ Production |
| give-care-site | 0.1.0 | Active dev | 🚧 Development |
| give-care-story | 1.0.0 | N/A | ✅ Stable |
| give-care-etl | 0.1.0 | In progress | 🚧 Development |

## 🤝 Contributing

1. Always run `pnpm install` from root first
2. Use `pnpm` for all package operations (not npm)
3. Follow project-specific guidelines in each project's `CLAUDE.md`
4. Run tests before committing
5. Update documentation when changing architecture

## 🐛 Common Issues

### TypeScript errors in give-care-app
**Solution**: Run `npx convex dev` to generate types

### "pnpm: command not found"
**Solution**: `npm install -g pnpm@9.0.0`

### Dependency installation fails
**Solution**: Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install` from root

### Workspace package not found
**Solution**: Ensure package name in `package.json` matches workspace reference

## 📖 Learn More

- **Architecture**: See [give-care-app/docs/ARCHITECTURE.md](./give-care-app/docs/ARCHITECTURE.md)
- **Development Guide**: See [CLAUDE.md](./CLAUDE.md)
- **Taxonomy**: See [give-care-app/docs/TAXONOMY.md](./give-care-app/docs/TAXONOMY.md)

## 🔗 Links

- **Admin Dashboard**: https://dash.givecareapp.com
- **Marketing Site**: TBD
- **Convex Console**: https://dashboard.convex.dev

## 📝 License

Proprietary - GiveCare Platform

---

**Last Updated**: 2025-10-14 (Monorepo consolidation to 3 apps)
