# GiveCare App Documentation

**Last Updated:** 2025-11-11

---

## 📚 Documentation Structure

### Primary References (Source of Truth)

| Document | Purpose | Audience |
|----------|---------|----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Complete technical reference - system overview, file breakdown, database schema, patterns | Developers, AI agents |
| **[FEATURES.md](./FEATURES.md)** | Product source of truth - features, user journeys, scenarios, use cases | Product, Design, Non-technical |

### Guides & References

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Production deployment procedures | Deploying to production |
| **[WEBHOOKS.md](./WEBHOOKS.md)** | Twilio and Stripe webhook setup | Configuring webhooks |
| **[SIMULATION-TESTING.md](./SIMULATION-TESTING.md)** | Simulation testing protocol | Writing/maintaining tests |
| **[IDIOMATIC_PATTERNS.md](./IDIOMATIC_PATTERNS.md)** | Convex/Agent Component patterns reference | Implementing new features |
| **[TWILIO_COMPONENT_GUIDE.md](./TWILIO_COMPONENT_GUIDE.md)** | Twilio Component integration guide | Working with SMS/RCS |
| **[STRIPE_COUPONS.md](./STRIPE_COUPONS.md)** | Stripe coupon management | Managing promotions |

---

## 📦 Archived Documentation

Analysis and evaluation documents have been archived to `_archive/`:

- **2025-11-11-analysis-docs/**: One-time analysis documents (code analysis, evaluations, performance studies)
- **2025-01-08-cleanup/**: Historical cleanup documentation
- **2025-11-10-post-v150-audits/**: Post-v1.5.0 audit documents

These documents are preserved for historical reference but are not actively maintained.

---

## 🔍 Quick Reference

**For developers:**
1. Start with `ARCHITECTURE.md` to understand the system
2. Check `IDIOMATIC_PATTERNS.md` for Convex patterns
3. See `SIMULATION-TESTING.md` for testing approach

**For product/design:**
1. Start with `FEATURES.md` for user experiences
2. Reference `ARCHITECTURE.md` for technical constraints

**For deployment:**
1. Follow `DEPLOYMENT.md` for production releases
2. Check `WEBHOOKS.md` for webhook configuration

---

**Note:** Always update `ARCHITECTURE.md` and `FEATURES.md` when making significant changes to the system.

