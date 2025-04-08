import { test, expect } from '@playwright/test'

// Test constants
const TEST_USERNAME = 'testuser'
const TEST_PASSWORD = 'asdfjkl;'
const TEST_EMAIL = 'test@example.com'

test.describe('Authentication Tests', () => {
  test('AUTH-01: Sign in with valid credentials', async ({ page }) => {
    await page.goto('/')

    // Fill in form with valid credentials
    await page.getByLabel('Username').fill(TEST_USERNAME)
    await page.getByLabel('Password').fill(TEST_PASSWORD)

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify successful login and redirection
    await expect(page).toHaveURL(/.*applayout/)
    await expect(
      page.locator('.MuiToolbar-root .MuiTypography-h6:has-text("TwoNote")')
    ).toBeVisible()
  })

  test('AUTH-02: Sign in with invalid credentials', async ({ page }) => {
    await page.goto('/')

    // Fill in form with invalid credentials
    await page.getByLabel('Username').fill('wronguser')
    await page.getByLabel('Password').fill('wrongpass')

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify error message is shown
    await expect(page.locator('#name-helper-text')).toBeVisible()
    await expect(page.locator('#name-helper-text')).toHaveText('Invalid credentials')

    // Verify we're still on the sign-in page
    await expect(page).toHaveURL(/.*signin/)
  })

  test('AUTH-03: Sign in with empty fields', async ({ page }) => {
    await page.goto('/')

    // Submit form without filling any fields
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify validation errors are shown
    await expect(page.locator('#name-helper-text')).toBeVisible()
    await expect(page.locator('#name-helper-text')).toHaveText('Please enter a valid username.')
    await expect(page.locator('#password-helper-text')).toBeVisible()
    await expect(page.locator('#password-helper-text')).toHaveText(
      'Password must be at least 6 characters long.'
    )
  })

  test('AUTH-04: Sign up with missing fields', async ({ page }) => {
    // Start at the sign-in page
    await page.goto('/')

    // Navigate to sign-up page by clicking the link
    await page.getByText('Sign up').click()

    // Wait for navigation to complete
    await expect(page).toHaveURL(/.*signup/)

    // Ensure the sign-up form is visible
    await expect(page.getByText('Sign up').first()).toBeVisible()

    // Submit form without filling any fields
    await page.getByRole('button', { name: 'Sign up' }).click()

    // Verify validation errors are shown
    await expect(page.locator('#name-helper-text')).toBeVisible()
    await expect(page.locator('#name-helper-text')).toHaveText('username is required.')
    await expect(page.locator('#email-helper-text')).toBeVisible()
    await expect(page.locator('#email-helper-text')).toHaveText(
      'Please enter a valid email address.'
    )
    await expect(page.locator('#password-helper-text')).toBeVisible()
    await expect(page.locator('#password-helper-text')).toHaveText(
      'Password must be at least 6 characters long.'
    )
  })

  test('AUTH-05: Sign up with invalid email format', async ({ page }) => {
    // Start at the sign-in page
    await page.goto('/')

    // Navigate to sign-up page by clicking the link
    await page.getByText('Sign up').click()

    // Wait for navigation to complete
    await expect(page).toHaveURL(/.*signup/)

    // Fill in form with invalid email
    await page.getByLabel('Username').fill('validuser')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill(TEST_PASSWORD)

    // Submit form
    await page.getByRole('button', { name: 'Sign up' }).click()

    // Verify email validation error is shown
    await expect(page.locator('#email-helper-text')).toBeVisible()
    await expect(page.locator('#email-helper-text')).toHaveText(
      'Please enter a valid email address.'
    )
  })
})
