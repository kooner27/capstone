# Comprehensive testing of Search functionality with equivalence classes
import pytest
from pymongo import MongoClient
from bson import ObjectId
from app import app, init_db
from search import search_all_content
import datetime

# Use a dedicated test database
TEST_DB_NAME = "note_app_search_comprehensive_test"

@pytest.fixture(scope="function")
def db_collections():
    """Setup database collections with comprehensive test data"""
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
    user_id = "search_test_user"
    now = datetime.datetime.utcnow()
    
    # Create notebooks with varied content
    notebooks.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "name": "Biology Fundamentals",
        "labels": ["science", "biology", "course"],
        "created_at": now,
        "updated_at": now
    })
    
    notebooks.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "name": "Computer Science Notes",
        "labels": ["tech", "programming", "course"],
        "created_at": now,
        "updated_at": now
    })
    
    # Create sections
    bio_section_id = ObjectId()
    sections.insert_one({
        "_id": bio_section_id,
        "user_id": user_id,
        "notebook_id": "notebook1",
        "title": "Cell Biology",
        "labels": ["cells", "biology"],
        "created_at": now,
        "updated_at": now
    })
    
    cs_section_id = ObjectId()
    sections.insert_one({
        "_id": cs_section_id,
        "user_id": user_id,
        "notebook_id": "notebook2",
        "title": "Algorithms",
        "labels": ["sorting", "programming"],
        "created_at": now,
        "updated_at": now
    })
    
    # Create notes
    notes.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "notebook_id": "notebook1",
        "section_id": str(bio_section_id),
        "title": "DNA Structure",
        "content": "DNA is a double helix structure that contains genetic information.",
        "labels": ["biology", "genetics"],
        "created_at": now,
        "updated_at": now
    })
    
    notes.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "notebook_id": "notebook2",
        "section_id": str(cs_section_id),
        "title": "Sorting Algorithms",
        "content": "Quick sort has O(n log n) average time complexity.",
        "labels": ["algorithms", "programming"],
        "created_at": now,
        "updated_at": now
    })
    
    # Note with special characters
    notes.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "notebook_id": "notebook1",
        "section_id": str(bio_section_id),
        "title": "E=mc²: Einstein's Equation",
        "content": "The equation E=mc² shows the equivalence of energy and matter.",
        "labels": ["physics", "equations"],
        "created_at": now,
        "updated_at": now
    })
    
    # Create content for a different user
    other_user_id = "other_user"
    notebooks.insert_one({
        "_id": ObjectId(),
        "user_id": other_user_id,
        "name": "Private Notebook",
        "labels": ["personal"],
        "created_at": now,
        "updated_at": now
    })
    
    # Create empty user
    empty_user_id = "empty_user"
    
    yield user_id, other_user_id, empty_user_id, notebooks, sections, notes
    
    # Clean up
    mongo_client.drop_database(TEST_DB_NAME)
    mongo_client.close()

# --- TEST CASES ---

def test_search_by_text_valid(db_collections):
    """Test ID: S-01 - Search by valid text query"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Test searching for "Biology"
    result = search_all_content(user_id, "Biology", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "Biology" in result["query"]
    assert len(result["results"]["notebooks"]) > 0

def test_search_by_label(db_collections):
    """Test ID: S-02 - Search by label only"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Test searching by "biology" label
    result = search_all_content(user_id, "", notebooks, sections, notes, labels=["biology"])
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "biology" in result["labels"]
    # Results should only include items with the "biology" label
    for notebook in result["results"]["notebooks"]:
        assert "biology" in notebook["labels"]

def test_search_combined_text_and_labels(db_collections):
    """Test ID: S-03 - Search with combined text and labels"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search for "sort" with "programming" label
    result = search_all_content(user_id, "sort", notebooks, sections, notes, labels=["programming"])
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "sort" in result["query"]
    assert "programming" in result["labels"]
    
    # Check that results match both criteria
    if len(result["results"]["notes"]) > 0:
        note = result["results"]["notes"][0]
        assert "sort" in note["title"].lower() or "sort" in note.get("content_preview", "").lower()
        assert "programming" in note["labels"]

def test_search_too_short_query(db_collections):
    """Test ID: S-04 - Search with too short query"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Too short
    result = search_all_content(user_id, "a", notebooks, sections, notes)
    
    # Should be an error response
    assert isinstance(result, tuple)
    assert result[1] == 400  # Status code
    assert "at least 2 characters" in result[0]["message"]

def test_search_missing_parameters(db_collections):
    """Test ID: S-05 - Search with no query or labels"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # No query and no labels
    result = search_all_content(user_id, "", notebooks, sections, notes)
    
    # Should be an error response
    assert isinstance(result, tuple)
    assert result[1] == 400  # Status code
    assert "query or labels must be provided" in result[0]["message"]

def test_search_no_results(db_collections):
    """Test ID: S-06 - Search with no matching results"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search for non-existent term
    result = search_all_content(user_id, "xyznonexistent", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] == 0
    assert result["results"]["notebooks"] == []
    assert result["results"]["sections"] == []
    assert result["results"]["notes"] == []

def test_content_preview(db_collections):
    """Test ID: S-07 - Test content preview generation"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search for DNA to get content preview
    result = search_all_content(user_id, "DNA", notebooks, sections, notes)
    
    assert result["total_results"] > 0
    assert len(result["results"]["notes"]) > 0
    note = result["results"]["notes"][0]
    assert "content_preview" in note
    assert "DNA" in note["content_preview"]
    assert "..." in note["content_preview"]  # Should contain ellipses for truncation
    assert "content" not in note  # Full content should be removed

def test_search_special_characters(db_collections):
    """Test ID: S-08 - Search with special characters"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search for equation with special characters
    result = search_all_content(user_id, "E=mc²", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] > 0
    assert "E=mc²" in result["query"]
    
    # Verify result contains the equation
    found = False
    for note in result["results"]["notes"]:
        if "Einstein" in note["title"]:
            found = True
            break
    assert found

def test_search_across_content_types(db_collections):
    """Test ID: S-09 - Search across content types"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search for "biology" in everything
    result = search_all_content(user_id, "biology", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] > 0
    
    # Count how many different result types we have
    result_types = 0
    if len(result["results"]["notebooks"]) > 0:
        result_types += 1
    if len(result["results"]["sections"]) > 0:
        result_types += 1
    if len(result["results"]["notes"]) > 0:
        result_types += 1
    
    # Should have results in at least 2 different content types
    assert result_types >= 2

def test_search_empty_user(db_collections):
    """Test ID: S-10 - Search for user with no content"""
    _, _, empty_user_id, notebooks, sections, notes = db_collections
    
    # Search for user with no content
    result = search_all_content(empty_user_id, "biology", notebooks, sections, notes)
    
    assert "total_results" in result
    assert result["total_results"] == 0
    assert result["results"]["notebooks"] == []
    assert result["results"]["sections"] == []
    assert result["results"]["notes"] == []

def test_search_multiple_labels(db_collections):
    """Test ID: S-11 - Search with multiple labels"""
    user_id, _, _, notebooks, sections, notes = db_collections
    
    # Search with multiple labels (course + science)
    result = search_all_content(user_id, "", notebooks, sections, notes, labels=["course", "science"])
    
    assert "total_results" in result
    assert "course" in result["labels"]
    assert "science" in result["labels"]
    
    # Results should match all labels
    for notebook in result["results"]["notebooks"]:
        assert all(label in notebook["labels"] for label in ["course", "science"])