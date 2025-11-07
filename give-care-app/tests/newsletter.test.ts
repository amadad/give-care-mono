/**
 * Newsletter mutation tests (TDD)
 * Testing subscribe/unsubscribe as single-transaction mutations
 */

import { describe, test, expect } from 'vitest'
import { convexTest } from 'convex-test'
import schema from '../convex/schema'
import { api } from '../convex/_generated/api'

describe('Newsletter mutations', () => {
  describe('subscribe mutation', () => {
    test('should subscribe new email', async () => {
      const t = convexTest(schema)

      const result = await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.email).toBe('test@example.com')
      expect(result.alreadySubscribed).toBeUndefined()

      // Verify database state
      const subscriber = await t.query(api.functions.newsletter.getByEmail, {
        email: 'test@example.com',
      })
      expect(subscriber).toBeDefined()
      expect(subscriber!.email).toBe('test@example.com')
      expect(subscriber!.unsubscribed).toBe(false)
    })

    test('should normalize email (lowercase + trim)', async () => {
      const t = convexTest(schema)

      const result = await t.mutation(api.functions.newsletter.subscribe, {
        email: '  Test@Example.COM  ',
      })

      expect(result.email).toBe('test@example.com')

      const subscriber = await t.query(api.functions.newsletter.getByEmail, {
        email: 'test@example.com',
      })
      expect(subscriber).toBeDefined()
    })

    test('should return alreadySubscribed for existing active email', async () => {
      const t = convexTest(schema)

      // Subscribe first time
      await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      // Subscribe again
      const result = await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.alreadySubscribed).toBe(true)
    })

    test('should resubscribe previously unsubscribed email', async () => {
      const t = convexTest(schema)

      // Subscribe then unsubscribe
      await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })
      await t.mutation(api.functions.newsletter.unsubscribe, {
        email: 'test@example.com',
      })

      // Resubscribe
      const result = await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.alreadySubscribed).toBeUndefined()

      const subscriber = await t.query(api.functions.newsletter.getByEmail, {
        email: 'test@example.com',
      })
      expect(subscriber!.unsubscribed).toBe(false)
      expect(subscriber!.resubscribedAt).toBeDefined()
    })

    test('should reject invalid email format', async () => {
      const t = convexTest(schema)

      await expect(
        t.mutation(api.functions.newsletter.subscribe, {
          email: 'not-an-email',
        })
      ).rejects.toThrow('Invalid email')
    })

    test('should reject empty email', async () => {
      const t = convexTest(schema)

      await expect(
        t.mutation(api.functions.newsletter.subscribe, {
          email: '',
        })
      ).rejects.toThrow('Invalid email')
    })

    test('should reject email without @', async () => {
      const t = convexTest(schema)

      await expect(
        t.mutation(api.functions.newsletter.subscribe, {
          email: 'testexample.com',
        })
      ).rejects.toThrow('Invalid email')
    })

    test('should reject email without domain', async () => {
      const t = convexTest(schema)

      await expect(
        t.mutation(api.functions.newsletter.subscribe, {
          email: 'test@',
        })
      ).rejects.toThrow('Invalid email')
    })

    test('should complete in single transaction', async () => {
      const t = convexTest(schema)

      // This test ensures subscribe is a mutation, not an action
      // Mutations are transactional, actions are not
      const result = await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      // If this succeeds, it proves subscribe is a mutation
      // (actions would fail with convexTest.mutation)
      expect(result.success).toBe(true)
    })
  })

  describe('unsubscribe mutation', () => {
    test('should unsubscribe existing subscriber', async () => {
      const t = convexTest(schema)

      // Subscribe first
      await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      // Unsubscribe
      const result = await t.mutation(api.functions.newsletter.unsubscribe, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.email).toBe('test@example.com')

      const subscriber = await t.query(api.functions.newsletter.getByEmail, {
        email: 'test@example.com',
      })
      expect(subscriber!.unsubscribed).toBe(true)
      expect(subscriber!.unsubscribedAt).toBeDefined()
    })

    test('should create unsubscribed record for non-existing email', async () => {
      const t = convexTest(schema)

      const result = await t.mutation(api.functions.newsletter.unsubscribe, {
        email: 'never-subscribed@example.com',
      })

      expect(result.success).toBe(true)

      const subscriber = await t.query(api.functions.newsletter.getByEmail, {
        email: 'never-subscribed@example.com',
      })
      expect(subscriber).toBeDefined()
      expect(subscriber!.unsubscribed).toBe(true)
    })

    test('should normalize email before unsubscribe', async () => {
      const t = convexTest(schema)

      await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      const result = await t.mutation(api.functions.newsletter.unsubscribe, {
        email: '  TEST@EXAMPLE.COM  ',
      })

      expect(result.email).toBe('test@example.com')
    })

    test('should reject invalid email format', async () => {
      const t = convexTest(schema)

      await expect(
        t.mutation(api.functions.newsletter.unsubscribe, {
          email: 'not-an-email',
        })
      ).rejects.toThrow('Invalid email')
    })

    test('should complete in single transaction', async () => {
      const t = convexTest(schema)

      await t.mutation(api.functions.newsletter.subscribe, {
        email: 'test@example.com',
      })

      const result = await t.mutation(api.functions.newsletter.unsubscribe, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
    })
  })
})
