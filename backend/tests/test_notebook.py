import mongomock
import pytest
from app import app, init_db

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test_secret_key"
    app.config["MONGO_URI"] = "mongodb://localhost:27017/test_db"
    
    # Patch MongoDB before initializing the database
    with mongomock.patch(servers=("localhost",)):
        # Initialize test database with mock connection
        init_db(app)
        
        with app.test_client() as client:
            yield client

def test_create_notebook(client):
    user_id = "12345"
    response = client.post(f"/api/users/{user_id}/notebooks", json={
        "name": "My Notebook",
        "labels": ["work", "personal"]
    })
    assert response.status_code == 201
    assert response.json["notebook"]["name"] == "My Notebook"

# def test_get_notebooks(client):
#     user_id = "12345"
#     # Create a notebook first
#     client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
#     # Fetch notebooks
#     response = client.get(f"/api/users/{user_id}/notebooks")
#     assert response.status_code == 200
#     assert len(response.json["notebooks"]) == 1
#     assert response.json["notebooks"][0]["name"] == "My Notebook"

# def test_update_notebook(client):
#     user_id = "12345"
#     # Create
#     create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "Old Name"})
#     notebook_id = create_response.json["notebook"]["_id"]
#     # Update
#     update_response = client.put(f"/api/users/{user_id}/notebooks/{notebook_id}", json={"name": "New Name"})
#     assert update_response.status_code == 200
#     assert update_response.json["message"] == "Notebook updated successfully"

# def test_delete_notebook(client):
#     user_id = "12345"
#     # Create
#     create_response = client.post(f"/api/users/{user_id}/notebooks", json={"name": "My Notebook"})
#     notebook_id = create_response.json["notebook"]["_id"]
#     # Delete
#     delete_response = client.delete(f"/api/users/{user_id}/notebooks/{notebook_id}")
#     assert delete_response.status_code == 200
#     assert delete_response.json["message"] == "Notebook and its sections/notes deleted"