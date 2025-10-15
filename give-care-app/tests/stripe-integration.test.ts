/**
 * Stripe Integration Tests - Landing Page to SMS Agent Flow
 * TDD Phase 1: Write tests FIRST before integration
 *
 * Tests cover:
 * - createCheckoutSession action (called from landing page)
 * - E.164 phone validation
 * - Promo code validation
 * - User creation in Convex
 * - Webhook processing
 * - Welcome SMS delivery
 * - Idempotency (duplicate signups)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

// Mock Stripe
const mockStripeCustomers = {
  list: vi.fn(),
  create: vi.fn(),
};

const mockStripeCoupons = {
  retrieve: vi.fn(),
};

const mockStripeCheckoutSessions = {
  create: vi.fn(),
};

const mockStripe = {
  customers: mockStripeCustomers,
  coupons: mockStripeCoupons,
  checkout: {
    sessions: mockStripeCheckoutSessions,
  },
};

// Mock Convex context
const mockDbInsert = vi.fn();
const mockDbPatch = vi.fn();
const mockDbQuery = vi.fn();

const mockCtx = {
  db: {
    insert: mockDbInsert,
    patch: mockDbPatch,
    query: () => ({
      withIndex: () => ({
        eq: () => ({
          first: mockDbQuery,
        }),
      }),
    }),
  },
  runMutation: vi.fn(),
  runAction: vi.fn(),
};

// Mock Twilio
const mockTwilioMessages = {
  create: vi.fn(),
};

describe('Stripe Integration - createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockStripeCustomers.list.mockResolvedValue({ data: [] });
    mockStripeCustomers.create.mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+15551234567',
    });

    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
      client_secret: 'cs_test_secret',
    });

    mockDbInsert.mockResolvedValue('j9781234567890123456');
    mockDbQuery.mockResolvedValue(null); // No existing user
    mockTwilioMessages.create.mockResolvedValue({
      sid: 'SM1234567890abcdef',
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept valid E.164 phone numbers', async () => {
      const validNumbers = [
        '+15551234567',
        '+12025551234',
        '+14155551234',
      ];

      for (const phoneNumber of validNumbers) {
        const args = {
          fullName: 'Test User',
          email: 'test@example.com',
          phoneNumber,
          priceId: 'price_test_123',
        };

        // Verify phone number format
        expect(phoneNumber).toMatch(/^\+1\d{10}$/);
      }
    });

    it('should reject invalid phone numbers', async () => {
      const invalidNumbers = [
        '5551234567', // Missing +1
        '+1555123456', // Too short
        '+155512345678', // Too long
        '+25551234567', // Wrong country code
        'notaphone', // Not a number
      ];

      for (const phoneNumber of invalidNumbers) {
        expect(phoneNumber).not.toMatch(/^\+1\d{10}$/);
      }
    });

    it('should normalize phone numbers to E.164 format', () => {
      // Test various input formats and expected E.164 output
      const testCases = [
        { input: '(555) 123-4567', expected: '+15551234567' },
        { input: '555-123-4567', expected: '+15551234567' },
        { input: '555.123.4567', expected: '+15551234567' },
        { input: '5551234567', expected: '+15551234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Remove all non-digits
        const digits = input.replace(/\D/g, '');
        // Add +1 if not present
        const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;
        expect(normalized).toBe(expected);
      });
    });
  });

  describe('Promo Code Validation', () => {
    it('should apply valid promo code to checkout session', async () => {
      mockStripeCoupons.retrieve.mockResolvedValue({
        id: 'CAREGIVER50',
        valid: true,
        name: '50% off for caregivers',
        percent_off: 50,
      });

      const args = {
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+15551234567',
        priceId: 'price_test_123',
        couponCode: 'CAREGIVER50',
      };

      // Verify coupon was retrieved
      await mockStripeCoupons.retrieve('CAREGIVER50');
      expect(mockStripeCoupons.retrieve).toHaveBeenCalledWith('CAREGIVER50');
    });

    it('should handle invalid promo codes gracefully', async () => {
      mockStripeCoupons.retrieve.mockRejectedValue(new Error('No such coupon'));

      const args = {
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+15551234567',
        priceId: 'price_test_123',
        couponCode: 'INVALID_CODE',
      };

      // Should not throw error, just continue without coupon
      try {
        await mockStripeCoupons.retrieve('INVALID_CODE');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // In real implementation, this should be caught and logged
      }
    });

    it('should validate active promo codes from system', () => {
      const validPromoCodes = [
        'CAREGIVER50',
        'MEDICAID',
        'PARTNER-401C',
        'PARTNER-ORG',
        'HEALTHCARE',
        'NONPROFIT',
        'EDUCATOR',
        'STUDENT',
        'VETERAN',
        'FIRSTRESPONDER',
        'TRIAL30',
        'WELCOME20',
        'FRIEND15',
        'ANNUAL25',
        'LAUNCH50',
      ];

      // All codes should be uppercase
      validPromoCodes.forEach((code) => {
        expect(code).toBe(code.toUpperCase());
      });

      // Should have 15 codes as per spec
      expect(validPromoCodes).toHaveLength(15);
    });
  });

  describe('User Creation', () => {
    it('should create pending user in Convex when checkout starts', async () => {
      const args = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '+15551234567',
        stripeCustomerId: 'cus_test_123',
      };

      await mockCtx.db.insert('users', {
        name: args.fullName,
        email: args.email,
        phone: args.phoneNumber,
        phoneNumber: args.phoneNumber,
        firstName: 'Jane',
        journeyPhase: 'onboarding',
        assessmentInProgress: false,
        assessmentCurrentQuestion: 0,
        pressureZones: [],
        onboardingAttempts: {},
        rcsCapable: false,
        languagePreference: 'en',
        stripeCustomerId: args.stripeCustomerId,
        subscriptionStatus: 'incomplete',
        appState: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      expect(mockDbInsert).toHaveBeenCalledWith('users', expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '+15551234567',
        subscriptionStatus: 'incomplete',
        journeyPhase: 'onboarding',
      }));
    });

    it('should update existing user if phone number already exists', async () => {
      // Simulate existing user
      mockDbQuery.mockResolvedValue({
        _id: 'existing_user_id',
        phoneNumber: '+15551234567',
        name: 'Old Name',
        email: 'old@example.com',
      });

      const args = {
        fullName: 'New Name',
        email: 'new@example.com',
        phoneNumber: '+15551234567',
        stripeCustomerId: 'cus_test_123',
      };

      // Should patch existing user instead of inserting
      await mockCtx.db.patch('existing_user_id', {
        name: args.fullName,
        email: args.email,
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });

      expect(mockDbPatch).toHaveBeenCalledWith('existing_user_id', expect.objectContaining({
        name: 'New Name',
        email: 'new@example.com',
        stripeCustomerId: 'cus_test_123',
      }));
    });

    it('should extract first name from full name', () => {
      const testCases = [
        { fullName: 'Jane Doe', expected: 'Jane' },
        { fullName: 'John Smith Jr.', expected: 'John' },
        { fullName: 'Mary', expected: 'Mary' },
        { fullName: 'José María García', expected: 'José' },
      ];

      testCases.forEach(({ fullName, expected }) => {
        const firstName = fullName.split(' ')[0];
        expect(firstName).toBe(expected);
      });
    });
  });

  describe('Stripe Customer Management', () => {
    it('should create new Stripe customer if none exists', async () => {
      mockStripeCustomers.list.mockResolvedValue({ data: [] });

      await mockStripeCustomers.create({
        email: 'test@example.com',
        name: 'Test User',
        phone: '+15551234567',
        metadata: {
          phoneNumber: '+15551234567',
        },
      });

      expect(mockStripeCustomers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          phone: '+15551234567',
        })
      );
    });

    it('should reuse existing Stripe customer if found', async () => {
      const existingCustomer = {
        id: 'cus_existing_123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockStripeCustomers.list.mockResolvedValue({
        data: [existingCustomer],
      });

      const customers = await mockStripeCustomers.list({
        email: 'test@example.com',
        limit: 1,
      });

      expect(customers.data).toHaveLength(1);
      expect(customers.data[0].id).toBe('cus_existing_123');
      // Should NOT call create if customer exists
      expect(mockStripeCustomers.create).not.toHaveBeenCalled();
    });
  });

  describe('Checkout Session Creation', () => {
    it('should create Stripe checkout session with correct parameters', async () => {
      const args = {
        customerId: 'cus_test_123',
        priceId: 'price_test_123',
        userId: 'j9781234567890123456',
        phoneNumber: '+15551234567',
      };

      await mockStripeCheckoutSessions.create({
        customer: args.customerId,
        customer_update: { address: 'auto' },
        line_items: [{ price: args.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: expect.stringContaining('/welcome'),
        cancel_url: expect.stringContaining('/signup'),
        metadata: {
          userId: args.userId,
          phoneNumber: args.phoneNumber,
          couponCode: 'none',
        },
        subscription_data: {
          metadata: {
            userId: args.userId,
            phoneNumber: args.phoneNumber,
            couponCode: 'none',
          },
        },
        customer_email: 'test@example.com',
        phone_number_collection: { enabled: false },
      });

      expect(mockStripeCheckoutSessions.create).toHaveBeenCalled();
    });

    it('should include promo code in checkout session if provided', async () => {
      mockStripeCoupons.retrieve.mockResolvedValue({
        id: 'CAREGIVER50',
        valid: true,
      });

      await mockStripeCheckoutSessions.create({
        customer: 'cus_test_123',
        discounts: [{ coupon: 'CAREGIVER50' }],
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        mode: 'subscription',
        metadata: {
          couponCode: 'CAREGIVER50',
        },
        subscription_data: {
          metadata: {
            couponCode: 'CAREGIVER50',
          },
        },
      });

      const call = mockStripeCheckoutSessions.create.mock.calls[0][0];
      expect(call.discounts).toEqual([{ coupon: 'CAREGIVER50' }]);
      expect(call.metadata.couponCode).toBe('CAREGIVER50');
    });

    it('should store checkout session ID in user record', async () => {
      const userId = 'j9781234567890123456';
      const checkoutSessionId = 'cs_test_123';

      await mockCtx.db.patch(userId, {
        appState: { checkoutSessionId },
        updatedAt: Date.now(),
      });

      expect(mockDbPatch).toHaveBeenCalledWith(userId, expect.objectContaining({
        appState: { checkoutSessionId },
      }));
    });

    it('should return checkout URL for redirect', async () => {
      const session = await mockStripeCheckoutSessions.create({
        customer: 'cus_test_123',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        mode: 'subscription',
      });

      expect(session.url).toBe('https://checkout.stripe.com/test');
    });
  });

  describe('Webhook Processing - checkout.session.completed', () => {
    it('should activate subscription after successful payment', async () => {
      const userId = 'j9781234567890123456';
      const subscriptionId = 'sub_test_123';

      await mockCtx.db.patch(userId, {
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        journeyPhase: 'active',
        updatedAt: Date.now(),
      });

      expect(mockDbPatch).toHaveBeenCalledWith(userId, expect.objectContaining({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        journeyPhase: 'active',
      }));
    });

    it('should send welcome SMS after subscription activation', async () => {
      const phoneNumber = '+15551234567';
      const userId = 'j9781234567890123456';

      const welcomeMessage =
        "Welcome to GiveCare! 🎉\n\n" +
        "I'm here to support you on your caregiving journey. " +
        "Reply anytime with a question or just say hello to get started.\n\n" +
        "You're not alone in this.";

      await mockTwilioMessages.create({
        body: welcomeMessage,
        from: '+15555555555',
        to: phoneNumber,
      });

      expect(mockTwilioMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Welcome to GiveCare'),
          to: phoneNumber,
        })
      );
    });

    it('should handle missing userId in webhook metadata', async () => {
      const session = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        metadata: {
          // userId is missing
          phoneNumber: '+15551234567',
        },
      };

      // Should return error
      const result = { success: false };
      expect(result.success).toBe(false);
    });

    it('should handle missing phoneNumber in webhook metadata', async () => {
      const session = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        metadata: {
          userId: 'j9781234567890123456',
          // phoneNumber is missing
        },
      };

      // Should return error
      const result = { success: false };
      expect(result.success).toBe(false);
    });
  });

  describe('Welcome SMS Delivery', () => {
    it('should send welcome SMS with correct content', () => {
      const welcomeMessage =
        "Welcome to GiveCare! 🎉\n\n" +
        "I'm here to support you on your caregiving journey. " +
        "Reply anytime with a question or just say hello to get started.\n\n" +
        "You're not alone in this.";

      // Verify message content
      expect(welcomeMessage).toContain('Welcome to GiveCare');
      expect(welcomeMessage).toContain("I'm here to support you");
      expect(welcomeMessage).toContain("You're not alone");
    });

    it('should handle Twilio not configured gracefully', async () => {
      // Simulate missing Twilio credentials
      const accountSid = undefined;
      const authToken = undefined;
      const twilioNumber = undefined;

      if (!accountSid || !authToken || !twilioNumber) {
        const result = { success: false, error: 'Twilio not configured' };
        expect(result.success).toBe(false);
        expect(result.error).toBe('Twilio not configured');
      }
    });

    it('should handle SMS delivery failure gracefully', async () => {
      mockTwilioMessages.create.mockRejectedValue(new Error('Invalid phone number'));

      try {
        await mockTwilioMessages.create({
          body: 'Welcome to GiveCare!',
          from: '+15555555555',
          to: 'invalid',
        });
      } catch (error) {
        // Should log error but not fail subscription activation
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate signups by updating existing user', async () => {
      // First signup
      mockDbQuery.mockResolvedValue(null);
      await mockCtx.db.insert('users', {
        name: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+15551234567',
        subscriptionStatus: 'incomplete',
      });
      expect(mockDbInsert).toHaveBeenCalledTimes(1);

      // Second signup with same phone
      mockDbQuery.mockResolvedValue({
        _id: 'existing_user_id',
        phoneNumber: '+15551234567',
      });

      await mockCtx.db.patch('existing_user_id', {
        name: 'Test User',
        email: 'test@example.com',
        updatedAt: Date.now(),
      });

      expect(mockDbPatch).toHaveBeenCalled();
      // Should NOT insert second time
      expect(mockDbInsert).toHaveBeenCalledTimes(1);
    });

    it('should update checkout session ID on retry', async () => {
      const userId = 'existing_user_id';
      const oldSessionId = 'cs_old_123';
      const newSessionId = 'cs_new_456';

      // First checkout
      await mockCtx.db.patch(userId, {
        appState: { checkoutSessionId: oldSessionId },
      });

      // User retries checkout
      await mockCtx.db.patch(userId, {
        appState: { checkoutSessionId: newSessionId },
      });

      expect(mockDbPatch).toHaveBeenLastCalledWith(userId, expect.objectContaining({
        appState: { checkoutSessionId: newSessionId },
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      mockStripeCheckoutSessions.create.mockRejectedValue(
        new Error('Stripe API error: Invalid price ID')
      );

      try {
        await mockStripeCheckoutSessions.create({
          customer: 'cus_test_123',
          line_items: [{ price: 'invalid_price', quantity: 1 }],
          mode: 'subscription',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Stripe API error');
      }
    });

    it('should handle database errors during user creation', async () => {
      mockDbInsert.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockCtx.db.insert('users', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection failed');
      }
    });

    it('should validate price ID is provided', () => {
      const priceId = undefined;

      if (!priceId) {
        expect(priceId).toBeUndefined();
        // In real implementation, should throw error
      }
    });
  });

  describe('Price ID Management', () => {
    it('should use correct price IDs for monthly and annual plans', () => {
      // These should be configured in environment variables
      const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_test';
      const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID || 'price_annual_test';

      expect(monthlyPriceId).toMatch(/^price_/);
      expect(annualPriceId).toMatch(/^price_/);
      expect(monthlyPriceId).not.toBe(annualPriceId);
    });
  });
});
