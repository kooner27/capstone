// import { getCurrentUser } from './auth'
import { getUserId, getAuthHeaders } from './notebook'
const API_URL = import.meta.env.VITE_API_URL

// Label-specific update endpoints
export const updateNotebookLabels = async (notebookId, labels) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks/${notebookId}/labels`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ labels })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update notebook labels')
  }

  return data
}

export const updateSectionLabels = async (notebookId, sectionId, labels) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/labels`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ labels })
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update section labels')
  }

  return data
}

export const updateNoteLabels = async (notebookId, sectionId, noteId, labels) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes/${noteId}/labels`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ labels })
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update note labels')
  }

  return data
}

// Fetch all unique labels used by the current user
export const fetchUserLabels = async () => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/labels`, {
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user labels')
  }

  return data.labels
}
