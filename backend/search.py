from flask import jsonify, request
from bson import ObjectId

'''
The code in this file is for handling FR24 in section 4.7
and the functional requirements in section 4.5 of the SRS which are
FR15, FR16, and FR17
'''

def create_search_indexes(db):
    """Create text indexes for search functionality"""
    db.notebooks.create_index([("name", "text")])
    db.sections.create_index([("title", "text")])
    db.notes.create_index([("title", "text"), ("content", "text")])
    
    # Create regular indexes for user lookups
    db.notebooks.create_index("user_id")
    db.sections.create_index("user_id")
    db.notes.create_index("user_id")
    
    # Create indexes for labels
    db.notebooks.create_index("labels")
    db.sections.create_index("labels")
    db.notes.create_index("labels")
    
    print("Search indexes created successfully")

def search_all_content(user_id, query, notebooks_collection, sections_collection, notes_collection, labels=None):
    """
    Search for query across notebooks, sections and notes
    Optional filtering by labels
    """
    # Validate input require either query or labels
    if not query and not labels:
        return {"message": "Search query or labels must be provided"}, 400
        
    if query and len(query) < 2 and not labels:
        return {"message": "Search query must be at least 2 characters"}, 400
        
    results = {
        "notebooks": [],
        "sections": [],
        "notes": []
    }
    
    # Search notebooks
    notebook_query = {"user_id": user_id}
    notebook_projection = {
        "name": 1,
        "labels": 1,
        "created_at": 1, 
        "updated_at": 1,
        "user_id": 1
    }
    
    # Add text search if query provided
    if query:
        notebook_query["$text"] = {"$search": query}
        notebook_projection["score"] = {"$meta": "textScore"}
        notebook_sort = [("score", {"$meta": "textScore"})]
    else:
        notebook_sort = [("updated_at", -1)]
    
    # Add labels filter if provided
    if labels:
        notebook_query["labels"] = {"$all": labels}
    
    # Execute search
    notebook_cursor = notebooks_collection.find(
        notebook_query,
        notebook_projection
    ).sort(notebook_sort).limit(10)
    
    for notebook in notebook_cursor:
        notebook["_id"] = str(notebook["_id"])
        notebook["type"] = "notebook"
        results["notebooks"].append(notebook)
    
    # Search sections
    section_query = {"user_id": user_id}
    section_projection = {
        "title": 1,
        "labels": 1,
        "notebook_id": 1, 
        "created_at": 1, 
        "updated_at": 1,
        "user_id": 1
    }
    
    # Add text search if query provided
    if query:
        section_query["$text"] = {"$search": query}
        section_projection["score"] = {"$meta": "textScore"}
        section_sort = [("score", {"$meta": "textScore"})]
    else:
        section_sort = [("updated_at", -1)]
    
    # Add labels filter if provided
    if labels:
        section_query["labels"] = {"$all": labels}
    
    # Execute search
    section_cursor = sections_collection.find(
        section_query,
        section_projection
    ).sort(section_sort).limit(10)
    
    for section in section_cursor:
        section["_id"] = str(section["_id"])
        if "notebook_id" in section:
            section["notebook_id"] = str(section["notebook_id"])
        section["type"] = "section"
        results["sections"].append(section)
    
    # Search notes
    note_query = {"user_id": user_id}
    note_projection = {
        "title": 1, 
        "content": 1,
        "labels": 1,
        "section_id": 1, 
        "notebook_id": 1, 
        "created_at": 1, 
        "updated_at": 1,
        "user_id": 1,
    }
    
    # Add text search if query provided
    if query:
        note_query["$text"] = {"$search": query}
        note_projection["score"] = {"$meta": "textScore"}
        note_sort = [("score", {"$meta": "textScore"})]
    else:
        note_sort = [("updated_at", -1)]
    
    # Add labels filter if provided
    if labels:
        note_query["labels"] = {"$all": labels}
    
    # Execute search
    note_cursor = notes_collection.find(
        note_query,
        note_projection
    ).sort(note_sort).limit(20)
    
    for note in note_cursor:
        note["_id"] = str(note["_id"])
        if "notebook_id" in note:
            note["notebook_id"] = str(note["notebook_id"])
        if "section_id" in note:
            note["section_id"] = str(note["section_id"])
        note["type"] = "note"
        
        # Create a content preview
        if "content" in note and note["content"]:
            content = note["content"]
            
            # If there's a query, try to highlight the matching parts
            if query:
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
            else:
                # If no query (label-only search), just take first 100 chars
                preview = content[:100] + "..." if len(content) > 100 else content
                
            note["content_preview"] = preview
            del note["content"]  # Remove full content
            
        results["notes"].append(note)
    
    # Get total results count
    total_results = len(results["notebooks"]) + len(results["sections"]) + len(results["notes"])
    
    # Build response with metadata
    response = {
        "total_results": total_results,
        "results": results
    }
    
    # Include query in response if provided
    if query:
        response["query"] = query
        
    # Include labels in response if provided
    if labels:
        response["labels"] = labels
    
    return response

# Register the endpoint
def register_search_endpoint(app, notebooks_collection, sections_collection, notes_collection):
    """Register the search endpoint with the Flask app"""
    
    @app.route("/api/users/<user_id>/search", methods=["GET"])
    def search(user_id):
        # Get query parameters
        query = request.args.get("q", "")
        labels_param = request.args.get("labels", "")
        
        # Process labels if provided
        labels = labels_param.split(",") if labels_param and labels_param.strip() else []
        # Filter out empty labels
        labels = [label.strip() for label in labels if label.strip()]
        
        result = search_all_content(
            user_id, 
            query, 
            notebooks_collection, 
            sections_collection, 
            notes_collection,
            labels
        )
        
        # Check if there was an error
        if isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], int):
            return jsonify(result[0]), result[1]
            
        return jsonify(result), 200