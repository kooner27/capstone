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

// New helper functions to add
export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Simple JWT parsing
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    
    return {
      id: payload.user_id,
    };
  } catch (error) {
    console.error('Error extracting user data from token:', error);
    localStorage.removeItem('token');
    return null;
  }
}

export const isAuthenticated = () => {
  return !!getCurrentUser();
}

export const logout = () => {
  localStorage.removeItem('token');
  navigate('/signin')
}