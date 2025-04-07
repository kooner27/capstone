# Testing Label endpoints with real MongoDB and equivalence class testing
import pytest
import os
from pymongo import MongoClient
from app import app, init_db

# Use a dedicated test database
TEST_DB_NAME = "note_app_labels_test"

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

# --- NOTEBOOK LABEL TESTS ---

def test_update_notebook_labels_valid(client):
    """Test: update notebook with valid labels"""
    user_id = "label_user"
    
    # Create a notebook first
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Label Test",
        "labels": ["original"]
    })
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Update labels
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/labels",
        json={"labels": ["updated", "important"]}
    )
    
    assert update_response.status_code == 200
    assert "updated successfully" in update_response.json["message"].lower()
    
    # Verify labels were updated
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    notebook = next(nb for nb in get_response.json["notebooks"] if nb["_id"] == notebook_id)
    assert set(notebook["labels"]) == {"updated", "important"}

def test_update_notebook_labels_missing_field(client):
    """Test: update notebook with missing labels field"""
    user_id = "label_user"
    
    # Create a notebook first
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Missing Labels Test"})
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Try to update without labels field
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/labels",
        json={"name": "This will fail"}  # No labels field
    )
    
    assert update_response.status_code == 400
    assert "required" in update_response.json["message"].lower()

def test_update_notebook_labels_nonexistent_notebook(client):
    """Test: update labels for non-existent notebook"""
    user_id = "label_user"
    nonexistent_id = "60a5e8a7b53c143abc456789"  # Valid ObjectId format but doesn't exist
    
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{nonexistent_id}/labels",
        json={"labels": ["will", "fail"]}
    )
    
    assert update_response.status_code == 404
    assert "not found" in update_response.json["message"].lower()

def test_update_notebook_labels_empty_array(client):
    """Test: update notebook with empty labels array"""
    user_id = "label_user"
    
    # Create a notebook first with labels
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Empty Labels Test",
        "labels": ["to", "be", "removed"]
    })
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Update with empty labels array
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/labels",
        json={"labels": []}
    )
    
    assert update_response.status_code == 200
    
    # Verify labels were emptied
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    notebook = next(nb for nb in get_response.json["notebooks"] if nb["_id"] == notebook_id)
    assert notebook["labels"] == []

# --- SECTION LABEL TESTS ---

def test_update_section_labels_valid(client):
    """Test: update section with valid labels"""
    user_id = "section_label_user"
    
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
    section = next(sec for sec in get_response.json["sections"] if sec["_id"] == section_id)
    assert set(section["labels"]) == {"final", "reviewed"}

def test_update_section_labels_missing_field(client):
    """Test: update section with missing labels field"""
    user_id = "section_label_user"
    
    # Create notebook and section
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Try to update without labels field
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/labels",
        json={"title": "This will fail"}  # No labels field
    )
    
    assert update_response.status_code == 400
    assert "required" in update_response.json["message"].lower()

def test_update_section_labels_nonexistent_section(client):
    """Test: update labels for non-existent section"""
    user_id = "section_label_user"
    
    # Create notebook
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    nonexistent_id = "60a5e8a7b53c143abc456789"  # Valid ObjectId format but doesn't exist
    
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{nonexistent_id}/labels",
        json={"labels": ["will", "fail"]}
    )
    
    assert update_response.status_code == 404
    assert "not found" in update_response.json["message"].lower()

def test_update_section_labels_empty_array(client):
    """Test: update section with empty labels array"""
    user_id = "section_label_user"
    
    # Create notebook and section with labels
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections",
        json={"title": "Section with Labels", "labels": ["to", "be", "removed"]}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Update with empty labels array
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/labels",
        json={"labels": []}
    )
    
    assert update_response.status_code == 200
    
    # Verify labels were emptied
    get_response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    section = next(sec for sec in get_response.json["sections"] if sec["_id"] == section_id)
    assert section["labels"] == []

# --- NOTE LABEL TESTS ---

def test_update_note_labels_valid(client):
    """Test: update note with valid labels"""
    user_id = "note_label_user"
    
    # Create notebook, section, and note
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
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

def test_update_note_labels_missing_field(client):
    """Test: update note with missing labels field"""
    user_id = "note_label_user"
    
    # Create notebook, section, and note
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    note_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Test Note", "content": "Content"}
    )
    note_id = note_response.json["note"]["_id"]
    
    # Try to update without labels field
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}/labels",
        json={"title": "This will fail"}  # No labels field
    )
    
    assert update_response.status_code == 400
    assert "required" in update_response.json["message"].lower()

def test_update_note_labels_nonexistent_note(client):
    """Test: update labels for non-existent note"""
    user_id = "note_label_user"
    
    # Create notebook and section
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    nonexistent_id = "60a5e8a7b53c143abc456789"  # Valid ObjectId format but doesn't exist
    
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{nonexistent_id}/labels",
        json={"labels": ["will", "fail"]}
    )
    
    assert update_response.status_code == 404
    assert "not found" in update_response.json["message"].lower()

def test_update_note_labels_empty_array(client):
    """Test: update note with empty labels array"""
    user_id = "note_label_user"
    
    # Create notebook, section, and note with labels
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    note_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={
            "title": "Note with Labels", 
            "content": "Content",
            "labels": ["to", "be", "removed"]
        }
    )
    note_id = note_response.json["note"]["_id"]
    
    # Update with empty labels array
    update_response = client.patch(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}/labels",
        json={"labels": []}
    )
    
    assert update_response.status_code == 200
    
    # Verify labels were emptied
    get_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )
    assert get_response.json["note"]["labels"] == []

# --- ALL USER LABELS TEST ---

def test_get_all_user_labels(client):
    """Test: retrieve all labels for a user"""
    user_id = "all_labels_user"
    
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

def test_get_all_user_labels_no_labels(client):
    """Test: retrieve labels for user with no labels"""
    user_id = "no_labels_user"
    
    # Create objects without labels
    client.post(f"/api/users/{user_id}/notebooks", json={"name": "Notebook"})
    
    # Get all labels
    response = client.get(f"/api/users/{user_id}/labels")
    assert response.status_code == 200
    
    # Should be empty array
    assert response.json["labels"] == []

def test_get_all_user_labels_nonexistent_user(client):
    """Test: retrieve labels for non-existent user"""
    user_id = "nonexistent_user"
    
    # Get all labels for user that doesn't exist
    response = client.get(f"/api/users/{user_id}/labels")
    assert response.status_code == 200
    
    # Should be empty array
    assert response.json["labels"] == []