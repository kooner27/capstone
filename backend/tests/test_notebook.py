# Testing Notebook endpoints with real MongoDB
import pytest
import os
from pymongo import MongoClient
from app import app, init_db

# Use a dedicated test database
TEST_DB_NAME = "note_app_notebook_test"  # Different name to avoid conflicts with auth tests

@pytest.fixture(scope="function")
def client():
    """Test client using a real test database"""
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

def test_create_notebook(client):
    user_id = "12345"
    response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "My Notebook",
        "labels": ["work", "personal"]
    })
    assert response.status_code == 201
    assert response.json["notebook"]["name"] == "My Notebook"

def test_get_notebooks(client):
    user_id = "12345"
    # Create a notebook first
    client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
    # Fetch notebooks
    response = client.get(f"/api/users/{user_id}/notebooks")
    assert response.status_code == 200
    assert len(response.json["notebooks"]) == 1
    assert response.json["notebooks"][0]["name"] == "My Notebook"

def test_update_notebook(client):
    user_id = "12345"
    # Create
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Old Name"})
    notebook_id = create_response.json["notebook"]["_id"]
    # Update
    update_response = client.put(f"/api/users/{user_id}/notebooks/{notebook_id}", json={"name": "New Name"})
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Notebook updated successfully"

def test_delete_notebook(client):
    user_id = "12345"
    # Create
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
    notebook_id = create_response.json["notebook"]["_id"]
    # Delete
    delete_response = client.delete(f"/api/users/{user_id}/notebooks/{notebook_id}")
    assert delete_response.status_code == 200
    assert delete_response.json["message"] == "Notebook and its sections/notes deleted"