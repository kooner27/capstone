# Testing Auth endpoints with real MongoDB and equivalence class testing
import pytest
import os
from pymongo import MongoClient
from app import app, init_db

# Use a dedicated test database
TEST_DB_NAME = "note_app_test"

@pytest.fixture(scope="function")
def client():
    """Test client using a real test database"""
    # Create note_app_test database, run tests, then drop it

    # Configure app for testing
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test_secret_key"
    app.config["MONGO_URI"] = f"mongodb://localhost:27017/{TEST_DB_NAME}"
    
    # Clean the database before the test
    mongo_client = MongoClient(app.config["MONGO_URI"])
    mongo_client.drop_database(TEST_DB_NAME)
    
    # Initialize the database
    init_db(app)
    
    # Create test client
    with app.test_client() as client:
        yield client
    
    # Clean up after the test just to be safe
    mongo_client.drop_database(TEST_DB_NAME)
    mongo_client.close()

# --- Registration Endpoint Tests ---

def test_register_valid(client):
    """Test registration with valid credentials (equivalence class: valid input)"""
    response = client.post("/api/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 201
    assert response.json["message"] == "User registered successfully"
    assert "user_id" in response.json

def test_register_missing_email(client):
    """Test registration with missing email (equivalence class: invalid - incomplete)"""
    response = client.post("/api/register", json={
        "username": "incomplete_user",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.json["message"]

def test_register_missing_username(client):
    """Test registration with missing username (equivalence class: invalid - incomplete)"""
    response = client.post("/api/register", json={
        "email": "missing_username@example.com",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.json["message"]

def test_register_missing_password(client):
    """Test registration with missing password (equivalence class: invalid - incomplete)"""
    response = client.post("/api/register", json={
        "email": "missing_password@example.com",
        "username": "missing_password_user"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.json["message"]

def test_register_duplicate_email(client):
    """Test registration with duplicate email (equivalence class: invalid - duplicate)"""
    client.post("/api/register", json={
        "email": "duplicate@example.com", 
        "username": "originaluser",
        "password": "password123"
    })
    
    response = client.post("/api/register", json={
        "email": "duplicate@example.com", 
        "username": "newuser",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "User already exists" in response.json["message"]

def test_register_duplicate_username(client):
    """Test registration with duplicate username (equivalence class: invalid - duplicate)"""
    client.post("/api/register", json={
        "email": "first@example.com", 
        "username": "duplicateuser",
        "password": "password123"
    })
    
    response = client.post("/api/register", json={
        "email": "second@example.com", 
        "username": "duplicateuser",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "User already exists" in response.json["message"]

# --- Login Endpoint Tests ---

def test_login_valid(client):
    """Test login with valid credentials (equivalence class: valid input)"""
    client.post("/api/register", json={
        "email": "login_test@example.com",
        "username": "login_user",
        "password": "correct_password"
    })
    
    response = client.post("/api/login", json={
        "username": "login_user",
        "password": "correct_password"
    })
    assert response.status_code == 200
    assert "token" in response.json

def test_login_missing_username(client):
    """Test login with missing username (equivalence class: invalid - incomplete)"""
    response = client.post("/api/login", json={
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.json["message"]

def test_login_missing_password(client):
    """Test login with missing password (equivalence class: invalid - incomplete)"""
    response = client.post("/api/login", json={
        "username": "user_without_password"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.json["message"]

def test_login_nonexistent_user(client):
    """Test login with non-existent username (equivalence class: invalid - incorrect)"""
    response = client.post("/api/login", json={
        "username": "nonexistent_user",
        "password": "some_password"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json["message"]

def test_login_wrong_password(client):
    """Test login with incorrect password (equivalence class: invalid - incorrect)"""
    client.post("/api/register", json={
        "email": "password_test@example.com",
        "username": "password_user",
        "password": "correct_password"
    })
    
    response = client.post("/api/login", json={
        "username": "password_user",
        "password": "wrong_password"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json["message"]

# --- User Endpoint Tests ---

def test_get_user(client):
    """Test getting current user info"""
    response = client.get("/api/user")
    assert response.status_code == 200
    assert "message" in response.json

def test_get_all_users(client):
    """Test getting all users"""
    client.post("/api/register", json={
        "email": "user1@example.com", 
        "username": "testuser1",
        "password": "password123"
    })
    
    client.post("/api/register", json={
        "email": "user2@example.com", 
        "username": "testuser2",
        "password": "password123"
    })
    
    response = client.get("/api/users")
    assert response.status_code == 200
    assert "users" in response.json
    
    usernames = [user["username"] for user in response.json["users"]]
    assert "testuser1" in usernames
    assert "testuser2" in usernames
    
    for user in response.json["users"]:
        assert "password" not in user