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

// Helper function to create a notebook, section, and note
async function setupNoteHierarchy(page) {
  // Create notebook
  await page.locator('button[aria-label="Create new notebook"]').click()
  const notebookName = 'Test Notebook ' + Date.now()
  await page.getByLabel('Notebook Name').fill(notebookName)
  await page.getByRole('button', { name: 'Create Notebook' }).click()

  // Create section
  await page.locator('button[aria-label="Create new section"]').click()
  const sectionName = 'Test Section ' + Date.now()
  await page.getByLabel('Section Title').fill(sectionName)
  await page.getByRole('button', { name: 'Create Section' }).click()

  // Verify section was created
  await expect(
    page.locator('.MuiListItemText-primary').filter({ hasText: sectionName })
  ).toBeVisible()

  // Create note
  await page.locator('button[aria-label="Create new note"]').click()
  const noteName = 'Test Note ' + Date.now()
  await page.getByLabel('Note Title').fill(noteName)
  await page.getByRole('button', { name: 'Create Note' }).click()

  // Wait for the note to be created
  await page.waitForTimeout(1000)

  return { notebookName, sectionName, noteName }
}

test('Basic markdown editing test', async ({ page }) => {
  // Sign in first
  await signIn(page)

  // Create notebook, section and note using helper function
  await setupNoteHierarchy(page)

  // Click on the edit button and enter edit mode
  await page.locator('button:has(svg[data-testid="EditIcon"])').click()
  const editableArea = page.locator('pre[contenteditable="true"]')
  await expect(editableArea).toBeVisible()

  // Add content to the note
  await editableArea.press('Enter')
  await editableArea.press('Enter')
  await page.keyboard.type('## Added in Test')
  await page.keyboard.press('Enter')
  await page.keyboard.type('This content was added by an automated test!')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.keyboard.type('- First bullet point')
  await page.keyboard.press('Enter')
  await page.keyboard.type('- Second bullet point')
  await page.keyboard.press('Enter')
  await page.keyboard.type('- Third bullet point')

  // Take screenshot of edit mode
  await page.screenshot({ path: 'test-results/edit-mode.png' })

  // Click Save icon
  await page.locator('button:has(svg[data-testid="SaveIcon"])').click()

  // Verify saved successfully
  await expect(page.getByText('Content saved successfully')).toBeVisible()

  // Exit edit mode
  await page.getByRole('button', { name: 'Exit Edit Mode' }).click()

  // Wait to allow it to render
  await page.waitForTimeout(1000)

  // Take screenshot of the rendered markdown
  await page.screenshot({ path: 'test-results/rendered-markdown.png' })

  // Verify rendered elements - same as in the working test
  await expect(page.locator('h2').filter({ hasText: 'Added in Test' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'First bullet point' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'Second bullet point' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'Third bullet point' })).toBeVisible()

  // Clean up
  await page.locator('button[title="Delete"]').click()
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Delete' }).click()

  // Wait for deletion to complete
  await page.waitForTimeout(1000)
})
