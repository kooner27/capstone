from flask import jsonify, request
from bson import ObjectId

def create_search_indexes(db):
    """Create text indexes for search functionality"""
    db.notebooks.create_index([("name", "text")])
    db.sections.create_index([("title", "text")])
    db.notes.create_index([("title", "text"), ("content", "text")])
    
    # Create regular indexes for user lookups
    db.notebooks.create_index("user_id")
    db.sections.create_index("user_id")
    db.notes.create_index("user_id")
    
    print("Search indexes created successfully")

def search_all_content(user_id, query, notebooks_collection, sections_collection, notes_collection):
    """Search for query across notebooks, sections and notes"""
    if not query or len(query) < 2:
        return {"message": "Search query must be at least 2 characters"}, 400
        
    results = {
        "notebooks": [],
        "sections": [],
        "notes": []
    }
    
    # Search notebooks using text index
    notebook_cursor = notebooks_collection.find(
        {
            "$text": {"$search": query},
            "user_id": user_id
        },
        {
            "score": {"$meta": "textScore"},
            "name": 1, 
            "created_at": 1, 
            "updated_at": 1
        }
    ).sort([("score", {"$meta": "textScore"})]).limit(10)
    
    for notebook in notebook_cursor:
        notebook["_id"] = str(notebook["_id"])
        notebook["type"] = "notebook"
        results["notebooks"].append(notebook)
    
    # Search sections using text index
    section_cursor = sections_collection.find(
        {
            "$text": {"$search": query},
            "user_id": user_id
        },
        {
            "score": {"$meta": "textScore"},
            "title": 1, 
            "notebook_id": 1, 
            "created_at": 1, 
            "updated_at": 1
        }
    ).sort([("score", {"$meta": "textScore"})]).limit(10)
    
    for section in section_cursor:
        section["_id"] = str(section["_id"])
        section["type"] = "section"
        results["sections"].append(section)
    
    # Search notes using text index
    note_cursor = notes_collection.find(
        {
            "$text": {"$search": query},
            "user_id": user_id
        },
        {
            "score": {"$meta": "textScore"},
            "title": 1, 
            "content": 1,
            "section_id": 1, 
            "notebook_id": 1, 
            "created_at": 1, 
            "updated_at": 1
        }
    ).sort([("score", {"$meta": "textScore"})]).limit(20)
    
    for note in note_cursor:
        note["_id"] = str(note["_id"])
        note["type"] = "note"
        
        # Create a content preview
        if "content" in note and note["content"]:
            # Try to get context around the search term
            content = note["content"]
            query_pos = content.lower().find(query.lower())
            
            if query_pos >= 0:
                start = max(0, query_pos - 50)
                end = min(len(content), query_pos + len(query) + 50)
                if start > 0:
                    preview = "..." + content[start:end] + "..."
                else:
                    preview = content[start:end] + "..."
            else:
                # If query not found in content (might be in title only)
                preview = content[:100] + "..." if len(content) > 100 else content
                
            note["content_preview"] = preview
            del note["content"]  # Remove full content
            
        results["notes"].append(note)
    
    # Get total results count
    total_results = len(results["notebooks"]) + len(results["sections"]) + len(results["notes"])
    
    return {
        "query": query,
        "total_results": total_results,
        "results": results
    }

# Add this new function to register the search endpoint
def register_search_endpoint(app, notebooks_collection, sections_collection, notes_collection):
    """Register the search endpoint with the Flask app"""
    
    @app.route("/api/users/<user_id>/search", methods=["GET"])
    def search(user_id):
        query = request.args.get("q", "")
        
        result = search_all_content(
            user_id, 
            query, 
            notebooks_collection, 
            sections_collection, 
            notes_collection
        )
        
        # Check if there was an error
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], int):
            return jsonify(result[0]), result[1]
            
        return jsonify(result), 200