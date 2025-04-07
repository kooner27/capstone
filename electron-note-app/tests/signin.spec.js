import { test, expect } from '@playwright/test'

test('Sign in page loads correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('/')

  // Check if redirected to the sign in page
  await expect(page).toHaveURL(/.*signin/)

  // Verify the sign-in page elements are present
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Username')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('Sign in with valid credentials', async ({ page }) => {
  // Fill in Sign in form and submit
  await page.goto('/')

  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')

  // Click the sign-in button
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for it to redirect to applayout
  await expect(page).toHaveURL(/.*applayout/)

  // Verify we're logged in by checking for TwoNote in the navbar
  await expect(page.locator('.MuiToolbar-root .MuiTypography-h6:has-text("TwoNote")')).toBeVisible()
})
