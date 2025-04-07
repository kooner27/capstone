import { test, expect } from '@playwright/test'

// Helper function to sign in
async function signIn(page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*applayout/)
  await expect(page.locator('.MuiToolbar-root .MuiTypography-h6:has-text("TwoNote")')).toBeVisible()
}

test('Create notebook, section and note', async ({ page }) => {
  // Sign in first
  await signIn(page)

  // Create notebook by clicking the button
  await page.locator('button[aria-label="Create new notebook"]').click()

  const notebookName = 'Test Notebook ' + Date.now()
  await page.getByLabel('Notebook Name').fill(notebookName)
  await page.getByRole('button', { name: 'Create Notebook' }).click()

  // Verify notebook was created and selected
  await expect(page.getByText(notebookName)).toBeVisible()

  // Create section by clicking the button
  await page.locator('button[aria-label="Create new section"]').click()

  const sectionName = 'Test Section ' + Date.now()
  await page.getByLabel('Section Title').fill(sectionName)
  await page.getByRole('button', { name: 'Create Section' }).click()

  // Verify section was created and selected
  await expect(
    page.locator('.MuiListItemText-primary').filter({ hasText: sectionName })
  ).toBeVisible()

  // Verify section appears in the header
  await expect(
    page.locator('.MuiTypography-subtitle2').filter({ hasText: sectionName })
  ).toBeVisible()

  // Create note
  await page.locator('button[aria-label="Create new note"]').click()
  const noteName = 'Test Note ' + Date.now()
  await page.getByLabel('Note Title').fill(noteName)
  await page.getByRole('button', { name: 'Create Note' }).click()

  // Wait for the note to be created
  await page.waitForTimeout(1000)

  // Verify the note was created with a specific selector
  await expect(page.locator('.MuiListItemText-primary').filter({ hasText: noteName })).toBeVisible()

  // Take a screenshot of the created hierarchy
  await page.screenshot({ path: 'test-results/hierarchy-created.png' })

  // clean up
  await page.locator('button[title="Delete"]').click()
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Delete' }).click()

  // Wait for deletion to complete
  await page.waitForTimeout(1500)
})
