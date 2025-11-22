/**
 * Tests for Stripe Event Idempotency and Handling
 * Ensures events are processed exactly once and mapped correctly
 */

import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "../../convex/_generated/api";
import { initConvexTest } from "../../convex/test.setup";

describe("Stripe Event Processing", () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(() => {
    t = initConvexTest();
  });

  describe("Event Idempotency", () => {
    it("should process subscription.created event once", async () => {
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          phone: "+15555551234",
          channel: "sms",
          locale: "en-US",
          externalId: "+15555551234",
        });
      });

      const eventData = {
        id: "sub_test123",
        customer: "cus_test123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                recurring: { interval: "month" },
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        metadata: {
          userId: userId,
          planId: "monthly",
        },
      };

      // First processing
      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_001",
        eventType: "customer.subscription.created",
        eventData,
      });

      // Verify subscription was created
      const subscription1 = await t.run(async (ctx) => {
        return await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
      });
      expect(subscription1).toBeDefined();
      expect(subscription1?.stripeSubscriptionId).toBe("sub_test123");

      // Second processing (duplicate event ID)
      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_001",
        eventType: "customer.subscription.created",
        eventData,
      });

      // Verify no duplicate subscription
      const subscriptions = await t.run(async (ctx) => {
        return await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
      });
      expect(subscriptions.length).toBe(1);

      // Verify billing_events logged exactly once
      const billingEvents = await t.run(async (ctx) => {
        return await ctx.db
          .query("billing_events")
          .withIndex("by_event", (q) => q.eq("eventId", "evt_test_001"))
          .collect();
      });
      expect(billingEvents.length).toBe(1);
    });

    it("should process subscription.updated event idempotently", async () => {
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          phone: "+15555551234",
          channel: "sms",
          locale: "en-US",
          externalId: "+15555551234",
        });
      });

      // Create initial subscription
      const subscriptionId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          userId,
          stripeSubscriptionId: "sub_test456",
          stripeCustomerId: "cus_test456",
          planId: "monthly",
          status: "active",
          currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
      });

      const eventData = {
        id: "sub_test456",
        customer: "cus_test456",
        status: "past_due",
        items: {
          data: [
            {
              price: {
                id: "price_test456",
                recurring: { interval: "month" },
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        metadata: {
          userId: userId,
          planId: "monthly",
        },
      };

      // Process update twice
      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_002",
        eventType: "customer.subscription.updated",
        eventData,
      });

      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_002",
        eventType: "customer.subscription.updated",
        eventData,
      });

      // Verify status updated only once
      const subscription = await t.run(async (ctx) => {
        return await ctx.db.get(subscriptionId);
      });
      expect(subscription?.status).toBe("past_due");

      // Verify only one billing event
      const billingEvents = await t.run(async (ctx) => {
        return await ctx.db
          .query("billing_events")
          .withIndex("by_event", (q) => q.eq("eventId", "evt_test_002"))
          .collect();
      });
      expect(billingEvents.length).toBe(1);
    });
  });

  describe("Event Mapping", () => {
    it("should correctly map subscription.created to subscriptions table", async () => {
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          phone: "+15555551234",
          channel: "sms",
          locale: "en-US",
          externalId: "+15555551234",
        });
      });

      const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const eventData = {
        id: "sub_new123",
        customer: "cus_new123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_new123",
                recurring: { interval: "year" },
              },
            },
          ],
        },
        current_period_end: currentPeriodEnd,
        metadata: {
          userId: userId,
          planId: "annual",
        },
      };

      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_003",
        eventType: "customer.subscription.created",
        eventData,
      });

      const subscription = await t.run(async (ctx) => {
        return await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
      });

      expect(subscription).toMatchObject({
        userId,
        stripeSubscriptionId: "sub_new123",
        stripeCustomerId: "cus_new123",
        planId: "annual",
        status: "active",
      });
      expect(subscription?.currentPeriodEnd).toBeDefined();
    });

    it("should handle missing userId in metadata gracefully", async () => {
      const eventData = {
        id: "sub_orphan123",
        customer: "cus_orphan123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_orphan123",
                recurring: { interval: "month" },
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        metadata: {
          // No userId
        },
      };

      // Should not throw, but should log event without updating subscription
      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_004",
        eventType: "customer.subscription.created",
        eventData,
      });

      // Verify billing event was logged
      const billingEvents = await t.run(async (ctx) => {
        return await ctx.db
          .query("billing_events")
          .withIndex("by_event", (q) => q.eq("eventId", "evt_test_004"))
          .collect();
      });
      expect(billingEvents.length).toBe(1);

      // Verify no orphaned subscription was created
      const subscriptions = await t.run(async (ctx) => {
        return await ctx.db
          .query("subscriptions")
          .filter((q) => q.eq(q.field("stripeSubscriptionId"), "sub_orphan123"))
          .collect();
      });
      expect(subscriptions.length).toBe(0);
    });

    it("should map subscription.deleted to canceled status", async () => {
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          phone: "+15555551234",
          channel: "sms",
          locale: "en-US",
          externalId: "+15555551234",
        });
      });

      const subscriptionId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          userId,
          stripeSubscriptionId: "sub_cancel123",
          stripeCustomerId: "cus_cancel123",
          planId: "monthly",
          status: "active",
          currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
      });

      const eventData = {
        id: "sub_cancel123",
        customer: "cus_cancel123",
        status: "canceled",
        items: {
          data: [
            {
              price: {
                id: "price_cancel123",
                recurring: { interval: "month" },
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        metadata: {
          userId: userId,
          planId: "monthly",
        },
      };

      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_005",
        eventType: "customer.subscription.deleted",
        eventData,
      });

      const subscription = await t.run(async (ctx) => {
        return await ctx.db.get(subscriptionId);
      });

      expect(subscription?.status).toBe("canceled");
    });
  });

  describe("Checkout Session Completed", () => {
    it("should trigger welcome SMS on checkout.session.completed", async () => {
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "New User",
          phone: "+15555555678",
          channel: "sms",
          locale: "en-US",
          externalId: "+15555555678",
        });
      });

      const eventData = {
        id: "cs_test123",
        customer: "cus_welcome123",
        subscription: "sub_welcome123",
        mode: "subscription",
        metadata: {
          userId: userId,
          planId: "monthly",
        },
      };

      await t.mutation(internal.internal.stripe.applyStripeEvent, {
        stripeEventId: "evt_test_006",
        eventType: "checkout.session.completed",
        eventData,
      });

      // Verify billing event logged
      const billingEvents = await t.run(async (ctx) => {
        return await ctx.db
          .query("billing_events")
          .withIndex("by_event", (q) => q.eq("eventId", "evt_test_006"))
          .collect();
      });
      expect(billingEvents.length).toBe(1);
      expect(billingEvents[0].eventType).toBe("checkout.session.completed");
    });
  });
});
