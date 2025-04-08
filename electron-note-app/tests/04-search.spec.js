import { test, expect } from '@playwright/test'

// Helper function to sign in
async function signIn(page) {
  await page.goto('/')
  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('asdfjkl;')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*applayout/)
}

// Helper function to create test data with unique, searchable content
async function createSearchableContent(page) {
  const timestamp = Date.now()
  const searchTerm = `Unique${timestamp}`

  // Create notebook
  await page.locator('button[aria-label="Create new notebook"]').click()
  const notebookName = `Search Test Notebook ${searchTerm}`
  await page.getByLabel('Notebook Name').fill(notebookName)
  await page.getByRole('button', { name: 'Create Notebook' }).click()

  // Create section
  await page.locator('button[aria-label="Create new section"]').click()
  const sectionName = `Search Test Section ${searchTerm}`
  await page.getByLabel('Section Title').fill(sectionName)
  await page.getByRole('button', { name: 'Create Section' }).click()

  // Create note
  await page.locator('button[aria-label="Create new note"]').click()
  const noteName = `Search Test Note ${searchTerm}`
  await page.getByLabel('Note Title').fill(noteName)
  await page.getByRole('button', { name: 'Create Note' }).click()

  // Wait for the note to be created
  await page.waitForTimeout(500)

  // Click on the edit button and enter edit mode to add content to the note
  await page.locator('button:has(svg[data-testid="EditIcon"])').click()
  const editableArea = page.locator('pre[contenteditable="true"]')
  await expect(editableArea).toBeVisible()

  // Clear any default content and add specific, searchable content
  await editableArea.clear()
  await editableArea.fill(
    `# ${searchTerm} Note Content\n\nThis note contains the searchable term "${searchTerm}" multiple times for testing search functionality.\n\n## Another Heading with ${searchTerm}\n\nMore content with ${searchTerm} included.`
  )

  // Save the note
  await page.locator('button:has(svg[data-testid="SaveIcon"])').click()
  await expect(page.getByText('Content saved successfully')).toBeVisible()

  // Exit edit mode
  await page.getByRole('button', { name: 'Exit Edit Mode' }).click()
  await page.waitForTimeout(500)

  return { notebookName, sectionName, noteName, searchTerm }
}

test.describe('Search Functionality', () => {
  test('SRCH-01: Basic search test', async ({ page }) => {
    // Sign in
    await signIn(page)

    // Create content with unique searchable terms
    const { searchTerm } = await createSearchableContent(page)

    // Focus on search bar
    const searchBar = page.locator('input[placeholder="Search... (Press Enter)"]')
    await searchBar.click()

    // Enter search term
    await searchBar.fill(searchTerm)

    // Press enter to perform search
    await searchBar.press('Enter')

    // Wait for search results to appear
    await page.waitForTimeout(500)

    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/search-results.png' })

    // Verify search results popper is visible
    const resultsPopper = page.locator('.MuiPopper-root')
    await expect(resultsPopper).toBeVisible()

    // Verify the search results heading contains our search term
    const resultsHeading = resultsPopper.getByText(new RegExp(`results.*for.*"${searchTerm}"`))
    await expect(resultsHeading).toBeVisible()

    // Verify that result types appear in the chips
    await expect(
      resultsPopper.locator('.MuiChip-label').getByText('notebook', { exact: true })
    ).toBeVisible()
    await expect(
      resultsPopper.locator('.MuiChip-label').getByText('section', { exact: true })
    ).toBeVisible()
    await expect(
      resultsPopper.locator('.MuiChip-label').getByText('note', { exact: true })
    ).toBeVisible()

    // Delete notebook
    await page.locator('button[title="Delete"]').click()
    await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await page.waitForTimeout(500)
  })

  test('SRCH-02: Clear search test', async ({ page }) => {
    // Sign in
    await signIn(page)

    // Focus on search bar
    const searchBar = page.locator('input[placeholder="Search... (Press Enter)"]')
    await searchBar.click()

    // Enter a search term
    await searchBar.fill('test')

    // Verify the clear button appears
    await expect(page.locator('button:has(svg[data-testid="ClearIcon"])').first()).toBeVisible()

    // Click the clear button
    await page.locator('button:has(svg[data-testid="ClearIcon"])').first().click()

    // Verify search bar is cleared
    await expect(searchBar).toHaveValue('')
  })
})
