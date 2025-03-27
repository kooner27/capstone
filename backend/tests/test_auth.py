# Testing Auth endpoints with real MongoDB
# With mongomock it was really slow and We could not test the search endpoints
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

def test_register(client):
    response = client.post("/api/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 201
    assert response.json["message"] == "User registered successfully"

def test_login(client):
    # First register a user
    client.post("/api/register", json={
        "email": "test2@example.com",
        "username": "testuser2",
        "password": "password1234"
    })
    
    # Then try logging in
    response = client.post("/api/login", json={
        "username": "testuser2",
        "password": "password1234"
    })
    assert response.status_code == 200
    assert "token" in response.json