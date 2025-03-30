const API_URL = import.meta.env.VITE_API_URL

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  }
}

// Get user ID from token
export const getUserId = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    // Simple JWT parsing
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.user_id
  } catch (error) {
    console.error('Error extracting user ID from token:', error)
    return null
  }
}

// Notebooks
export const getUserNotebooks = async () => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks`, {
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch notebooks')
  }

  return data.notebooks
}

export const createNotebook = async (name) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create notebook')
  }

  return data.notebook
}

// Sections
export const getSections = async (notebookId) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks/${notebookId}/sections`, {
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch sections')
  }

  return data.sections
}

export const createSection = async (notebookId, title) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks/${notebookId}/sections`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create section')
  }

  return data.section
}

// Notes
export const getNotes = async (notebookId, sectionId) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes`,
    { headers: getAuthHeaders() }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch notes')
  }

  return data.notes
}

// export const createNote = async (notebookId, sectionId, title, content = '') => {
//   const userId = getUserId()
//   if (!userId) throw new Error('User not authenticated')

//   const response = await fetch(
//     `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes`,
//     {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify({ title, content })
//     }
//   )

//   const data = await response.json()

//   if (!response.ok) {
//     throw new Error(data.message || 'Failed to create note')
//   }

//   return data.note
// }

export const updateNote = async (notebookId, sectionId, noteId, title, content) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes/${noteId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content })
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update note')
  }

  return data
}

// Helper function
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// New create note that doesn't throw error right away because api is slow
export const createNote = async (notebookId, sectionId, title, content = '') => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Maximum retry attempts
  const MAX_RETRIES = 3
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      attempt++
      console.log(`Creating note attempt ${attempt}/${MAX_RETRIES}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout

      const response = await fetch(
        `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title, content }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      // Process the response
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create note')
      }

      console.log('Note created successfully')
      return data.note
    } catch (err) {
      // Handle connection resets specially
      if (
        err.name === 'TypeError' &&
        (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))
      ) {
        console.log('Connection reset detected, checking if note was created...')

        // Wait before checking
        await wait(2000 * attempt)

        try {
          // Try to fetch notes to see if our note was created
          const notes = await getNotes(notebookId, sectionId)
          const potentialNewNote = notes.find((n) => n.title === title)

          if (potentialNewNote) {
            console.log('Note was actually created despite connection reset')
            return potentialNewNote
          }
        } catch (checkErr) {
          console.error('Error checking if note was created:', checkErr)
        }
      }

      console.error(`Error creating note (attempt ${attempt}/${MAX_RETRIES}):`, err)

      // If we've reached max attempts, throw the error
      if (attempt >= MAX_RETRIES) {
        throw err
      }

      // Exponential backoff before retrying
      await wait(2000 * attempt)
    }
  }
}
