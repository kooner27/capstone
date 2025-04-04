# Testing Label endpoints with real MongoDB
import pytest
import os
from pymongo import MongoClient
from app import app, init_db

# Use a dedicated test database
TEST_DB_NAME = "note_app_labels_test" # Again I'm gonna use a different name to avoid conflicts with other tests

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
    
    # Clean up after the test
    mongo_client.drop_database(TEST_DB_NAME)
    mongo_client.close()

def test_update_notebook_labels(client):
    """Test updating notebook labels"""
    user_id = "12345"
    
    # Create notebook
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Notebook with Labels",
        "labels": ["initial"]
    })
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Update labels
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/labels",
        json={"labels": ["updated", "important"]}
    )
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Labels updated successfully"
    
    # Verify labels were updated
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    notebook = next(nb for nb in get_response.json["notebooks"] if nb["_id"] == notebook_id)
    assert set(notebook["labels"]) == {"updated", "important"}

def test_update_section_labels(client):
    """Test updating section labels"""
    user_id = "12345"
    
    # Create notebook
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    # Create section
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections",
        json={"title": "Section with Labels", "labels": ["draft"]}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Update labels
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/labels",
        json={"labels": ["final", "reviewed"]}
    )
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Labels updated successfully"
    
    # Verify labels were updated
    get_response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    section = get_response.json["sections"][0]
    assert set(section["labels"]) == {"final", "reviewed"}

def test_update_note_labels(client):
    """Test updating note labels"""
    user_id = "12345"
    
    # Create notebook
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    # Create section
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Create note
    note_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={
            "title": "Note with Labels", 
            "content": "Content",
            "labels": ["todo"]
        }
    )
    note_id = note_response.json["note"]["_id"]
    
    # Update labels
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}/labels",
        json={"labels": ["done", "important"]}
    )
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Labels updated successfully"
    
    # Verify labels were updated
    get_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )
    assert set(get_response.json["note"]["labels"]) == {"done", "important"}

def test_get_all_user_labels(client):
    """Test retrieving all labels for a user"""
    user_id = "12345"
    
    # Create notebook with labels
    client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Notebook", 
        "labels": ["notebook-label", "shared"]
    })
    
    # Create section with labels
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Another Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Section", "labels": ["section-label", "shared"]}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Create note with labels
    client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={
            "title": "Note", 
            "content": "Content",
            "labels": ["note-label", "shared"]
        }
    )
    
    # Get all labels
    response = client.get(f"/api/users/{user_id}/labels")
    assert response.status_code == 200
    
    # Verify all labels
    labels = response.json["labels"]
    assert "notebook-label" in labels
    assert "section-label" in labels
    assert "note-label" in labels
    assert "shared" in labels

def test_update_label_missing_data(client):
    """Test error handling when labels field is missing"""
    user_id = "12345"
    
    # Create notebook
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Try updating without labels field
    response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/labels",
        json={"name": "Something else"}  # Error we did not give labels filed
    )
    
    # Verify response shows Error
    assert response.status_code == 400
    assert response.json["message"] == "Labels field is required"