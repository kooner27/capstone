const API_URL = import.meta.env.VITE_API_URL

export const registerUser = async (user) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || 'Signup failed')
  }

  return responseData
}

export const loginUser = async (user) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || 'Login failed')
  }

  return responseData
}
