// This file handles test setup like creating a test user

export default async function setupTestUser(request) {
  const testUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'asdfjkl;'
  }

  const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000/api'

  try {
    console.log('Attempting to log in test user...')
    const loginResponse = await request.post(`${apiUrl}/login`, {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    })

    if (loginResponse.ok()) {
      console.log('Test user already exists, login successful.')
      return
    }
  } catch (error) {
    console.log('Login failed, will try to create test user.')
  }

  try {
    console.log('Creating test user...')
    const registerResponse = await request.post(`${apiUrl}/register`, {
      data: testUser
    })

    if (registerResponse.ok()) {
      console.log('Test user created successfully.')
    } else {
      console.error('Failed to create test user:', await registerResponse.text())
    }
  } catch (error) {
    console.error('Error creating test user:', error)
  }
}
