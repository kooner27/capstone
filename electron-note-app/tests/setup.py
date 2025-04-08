#!/usr/bin/env python3
import requests
import json
import sys
import time
import jwt

# Configuration
API_URL = "http://localhost:5000/api"
TEST_USER = {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "asdfjkl;"
}

print("Preparing test environment...")

def register_test_user():
    """Register the test user if it doesn't exist"""
    print(f"Attempting to register user '{TEST_USER['username']}'...")
    
    try:
        response = requests.post(
            f"{API_URL}/register",
            json=TEST_USER
        )
        
        if response.status_code == 201:
            print(f"User '{TEST_USER['username']}' registered successfully!")
            return True
        elif response.status_code == 400 and "User already exists" in response.text:
            print(f"User '{TEST_USER['username']}' already exists.")
            return True
        else:
            print(f"Failed to register user. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        return False

def login_test_user():
    """Login as test user and return the token"""
    print(f"Attempting to log in as '{TEST_USER['username']}'...")
    
    try:
        response = requests.post(
            f"{API_URL}/login",
            json={
                "username": TEST_USER["username"],
                "password": TEST_USER["password"]
            }
        )
        
        if response.status_code == 200:
            token = response.json().get("token")
            print("Login successful!")
            return token
        else:
            print(f"Login failed. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return None


def clean_user_notebooks(token):
    """Delete all notebooks for the user"""
    if not token:
        return False
        
    try:
        # Decode the JWT to get the actual user_id (ObjectId)
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded_token.get("user_id")
        
        if not user_id:
            print("Could not extract user_id from token")
            return False
            
        print(f"Using user_id: {user_id} from token")
        
        # Get all notebooks
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/users/{user_id}/notebooks", headers=headers)
        
        if response.status_code != 200:
            print(f"Failed to get notebooks. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        notebooks = response.json().get("notebooks", [])
        print(f"Found {len(notebooks)} notebooks to clean up.")
        
        # Delete each notebook
        for notebook in notebooks:
            notebook_id = notebook["_id"]
            delete_response = requests.delete(
                f"{API_URL}/users/{user_id}/notebooks/{notebook_id}", 
                headers=headers
            )
            
            if delete_response.status_code == 200:
                print(f"Deleted notebook: {notebook['name']}")
            else:
                print(f"Failed to delete notebook {notebook['name']}. Status: {delete_response.status_code}")
                
        return True
    except Exception as e:
        print(f"Error cleaning notebooks: {str(e)}")
        return False

# Main script execution
def main():
    # Check if backend is running
    try:
        health_check = requests.get(f"{API_URL}/")
        if health_check.status_code != 200:
            print("Backend API is not responding. Please start the backend server.")
            return False
    except requests.exceptions.ConnectionError:
        print("Cannot connect to backend API. Please ensure backend is running.")
        return False

    # First ensure the test user exists
    if not register_test_user():
        print("Failed to ensure test user exists.")
        return False
    
    # Then login with the test user
    token = login_test_user()
    if not token:
        print("Failed to authenticate as test user.")
        return False
    
    # Clean up existing notebooks
    if not clean_user_notebooks(token):
        print("Failed to clean up test environment.")
        return False
        
    print("Test environment is ready! You can now run the Playwright tests.")
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("Environment preparation failed.")
        sys.exit(1)
    sys.exit(0)
