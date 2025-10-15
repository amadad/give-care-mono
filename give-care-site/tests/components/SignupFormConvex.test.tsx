/**
 * Tests for SignupFormConvex component
 * TDD Phase 1: Write tests FIRST before implementation
 *
 * Tests cover:
 * - Form validation (required fields)
 * - Convex action integration
 * - Promo code functionality
 * - Error handling
 * - Redirect to Stripe checkout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupFormConvex } from '@/app/components/sections/SignupFormConvex'

// Mock Convex action
const mockCreateCheckoutSession = vi.fn()

vi.mock('convex/react', () => ({
  useAction: () => mockCreateCheckoutSession,
  ConvexProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmbeddedCheckout: () => <div data-testid="stripe-checkout">Stripe Checkout</div>,
}))

describe('SignupFormConvex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Validation', () => {
    it('should render all required form fields', () => {
      render(<SignupFormConvex />)

      expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument()
      expect(screen.getByText(/monthly/i)).toBeInTheDocument()
      expect(screen.getByText(/annual/i)).toBeInTheDocument()
    })

    it('should disable submit button when form is incomplete', () => {
      render(<SignupFormConvex />)

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when all required fields are filled', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      // Fill all fields
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      // Check both consent checkboxes
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // SMS consent
      await user.click(checkboxes[1]) // Terms consent

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      await user.type(screen.getByPlaceholderText(/email/i), 'invalid-email')
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should validate phone number length (minimum 10 digits)', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '555') // Too short

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should require SMS consent checkbox', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      // Only check terms, not SMS consent
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should require terms and conditions checkbox', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      // Only check SMS consent, not terms
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Plan Selection', () => {
    it('should default to monthly plan', () => {
      render(<SignupFormConvex />)

      const monthlyRadio = screen.getByRole('radio', { name: /monthly/i })
      expect(monthlyRadio).toBeChecked()
    })

    it('should allow switching to annual plan', async () => {
      const user = userEvent.setup()
      render(<SignupFormConvex />)

      const annualRadio = screen.getByRole('radio', { name: /annual/i })
      await user.click(annualRadio)

      expect(annualRadio).toBeChecked()
    })
  })

  describe('Promo Code Functionality', () => {
    it('should render promo code input field', () => {
      render(<SignupFormConvex />)

      // Promo code input might be in a collapsible section
      const promoInput = screen.queryByPlaceholderText(/promo code/i) ||
                         screen.queryByLabelText(/promo code/i)

      // If collapsible, might need to expand first
      if (!promoInput) {
        const expandButton = screen.queryByText(/have a promo code/i)
        expect(expandButton).toBeInTheDocument()
      }
    })

    it('should pass promo code to Convex action when provided', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test')

      render(<SignupFormConvex />)

      // Fill form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      // Enter promo code (may need to expand section first)
      const expandButton = screen.queryByText(/have a promo code/i)
      if (expandButton) {
        await user.click(expandButton)
      }

      const promoInput = screen.getByPlaceholderText(/promo code/i)
      await user.type(promoInput, 'CAREGIVER50')

      // Check consents
      const checkboxes = screen.getAllByRole('checkbox').filter(cb =>
        !cb.closest('[data-testid="promo-section"]')
      )
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      // Submit
      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
          expect.objectContaining({
            couponCode: 'CAREGIVER50',
          })
        )
      })
    })
  })

  describe('Convex Integration', () => {
    it('should call Convex createCheckoutSession action with correct data', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test')

      render(<SignupFormConvex />)

      // Fill form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      // Check consents
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      // Submit
      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phoneNumber: expect.stringMatching(/\+1\d{10}/), // E.164 format
          priceId: expect.any(String),
          couponCode: undefined, // No promo code in this test
        })
      })
    })

    it('should show loading state during checkout creation', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('https://checkout.stripe.com/test'), 1000))
      )

      render(<SignupFormConvex />)

      // Fill form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      // Submit
      const submitButton = screen.getByRole('button', { name: /continue to secure payment/i })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
    })

    it('should display Stripe checkout after successful session creation', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test')

      render(<SignupFormConvex />)

      // Fill and submit form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))

      // Should show Stripe checkout
      await waitFor(() => {
        expect(screen.getByTestId('stripe-checkout')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message if Convex action fails', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockRejectedValue(new Error('Network error'))

      render(<SignupFormConvex />)

      // Fill and submit form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should not show Stripe checkout if action fails', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockRejectedValue(new Error('Failed to create session'))

      render(<SignupFormConvex />)

      // Fill and submit form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))

      await waitFor(() => {
        expect(screen.queryByTestId('stripe-checkout')).not.toBeInTheDocument()
      })
    })

    it('should allow retrying after error', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('https://checkout.stripe.com/test')

      render(<SignupFormConvex />)

      // Fill form
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '(555) 123-4567')

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      // First attempt - fails
      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Second attempt - succeeds
      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))
      await waitFor(() => {
        expect(screen.getByTestId('stripe-checkout')).toBeInTheDocument()
      })
    })
  })

  describe('Phone Number Formatting', () => {
    it('should format phone number to E.164 format before submitting', async () => {
      const user = userEvent.setup()
      mockCreateCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test')

      render(<SignupFormConvex />)

      // Enter phone with various formats
      await user.type(screen.getByPlaceholderText(/full name/i), 'Jane Doe')
      await user.type(screen.getByPlaceholderText(/email/i), 'jane@example.com')
      await user.type(screen.getByPlaceholderText(/phone/i), '555-123-4567') // Dash format

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      await user.click(screen.getByRole('button', { name: /continue to secure payment/i }))

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
          expect.objectContaining({
            phoneNumber: '+15551234567', // E.164 format
          })
        )
      })
    })
  })
})
