import pytest
import os
from pymongo import MongoClient
from app import app, init_db

# Use a dedicated test database
TEST_DB_NAME = "note_app_notebook_comprehensive_test"

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

# --- GET /api/users/{user_id}/notebooks Tests ---

def test_get_notebooks_valid_user(client):
    """Test getting notebooks for a valid user (equivalence class: valid user_id)"""
    user_id = "valid_user"
    
    client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    
    response = client.get(f"/api/users/{user_id}/notebooks")
    assert response.status_code == 200
    assert len(response.json["notebooks"]) == 1
    assert response.json["notebooks"][0]["name"] == "Test Notebook"

def test_get_notebooks_empty(client):
    """Test getting notebooks for user with no notebooks (equivalence class: valid user_id, no notebooks)"""
    user_id = "empty_user"
    
    response = client.get(f"/api/users/{user_id}/notebooks")
    assert response.status_code == 200
    assert len(response.json["notebooks"]) == 0

def test_get_notebooks_nonexistent_user(client):
    """Test getting notebooks for non-existent user (equivalence class: invalid user_id)"""
    user_id = "nonexistent_user"
    
    response = client.get(f"/api/users/{user_id}/notebooks")
    assert response.status_code == 200
    assert len(response.json["notebooks"]) == 0

# --- POST /api/users/{user_id}/notebooks Tests ---

def test_create_notebook_complete_data(client):
    """Test creating notebook with complete data (equivalence class: complete data)"""
    user_id = "create_user"
    
    response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Complete Notebook",
        "labels": ["important", "work"]
    })
    
    assert response.status_code == 201
    assert response.json["notebook"]["name"] == "Complete Notebook"
    assert "important" in response.json["notebook"]["labels"]
    assert "work" in response.json["notebook"]["labels"]
    assert "_id" in response.json["notebook"]

def test_create_notebook_partial_data(client):
    """Test creating notebook with only name (equivalence class: partial data)"""
    user_id = "create_user"
    
    response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Partial Notebook"
    })
    
    assert response.status_code == 201
    assert response.json["notebook"]["name"] == "Partial Notebook"
    assert response.json["notebook"]["labels"] == []
    assert "_id" in response.json["notebook"]

def test_create_notebook_no_data(client):
    """Test creating notebook with no data (equivalence class: minimal data)"""
    user_id = "create_user"
    
    response = client.post(f"/api/users/{user_id}/notebooks", json={})
    
    assert response.status_code == 201
    assert response.json["notebook"]["name"] == "Untitled Notebook"
    assert response.json["notebook"]["labels"] == []
    assert "_id" in response.json["notebook"]

def test_create_notebook_invalid_data(client):
    """Test creating notebook with invalid data format (equivalence class: invalid data)"""
    user_id = "create_user"
    
    # Send string instead of JSON
    response = client.post(f"/api/users/{user_id}/notebooks", 
                          data="invalid data",
                          content_type="application/text")
    
    assert response.status_code in [400, 415]  # Bad or unsupported

# --- PUT /api/users/{user_id}/notebooks/{notebook_id} Tests ---

def test_update_notebook_complete_data(client):
    """Test updating notebook with complete data (equivalence class: valid id + complete data)"""
    user_id = "update_user"
    
    # Create a notebook first
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Original Name"})
    notebook_id = create_response.json["notebook"]["_id"]
    
    update_response = client.put(f"/api/users/{user_id}/notebooks/{notebook_id}", json={
        "name": "Updated Name",
        "labels": ["updated", "important"]
    })
    
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Notebook updated successfully"
    
    # Verify the update
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    notebook = next(nb for nb in get_response.json["notebooks"] if nb["_id"] == notebook_id)
    assert notebook["name"] == "Updated Name"
    assert "updated" in notebook["labels"]
    assert "important" in notebook["labels"]

def test_update_notebook_partial_data(client):
    """Test updating notebook with partial data (equivalence class: valid id + partial data)"""
    user_id = "update_user"
    
    # Create a notebook first with labels
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "Original Name",
        "labels": ["original"]
    })
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Update only the name
    update_response = client.put(f"/api/users/{user_id}/notebooks/{notebook_id}", json={
        "name": "Updated Name Only"
    })
    
    assert update_response.status_code == 200
    
    # Verify only name was updated, labels preserved
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    notebook = next(nb for nb in get_response.json["notebooks"] if nb["_id"] == notebook_id)
    assert notebook["name"] == "Updated Name Only"
    assert "original" in notebook["labels"]  # Original label should still be there

def test_update_nonexistent_notebook(client):
    """Test updating non-existent notebook (equivalence class: non-existent id)"""
    user_id = "update_user"
    nonexistent_id = "60a5e8a7b53c143abc456789"  # Valid ObjectId format but doesn't exist
    
    update_response = client.put(f"/api/users/{user_id}/notebooks/{nonexistent_id}", json={
        "name": "This Will Fail"
    })
    
    assert update_response.status_code == 404
    assert "not found" in update_response.json["message"].lower()

# --- DELETE /api/users/{user_id}/notebooks/{notebook_id} Tests ---

def test_delete_existing_notebook(client):
    """Test deleting an existing notebook (equivalence class: valid notebook_id)"""
    user_id = "delete_user"
    
    # Create a notebook first
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "To Be Deleted"})
    notebook_id = create_response.json["notebook"]["_id"]
    
    # Delete it
    delete_response = client.delete(f"/api/users/{user_id}/notebooks/{notebook_id}")
    
    assert delete_response.status_code == 200
    assert "deleted" in delete_response.json["message"].lower()
    
    # Verify it's gone
    get_response = client.get(f"/api/users/{user_id}/notebooks")
    assert len(get_response.json["notebooks"]) == 0

def test_delete_nonexistent_notebook(client):
    """Test deleting a non-existent notebook (equivalence class: non-existent notebook_id)"""
    user_id = "delete_user"
    nonexistent_id = "60a5e8a7b53c143abc456789"  # Valid ObjectId format but doesn't exist
    
    delete_response = client.delete(f"/api/users/{user_id}/notebooks/{nonexistent_id}")
    
    assert delete_response.status_code == 404
    assert "not found" in delete_response.json["message"].lower()

# --- Cascading Delete Test ---

def test_notebook_delete_cascades_to_sections_and_notes(client):
    """Test that deleting a notebook also deletes its sections and notes"""
    user_id = "cascade_user"
    
    # Create a notebook
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Cascade Test"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    # Create a section in the notebook
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Cascade Section"}
    )
    section_id = section_response.json["section"]["_id"]
    
    # Create a note in the section
    note_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Cascade Note", "content": "This should be deleted"}
    )
    note_id = note_response.json["note"]["_id"]
    
    # Delete the notebook
    delete_response = client.delete(f"/api/users/{user_id}/notebooks/{notebook_id}")
    assert delete_response.status_code == 200
    
    # Verify notebook is gone
    get_nb_response = client.get(f"/api/users/{user_id}/notebooks")
    assert len(get_nb_response.json["notebooks"]) == 0
    
    # Verify sections are gone
    get_section_response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    assert len(get_section_response.json["sections"]) == 0
    
    # Verify note is gone (should return 404 or empty)
    get_note_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )
    assert get_note_response.status_code == 404 or len(get_note_response.json.get("notes", [])) == 0