import { test, expect } from '@playwright/test'

// Helper function to sign in
async function signIn(page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*applayout/)
}

test.describe('Notebook Hierarchy Management', () => {
  const testData = {
    notebookName: 'Test Notebook ' + Date.now(),
    sectionName: 'Test Section ' + Date.now(),
    noteName: 'Test Note ' + Date.now()
  }

  test('HIER-01: Create notebook with valid name', async ({ page }) => {
    await signIn(page)

    // Create notebook
    await page.locator('button[aria-label="Create new notebook"]').click()
    await page.getByLabel('Notebook Name').fill(testData.notebookName)
    await page.getByRole('button', { name: 'Create Notebook' }).click()

    // Verify notebook was created
    await expect(page.getByText(testData.notebookName)).toBeVisible()
  })

  test('HIER-02: Create section within notebook', async ({ page }) => {
    await signIn(page)

    // First select the notebook we created
    await page.getByText(testData.notebookName).click()

    // Create section
    await page.locator('button[aria-label="Create new section"]').click()
    await page.getByLabel('Section Title').fill(testData.sectionName)
    await page.getByRole('button', { name: 'Create Section' }).click()

    // Verify section was created
    await expect(
      page.locator('.MuiListItemText-primary').filter({ hasText: testData.sectionName })
    ).toBeVisible()
  })

  test('HIER-03: Create note within section', async ({ page }) => {
    await signIn(page)

    // Navigate to previously created notebook and section
    await page.getByText(testData.notebookName).click()
    await page.locator('.MuiListItemText-primary').filter({ hasText: testData.sectionName }).click()

    // Create note
    await page.locator('button[aria-label="Create new note"]').click()
    await page.getByLabel('Note Title').fill(testData.noteName)
    await page.getByRole('button', { name: 'Create Note' }).click()

    // Wait for note creation
    await page.waitForTimeout(500)

    // Verify note was created
    await expect(
      page.locator('.MuiListItemText-primary').filter({ hasText: testData.noteName })
    ).toBeVisible()
  })

  test('HIER-04: Delete note', async ({ page }) => {
    await signIn(page)

    // Navigate to previously created hierarchy
    await page.getByText(testData.notebookName).click()
    await page.locator('.MuiListItemText-primary').filter({ hasText: testData.sectionName }).click()

    // Select and delete note
    await page.locator('.MuiListItemText-primary').filter({ hasText: testData.noteName }).click()
    await page.locator('button[title="Delete"]').click()
    // await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await page.waitForTimeout(500)

    // Verify note was deleted
    await expect(
      page.locator('.MuiListItemText-primary').filter({ hasText: testData.noteName })
    ).not.toBeVisible()
  })

  test('HIER-05: Delete notebook (cascade deletion)', async ({ page }) => {
    await signIn(page)

    // Select notebook
    await page.getByText(testData.notebookName).click()

    // Delete notebook
    await page.locator('button[title="Delete"]').click()
    await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await page.waitForTimeout(500)

    // Verify notebook was deleted
    await expect(page.getByText(testData.notebookName)).not.toBeVisible()
  })
})
