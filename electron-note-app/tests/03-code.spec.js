import { test, expect } from '@playwright/test'

// Helper function to sign in
async function signIn(page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*applayout/)
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

  // Create note
  await page.locator('button[aria-label="Create new note"]').click()
  const noteName = 'Test Note ' + Date.now()
  await page.getByLabel('Note Title').fill(noteName)
  await page.getByRole('button', { name: 'Create Note' }).click()

  // Wait for the note to be created
  await page.waitForTimeout(1000)

  return { notebookName, sectionName, noteName }
}

test('Code block creation and UI test', async ({ page }) => {
  // Sign in first
  await signIn(page)

  // Create notebook, section and note
  await setupNoteHierarchy(page)

  // Click on the edit button and enter edit mode
  await page.locator('button:has(svg[data-testid="EditIcon"])').click()
  const editableArea = page.locator('pre[contenteditable="true"]')
  await expect(editableArea).toBeVisible()

  // Clear any default content
  await editableArea.clear()

  // Add a Python code block
  await page.keyboard.type('# Python Code Block Test')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.keyboard.type('This is a test of the code block rendering:')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')

  // Add code block with triple backticks
  await page.keyboard.type('```python')
  await page.keyboard.press('Enter')
  await page.keyboard.type('# A simple Python program')
  await page.keyboard.press('Enter')
  await page.keyboard.type('print("Hello from Python!")')
  await page.keyboard.press('Enter')
  await page.keyboard.type('print(f"The sum of 5 and 10 is {5 + 10}")')
  await page.keyboard.press('Enter')
  await page.keyboard.type('```')

  // Take screenshot of edit mode with code block
  await page.screenshot({ path: 'test-results/code-block-edit.png' })

  // Save the note
  await page.locator('button:has(svg[data-testid="SaveIcon"])').click()
  await expect(page.getByText('Content saved successfully')).toBeVisible()

  // Exit edit mode
  await page.getByRole('button', { name: 'Exit Edit Mode' }).click()
  await page.waitForTimeout(1000)

  // Take screenshot of rendered code block
  await page.screenshot({ path: 'test-results/code-block-rendered.png' })

  // Verify code block elements are visible
  await expect(page.locator('h1').filter({ hasText: 'Python Code Block Test' })).toBeVisible()

  // Find and verify the play button is visible
  const runButton = page.locator('.MuiIconButton-root svg[data-testid="PlayArrowIcon"]').first()
  await expect(runButton).toBeVisible()

  // Click the run button
  await runButton.click()

  // Wait for error message to appear
  await page.waitForTimeout(1000)

  // Take screenshot showing the error or output area
  await page.screenshot({ path: 'test-results/code-execution-attempt.png' })

  // Look for either the expected error message or any output area that appears
  const errorVisible = await page
    .getByText('Python execution is only available')
    .isVisible()
    .catch(() => false)
  const outputAreaVisible = await page
    .locator('.code-output')
    .isVisible()
    .catch(() => false)

  // Verify that either an error message is shown or an output area appears
  expect(errorVisible || outputAreaVisible).toBeTruthy()

  // Clean up
  await page.locator('button[title="Delete"]').click()
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.waitForTimeout(1000)
})
