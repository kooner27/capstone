import { getCurrentUser } from './auth'

const API_URL = import.meta.env.VITE_API_URL

export const searchContent = async (query, labels = []) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }

    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Authentication token missing')
    }

    const userId = user.id

    const searchParams = new URLSearchParams()

    // Only add query if it's not empty
    if (query && query.trim()) {
      searchParams.append('q', query.trim())
    }

    // Add labels if provided (renamed from tags to labels)
    if (labels && labels.length > 0) {
      searchParams.append('labels', labels.join(',')) // Changed from 'tags' to 'labels'
    }

    // // Log the constructed URL for debugging
    // console.log(`Search URL: ${API_URL}/api/users/${userId}/search?${searchParams.toString()}`)

    const response = await fetch(`${API_URL}/users/${userId}/search?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`)
    }

    const data = await response.json()
    // console.log('Search results:', data) // Log results for debugging
    return data
  } catch (error) {
    console.error('Search API error:', error)
    throw error
  }
}
