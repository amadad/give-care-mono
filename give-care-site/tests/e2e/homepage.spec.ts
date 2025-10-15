import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /seen and supported/i })).toBeVisible()
    
    // Check for navigation
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Words' })).toBeVisible()
    
    // Check for CTA button
    await expect(page.getByRole('link', { name: 'Learn More' })).toBeVisible()
  })

  test('should have scenario buttons', async ({ page }) => {
    await page.goto('/')
    
    // Check for scenario buttons
    await expect(page.getByText('Burnout')).toBeVisible()
    await expect(page.getByText('Guilt')).toBeVisible()
    await expect(page.getByText('Identity')).toBeVisible()
    await expect(page.getByText('Navigation')).toBeVisible()
  })

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('link', { name: 'Learn More' }).click()
    await expect(page).toHaveURL('/about')
  })
})