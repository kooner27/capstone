# Testing Search functionality directly
# We cant test through endpoints cuz it gives route registration error
# Because we made a seprate search file and registers the routes (modularity in flask)
# So instead we just test through the function directly since the routes should already be registered on setup
import pytest
from pymongo import MongoClient
from app import app, init_db
from search import search_all_content
import datetime

# Use a dedicated test database
TEST_DB_NAME = "note_app_search_test"

@pytest.fixture(scope="function")
def db_collections():
    """Setup database collections for direct testing"""
    # Configure app for testing
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test_secret_key"
    app.config["MONGO_URI"] = f"mongodb://localhost:27017/{TEST_DB_NAME}"
    
    # Clean the database before the test
    mongo_client = MongoClient(app.config["MONGO_URI"])
    mongo_client.drop_database(TEST_DB_NAME)
    
    # Initialize the database
    db = init_db(app)
    
    # Get collections directly
    notebooks = db["notebooks"]
    sections = db["sections"]
    notes = db["notes"]
    
    # Insert test data
    user_id = "12345"
    now = datetime.datetime.utcnow()
    
    # Create notebook with content to search
    notebooks.insert_one({
        "user_id": user_id,
        "name": "Biology Notebook",
        "labels": ["science", "biology"],
        "created_at": now,
        "updated_at": now
    })
    
    # Create note with searchable content
    section_id = "section123"
    notes.insert_one({
        "user_id": user_id,
        "section_id": section_id,
        "title": "DNA Structure",
        "content": "DNA is a double helix structure that contains genetic information.",
        "labels": ["biology", "genetics"],
        "created_at": now,
        "updated_at": now
    })
    
    yield user_id, notebooks, sections, notes
    
    # Clean up
    mongo_client.drop_database(TEST_DB_NAME)
    mongo_client.close()

def test_search_by_text(db_collections):
    """Test search by text query"""
    user_id, notebooks, sections, notes = db_collections
    
    # Test searching for "Biology"
    result = search_all_content(user_id, "Biology", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "Biology" in result["query"]
    assert len(result["results"]["notebooks"]) > 0

def test_search_by_label(db_collections):
    """Test search by label"""
    user_id, notebooks, sections, notes = db_collections
    
    # Test searching by "biology" label
    result = search_all_content(user_id, "", notebooks, sections, notes, labels=["biology"])
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "biology" in result["labels"]

def test_content_preview(db_collections):
    """Test content preview generation"""
    user_id, notebooks, sections, notes = db_collections
    
    # Test search that should generate a content preview
    result = search_all_content(user_id, "DNA", notebooks, sections, notes)
    
    assert result["total_results"] > 0
    assert len(result["results"]["notes"]) > 0
    note = result["results"]["notes"][0]
    assert "content_preview" in note
    assert "DNA" in note["content_preview"]
    assert "..." in note["content_preview"]  # Should contain ellipses for truncation