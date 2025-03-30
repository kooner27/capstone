// import { getCurrentUser } from './auth'
import { getUserId, getAuthHeaders } from './notebook'
const API_URL = import.meta.env.VITE_API_URL

export const deleteNotebook = async (notebookId) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_URL}/users/${userId}/notebooks/${notebookId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete notebook')
  }

  return data
}

export const deleteSection = async (notebookId, sectionId) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete section')
  }

  return data
}

export const deleteNote = async (notebookId, sectionId, noteId) => {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(
    `${API_URL}/users/${userId}/notebooks/${notebookId}/sections/${sectionId}/notes/${noteId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete note')
  }

  return data
}
