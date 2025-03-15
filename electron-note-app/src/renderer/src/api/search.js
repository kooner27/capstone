import { getCurrentUser } from './auth'

const API_URL = import.meta.env.VITE_API_URL

export const searchContent = async (query, tags = []) => {
  try {
    const user = getCurrentUser() // Get user ID from token
    if (!user) {
      throw new Error('Authentication required')
    }

    const token = localStorage.getItem('token') // Get token from storage
    if (!token) {
      throw new Error('Authentication token missing')
    }

    const userId = user.id // Extract user_id from token

    // Build search params
    const searchParams = new URLSearchParams()
    searchParams.append('q', query)

    // Add tags if provided
    if (tags && tags.length > 0) {
      searchParams.append('tags', tags.join(','))
    }

    const response = await fetch(
      `${API_URL}/api/users/${userId}/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Search API error:', error)
    throw error
  }
}
