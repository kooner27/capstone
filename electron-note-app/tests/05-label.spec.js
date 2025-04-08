import { test, expect } from '@playwright/test'

// Helper function to sign in
async function signIn(page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*applayout/)
}

// Helper function to create notebook, section and note
async function createNoteHierarchy(page) {
  const timestamp = Date.now()
  const notebookName = `Label Test Notebook ${timestamp}`
  const sectionName = `Label Test Section ${timestamp}`
  const noteName = `Label Test Note ${timestamp}`

  // Create notebook
  await page.locator('button[aria-label="Create new notebook"]').click()
  await page.getByLabel('Notebook Name').fill(notebookName)
  await page.getByRole('button', { name: 'Create Notebook' }).click()

  // Create section
  await page.locator('button[aria-label="Create new section"]').click()
  await page.getByLabel('Section Title').fill(sectionName)
  await page.getByRole('button', { name: 'Create Section' }).click()

  // Create note
  await page.locator('button[aria-label="Create new note"]').click()
  await page.getByLabel('Note Title').fill(noteName)
  await page.getByRole('button', { name: 'Create Note' }).click()

  // Wait for the note to be created and selected
  await page.waitForTimeout(500)

  return { notebookName, sectionName, noteName }
}

test.describe('Label Management', () => {
  test('Add labels to notebook, section, and note', async ({ page }) => {
    // Sign in
    await signIn(page)

    // Create notebook, section, and note
    const { notebookName, sectionName, noteName } = await createNoteHierarchy(page)

    // Define test labels
    const notebookLabel = 'nb-label-' + Date.now()
    const sectionLabel = 'section-label-' + Date.now()
    const noteLabel = 'note-label-' + Date.now()

    // Click on Labels icon in navbar
    await page.locator('button[title="Labels"]').click()

    // Wait for the dialog to appear
    await expect(page.locator('div[role="dialog"]')).toBeVisible()
    await expect(page.getByText('Manage Labels')).toBeVisible()

    // Take screenshot of the labels dialog
    await page.screenshot({ path: 'test-results/labels-dialog.png' })

    // Add notebook label
    await page.getByLabel('Add notebook label').fill(notebookLabel)
    await page.getByLabel('Add notebook label').press('Enter')

    // Verify notebook label was added as a chip
    await expect(page.locator('.MuiChip-label').getByText(notebookLabel)).toBeVisible()

    // Add section label
    await page.getByLabel('Add section label').fill(sectionLabel)
    await page.getByLabel('Add section label').press('Enter')

    // Verify section label was added as a chip
    await expect(page.locator('.MuiChip-label').getByText(sectionLabel)).toBeVisible()

    // Add note label
    await page.getByLabel('Add note label').fill(noteLabel)
    await page.getByLabel('Add note label').press('Enter')

    // Verify note label was added as a chip
    await expect(page.locator('.MuiChip-label').getByText(noteLabel)).toBeVisible()

    // Take screenshot of the labels dialog with all labels added
    await page.screenshot({ path: 'test-results/labels-added.png' })

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click()

    // Wait for dialog to close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible()

    // Reopen the Labels dialog to verify persistence
    await page.locator('button[title="Labels"]').click()

    // Verify the labels are still there
    await expect(page.locator('.MuiChip-label').getByText(notebookLabel)).toBeVisible()
    await expect(page.locator('.MuiChip-label').getByText(sectionLabel)).toBeVisible()
    await expect(page.locator('.MuiChip-label').getByText(noteLabel)).toBeVisible()

    // Take screenshot of the labels verification
    await page.screenshot({ path: 'test-results/labels-verified.png' })

    // Close the dialog
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Clean up by deleting the notebook
    await page.locator('button[title="Delete"]').click()
    await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await page.waitForTimeout(500)

    // Verify notebook was deleted
    await expect(page.getByText(notebookName)).not.toBeVisible()
  })

  test('LABEL-02: Remove labels from items', async ({ page }) => {
    // Sign in
    await signIn(page)

    // Create notebook, section, and note
    const { notebookName } = await createNoteHierarchy(page)

    // Define test label
    const testLabel = 'temp-label-' + Date.now()

    // Click on Labels icon in navbar
    await page.locator('button[title="Labels"]').click()

    // Wait for the dialog to appear
    await expect(page.locator('div[role="dialog"]')).toBeVisible()

    // Add notebook label
    await page.getByLabel('Add notebook label').fill(testLabel)
    await page.getByLabel('Add notebook label').press('Enter')

    // Verify notebook label was added
    await expect(page.locator('.MuiChip-label').getByText(testLabel)).toBeVisible()

    // Delete the label by clicking the delete icon on the chip
    await page.locator('.MuiChip-deleteIcon').first().click()

    // Verify the label was removed
    await expect(page.locator('.MuiChip-label').getByText(testLabel)).not.toBeVisible()

    // Save changes
    await page.getByRole('button', { name: 'Save' }).click()

    // Wait for dialog to close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible()

    // Clean up
    await page.locator('button[title="Delete"]').click()
    await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await page.waitForTimeout(500)
  })
})
