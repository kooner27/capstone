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

### NOTEBOOK TESTS

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
    client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
    response = client.get(f"/api/users/{user_id}/notebooks")
    assert response.status_code == 200
    assert len(response.json["notebooks"]) == 1
    assert response.json["notebooks"][0]["name"] == "My Notebook"

def test_update_notebook(client):
    user_id = "12345"
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Old Name"})
    notebook_id = create_response.json["notebook"]["_id"]
    update_response = client.put(f"/api/users/{user_id}/notebooks/{notebook_id}", json={"name": "New Name"})
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Notebook updated successfully"

def test_delete_notebook(client):
    user_id = "12345"
    create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
    notebook_id = create_response.json["notebook"]["_id"]
    delete_response = client.delete(f"/api/users/{user_id}/notebooks/{notebook_id}")
    assert delete_response.status_code == 200
    assert delete_response.json["message"] == "Notebook and its sections/notes deleted"


### SECTION TESTS
def test_create_section(client):
    """Test creating a section in a notebook"""
    user_id = "12345"
    
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    section_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "My Section", "labels": ["important"]}
    )
    
    assert section_response.status_code == 201
    assert section_response.json["section"]["title"] == "My Section"
    assert "important" in section_response.json["section"]["labels"]

def test_get_sections(client):
    """Test retrieving sections from a notebook"""
    user_id = "12345"
    
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections", 
        json={"title": "Test Section"}
    )
    
    response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    assert response.status_code == 200
    assert len(response.json["sections"]) == 1
    assert response.json["sections"][0]["title"] == "Test Section"

def test_update_section(client):
    """Test updating a section"""
    user_id = "12345"
    
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    create_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections",
        json={"title": "Old Title"}
    )
    section_id = create_response.json["section"]["_id"]
    
    update_response = client.put(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}",
        json={"title": "New Title"}
    )
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Section updated successfully"
    
    get_response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    assert get_response.json["sections"][0]["title"] == "New Title"

def test_delete_section(client):
    """Test deleting a section"""
    user_id = "12345"
    
    nb_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Test Notebook"})
    notebook_id = nb_response.json["notebook"]["_id"]
    
    create_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections",
        json={"title": "Section to Delete"}
    )
    section_id = create_response.json["section"]["_id"]
    
    delete_response = client.delete(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}"
    )
    assert delete_response.status_code == 200
    assert delete_response.json["message"] == "Section and its notes deleted"
    
    get_response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections")
    assert len(get_response.json["sections"]) == 0

### note TESTS
def test_create_note(client):
    """Test creating a note in a section"""
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
            "title": "My Test Note",
            "content": "This is test content",
            "labels": ["important", "test"]
        }
    )
    
    assert note_response.status_code == 201
    assert note_response.json["note"]["title"] == "My Test Note"
    assert note_response.json["note"]["content"] == "This is test content"
    assert "important" in note_response.json["note"]["labels"]
    assert "test" in note_response.json["note"]["labels"]

def test_get_notes(client):
    """Test retrieving notes from a section"""
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
    
    # Create notes
    client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Note 1", "content": "Content 1"}
    )
    client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Note 2", "content": "Content 2"}
    )
    
    # Get all notes
    response = client.get(f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes")
    assert response.status_code == 200
    assert len(response.json["notes"]) == 2
    assert response.json["notes"][0]["title"] in ["Note 1", "Note 2"]
    assert response.json["notes"][1]["title"] in ["Note 1", "Note 2"]

def test_get_single_note(client):
    """Test retrieving a single note by ID"""
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
    create_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Specific Note", "content": "Specific Content"}
    )
    note_id = create_response.json["note"]["_id"]
    
    get_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )

    # Verify
    
    assert get_response.status_code == 200
    assert get_response.json["note"]["title"] == "Specific Note"
    assert get_response.json["note"]["content"] == "Specific Content"

def test_update_note(client):
    """Test updating a note"""
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
    create_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Old Title", "content": "Old Content"}
    )
    note_id = create_response.json["note"]["_id"]
    
    # Update note
    update_response = client.put(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}",
        json={"title": "New Title", "content": "New Content"}
    )
    
    assert update_response.status_code == 200
    assert update_response.json["message"] == "Note updated successfully"
    
    # Verify changes
    get_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )
    assert get_response.json["note"]["title"] == "New Title"
    assert get_response.json["note"]["content"] == "New Content"

def test_delete_note(client):
    """Test deleting a note"""
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
    create_response = client.post(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes",
        json={"title": "Note to Delete", "content": "Will be deleted"}
    )
    note_id = create_response.json["note"]["_id"]
    
    # Delete note
    delete_response = client.delete(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes/{note_id}"
    )
    
    assert delete_response.status_code == 200
    assert delete_response.json["message"] == "Note deleted successfully"
    
    get_response = client.get(
        f"/api/users/{user_id}/notebooks/{notebook_id}/sections/{section_id}/notes"
    )
    assert len(get_response.json["notes"]) == 0