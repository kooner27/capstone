import { test, expect } from '@playwright/test'

test('Sign in page loads correctly', async ({ page }) => {
  // Navigate to your app
  await page.goto('/')

  // Check if we're redirected to the sign in page
  await expect(page).toHaveURL(/.*signin/)

  // Verify the sign-in page elements are present
  // Use more specific selectors to avoid ambiguity
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Username')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('Sign in with valid credentials', async ({ page }) => {
  await page.goto('/')

  // Fill the sign-in form
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')

  // Click the sign-in button
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for navigation to complete (should redirect to applayout)
  await expect(page).toHaveURL(/.*applayout/)

  // Verify we're logged in by checking for TwoNote in the navbar
  // Use a more specific selector to avoid ambiguity
  await expect(page.locator('.MuiToolbar-root .MuiTypography-h6:has-text("TwoNote")')).toBeVisible()
})
