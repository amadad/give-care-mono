/**
 * Subscription Gating Simulation Tests
 *
 * Purpose: Real Convex environment tests for SMS subscription gating
 * Spec: IMPLEMENTATION_PLAN.md - "Phase 2: Subscription Status & Gating"
 * No Mocks: Uses real Convex mutations/queries
 *
 * Tests:
 * - Active subscription allows SMS access
 * - No subscription blocks SMS access
 * - Grace period allows SMS access
 * - Grace period expiration blocks SMS access
 * - Subscription status helpers work correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { initConvexTest } from '../../convex/test.setup';
import { isSubscriptionActive, isInGracePeriod } from '../../convex/lib/subscription';

describe('Subscription Gating Simulation Tests', () => {
  const testPhone = '+15555550002';

  beforeEach(async () => {
    // Clean setup
    const t = initConvexTest();

    const existing = await t.query(api.public.getByExternalIdQuery, {
      externalId: testPhone,
    });

    if (existing) {
      const subs = await t.run(async (ctx) => {
        return await ctx.db
          .query('subscriptions')
          .withIndex('by_user', (q) => q.eq('userId', existing._id))
          .collect();
      });

      for (const sub of subs) {
        await t.run(async (ctx) => {
          await ctx.db.delete(sub._id);
        });
      }
    }
  });

  it('should allow SMS access for active subscription', async () => {
    // IMPLEMENTATION_PLAN.md: "Active subscriptions grant full SMS access"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    // Create active subscription
    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_active_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(true);
    expect(isInGracePeriod(subscription!)).toBe(false);

    // Check via query helper
    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(true);
    expect(status.inGracePeriod).toBe(false);
    expect(status.status).toBe('active');
  });

  it('should block SMS access for no subscription', async () => {
    // IMPLEMENTATION_PLAN.md: "No subscription = blocked access"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    // No subscription created
    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(false);
    expect(status.inGracePeriod).toBe(false);
    expect(status.status).toBe('none');
  });

  it('should allow SMS access during grace period', async () => {
    // IMPLEMENTATION_PLAN.md: "3-day grace period after cancellation"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const now = Date.now();
    const gracePeriodEnd = now + 3 * 24 * 60 * 60 * 1000; // 3 days from now

    // Create canceled subscription with grace period
    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_grace_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'canceled',
        currentPeriodEnd: now,
        canceledAt: now,
        gracePeriodEndsAt: gracePeriodEnd,
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(true); // Still active due to grace period
    expect(isInGracePeriod(subscription!)).toBe(true);

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(true);
    expect(status.inGracePeriod).toBe(true);
    expect(status.gracePeriodDaysRemaining).toBeGreaterThan(0);
    expect(status.gracePeriodDaysRemaining).toBeLessThanOrEqual(3);
  });

  it('should block SMS access after grace period expires', async () => {
    // IMPLEMENTATION_PLAN.md: "After grace period = hard block"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const now = Date.now();
    const expiredGracePeriod = now - 1000; // Expired 1 second ago

    // Create canceled subscription with expired grace period
    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_expired_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'canceled',
        currentPeriodEnd: now - 5 * 24 * 60 * 60 * 1000,
        canceledAt: now - 4 * 24 * 60 * 60 * 1000,
        gracePeriodEndsAt: expiredGracePeriod,
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(false); // Not active, grace period expired
    expect(isInGracePeriod(subscription!)).toBe(false);

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(false);
    expect(status.inGracePeriod).toBe(false);
    expect(status.status).toBe('canceled');
  });

  it('should allow access for trialing subscription', async () => {
    // IMPLEMENTATION_PLAN.md: "Trialing = active subscription"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_trial_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'trialing',
        currentPeriodEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(true);

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(true);
    expect(status.status).toBe('trialing');
  });

  it('should allow access for past_due subscription within current period', async () => {
    // IMPLEMENTATION_PLAN.md: "Past due but within billing period = active"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_pastdue_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'past_due',
        currentPeriodEnd: Date.now() + 1 * 24 * 60 * 60 * 1000, // Still has 1 day
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(true);

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(true);
    expect(status.status).toBe('past_due');
  });

  it('should block access for past_due subscription after current period', async () => {
    // IMPLEMENTATION_PLAN.md: "Past due after billing period = blocked"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const subscription = await t.run(async (ctx) => {
      const id = await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_pastdue_expired_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'past_due',
        currentPeriodEnd: Date.now() - 1000, // Expired
      });
      return await ctx.db.get(id);
    });

    expect(subscription).toBeDefined();
    expect(isSubscriptionActive(subscription!)).toBe(false);

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(false);
    expect(status.status).toBe('past_due');
  });

  it('should calculate grace period days remaining correctly', async () => {
    // IMPLEMENTATION_PLAN.md: "Grace period days displayed to user"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: testPhone,
      phone: testPhone,
      channel: 'sms',
    });

    const now = Date.now();
    const gracePeriodEnd = now + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000; // 2.5 days

    await t.run(async (ctx) => {
      await ctx.db.insert('subscriptions', {
        userId: user._id,
        stripeCustomerId: 'cus_grace_days_123',
        planId: 'price_1SH4eMAXk51qociduivShWb7',
        status: 'canceled',
        currentPeriodEnd: now,
        canceledAt: now,
        gracePeriodEndsAt: gracePeriodEnd,
      });
    });

    const status = await t.query(internal.inboundHelpers.getUserSubscriptionStatus, {
      userId: user._id,
    });

    expect(status.isActive).toBe(true);
    expect(status.inGracePeriod).toBe(true);
    expect(status.gracePeriodDaysRemaining).toBe(3); // Ceiling of 2.5 days
  });
});
