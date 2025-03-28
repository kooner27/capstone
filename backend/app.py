import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import jwt
import datetime
from functools import wraps
from bson import ObjectId 
from search import create_search_indexes, register_search_endpoint  # Import functions from search.py

'''
The endpoints are organized and prefixed with comments mandating the inclusion of the code block
by references functional requirements in our SRS.
'''



# Load environment variables from .env file
load_dotenv()

# Initialize flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Flask configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_secret_key")
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/note_app")

# Global database variables
db = None
users_collection = None
notebooks_collection = None
sections_collection = None
notes_collection = None

# Init db function to make testing easier
def init_db(app):
    global db, users_collection, notebooks_collection, sections_collection, notes_collection
    
    # Get URI from app config
    mongo_uri = app.config["MONGO_URI"]
    client = MongoClient(mongo_uri)
    
    # Extract database name from URI
    db_name = mongo_uri.split("/")[-1]
    db = client[db_name]
    
    # Define collections
    users_collection = db["users"]
    notebooks_collection = db["notebooks"]
    sections_collection = db["sections"]
    notes_collection = db["notes"]
    
 
    create_search_indexes(db)
    
    return db

# Initialization calls are done at the end of the file

# ------------------------------------------------------------------------------
# API Status Endpoint
# ------------------------------------------------------------------------------
@app.route("/api/", methods=["GET"])
def api_status():
    return jsonify({"message": "API is running!"})

# ------------------------------------------------------------------------------
# User Registration & Login Endpoints
'''
These endpoints handle the backend logic for the following functional requirements:
FR1, FR2, FR3, FR4, and FR5 located in sections 4.1 and 4.2 of the SRS.
'''
# ------------------------------------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    if not email or not username or not password:
        return jsonify({"message": "Missing required fields"}), 400
    if users_collection.find_one({"$or": [{"email": email}, {"username": username}]}):
        return jsonify({"message": "User already exists"}), 400
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = {
        "email": email,
        "username": username,
        "password": hashed,
        "created_at": datetime.datetime.utcnow()
    }
    result = users_collection.insert_one(user)
    return jsonify({"message": "User registered successfully", "user_id": str(result.inserted_id)}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"message": "Missing required fields"}), 400
    user = users_collection.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401
    token = jwt.encode({
        "user_id": str(user["_id"]),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config["SECRET_KEY"], algorithm="HS256")
    return jsonify({"token": token}), 200

@app.route("/api/user", methods=["GET"])
def get_user():
    return jsonify({"message": "User endpoint (authentication handled on the frontend)"}), 200

@app.route("/api/users", methods=["GET"])
def get_all_users():
    users = list(users_collection.find({}, {"password": 0}))  # Exclude password
    for user in users:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
    return jsonify({"users": users}), 200


# ------------------------------------------------------------------------------
# User-Specific Endpoints: Notebooks → Sections → Notes
'''
The following endpoints implement the api logic for notebook hierarchy management mainly:
FR11, FR12, FR13 located in section 4.4 of the SRS.
'''
# ------------------------------------------------------------------------------
# --- Notebooks Endpoints ---
@app.route("/api/users/<user_id>/notebooks", methods=["GET"])
def get_user_notebooks(user_id):
    notebooks = list(notebooks_collection.find({"user_id": user_id}))
    for nb in notebooks:
        nb["_id"] = str(nb["_id"])
    return jsonify({"notebooks": notebooks}), 200

@app.route("/api/users/<user_id>/notebooks", methods=["POST"])
def create_notebook(user_id):
    data = request.get_json()
    notebook = {
        "user_id": user_id,
        "name": data.get("name", "Untitled Notebook"),
        "labels": data.get("labels", []), 
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    result = notebooks_collection.insert_one(notebook)
    notebook["_id"] = str(result.inserted_id)
    return jsonify({"notebook": notebook}), 201

@app.route("/api/users/<user_id>/notebooks/<notebook_id>", methods=["PUT"])
def update_notebook(user_id, notebook_id):
    data = request.get_json()
    updated = {
        "name": data.get("name"),
        "updated_at": datetime.datetime.utcnow()
    }
    # Add labels if provided
    if "labels" in data:
        updated["labels"] = data.get("labels", [])
    result = notebooks_collection.update_one(
        {"_id": ObjectId(notebook_id), "user_id": user_id},
        {"$set": updated}
    )
    if result.matched_count == 0:
        return jsonify({"message": "Notebook not found"}), 404
    return jsonify({"message": "Notebook updated successfully"}), 200

@app.route("/api/users/<user_id>/notebooks/<notebook_id>", methods=["DELETE"])
def delete_notebook(user_id, notebook_id):
    result = notebooks_collection.delete_one({"_id": ObjectId(notebook_id), "user_id": user_id})
    if result.deleted_count == 0:
        return jsonify({"message": "Notebook not found"}), 404
    # Delete associated sections and notes
    sections = list(sections_collection.find({"notebook_id": notebook_id, "user_id": user_id}))
    for sec in sections:
        sec_id = str(sec["_id"])
        notes_collection.delete_many({"section_id": sec_id, "user_id": user_id})
    sections_collection.delete_many({"notebook_id": notebook_id, "user_id": user_id})
    return jsonify({"message": "Notebook and its sections/notes deleted"}), 200

# --- Sections Endpoints ---
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections", methods=["GET"])
def get_sections(user_id, notebook_id):
    sections = list(sections_collection.find({"notebook_id": notebook_id, "user_id": user_id}))
    for sec in sections:
        sec["_id"] = str(sec["_id"])
    return jsonify({"sections": sections}), 200

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections", methods=["POST"])
def create_section(user_id, notebook_id):
    data = request.get_json()
    section = {
        "user_id": user_id,
        "notebook_id": notebook_id,
        "title": data.get("title", "New Section"),
        "labels": data.get("labels", []), 
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    result = sections_collection.insert_one(section)
    section["_id"] = str(result.inserted_id)
    return jsonify({"section": section}), 201

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>", methods=["PUT"])
def update_section(user_id, notebook_id, section_id):
    data = request.get_json()
    updated = {
        "title": data.get("title"),
        "updated_at": datetime.datetime.utcnow()
    }
    # Add labels if provided
    if "labels" in data:
        updated["labels"] = data.get("labels", [])
    result = sections_collection.update_one(
        {"_id": ObjectId(section_id), "notebook_id": notebook_id, "user_id": user_id},
        {"$set": updated}
    )
    if result.matched_count == 0:
        return jsonify({"message": "Section not found"}), 404
    return jsonify({"message": "Section updated successfully"}), 200

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>", methods=["DELETE"])
def delete_section(user_id, notebook_id, section_id):
    result = sections_collection.delete_one(
        {"_id": ObjectId(section_id), "notebook_id": notebook_id, "user_id": user_id}
    )
    if result.deleted_count == 0:
        return jsonify({"message": "Section not found"}), 404
    notes_collection.delete_many({"section_id": section_id, "user_id": user_id})
    return jsonify({"message": "Section and its notes deleted"}), 200

'''
The following endpoints help implement FR6 and FR8 of section 4.3 Note Taking with Code Execution in the SRS.
'''
# --- Notes Endpoints ---
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes", methods=["GET"])
def get_notes(user_id, notebook_id, section_id):
    notes = list(notes_collection.find({"section_id": section_id, "user_id": user_id}))
    for note in notes:
        note["_id"] = str(note["_id"])
    return jsonify({"notes": notes}), 200

# get a single note
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>", methods=["GET"])
def get_note(user_id, notebook_id, section_id, note_id):
    note = notes_collection.find_one({
        "_id": ObjectId(note_id), 
        "section_id": section_id, 
        "user_id": user_id
    })
    
    if not note:
        return jsonify({"message": "Note not found"}), 404
        
    note["_id"] = str(note["_id"])
    return jsonify({"note": note}), 200

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes", methods=["POST"])
def create_note(user_id, notebook_id, section_id):
    data = request.get_json()
    note = {
        "user_id": user_id,
        "notebook_id": notebook_id,
        "section_id": section_id,
        "title": data.get("title", "New Note"),
        "content": data.get("content", ""),
        "labels": data.get("labels", []),
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    result = notes_collection.insert_one(note)
    note["_id"] = str(result.inserted_id)
    return jsonify({"note": note}), 201

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>", methods=["PUT"])
def update_note(user_id, notebook_id, section_id, note_id):
    data = request.get_json()
    updated = {
        "title": data.get("title"),
        "content": data.get("content"),
        "updated_at": datetime.datetime.utcnow()
    }
    if "labels" in data:
        updated["labels"] = data.get("labels", [])
    result = notes_collection.update_one(
        {"_id": ObjectId(note_id), "section_id": section_id, "user_id": user_id},
        {"$set": updated}
    )
    if result.matched_count == 0:
        return jsonify({"message": "Note not found"}), 404
    return jsonify({"message": "Note updated successfully"}), 200

@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>", methods=["DELETE"])
def delete_note(user_id, notebook_id, section_id, note_id):
    result = notes_collection.delete_one(
        {"_id": ObjectId(note_id), "section_id": section_id, "user_id": user_id}
    )
    if result.deleted_count == 0:
        return jsonify({"message": "Note not found"}), 404
    return jsonify({"message": "Note deleted successfully"}), 200

    
    # Add these new endpoints after your existing endpoints

# ------------------------------------------------------------------------------
# Label-Specific Update Endpoints
'''
These endpoints are help implement the fucntional requirements listed in section 4.7 Labels for Organization in the SRS.
They are used to implement FR22, FR23, FR25
'''
# ------------------------------------------------------------------------------

# Update notebook labels
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/labels", methods=["PATCH"])
def update_notebook_labels(user_id, notebook_id):
    data = request.get_json()
    
    if "labels" not in data:
        return jsonify({"message": "Labels field is required"}), 400
        
    labels = data.get("labels", [])
    
    result = notebooks_collection.update_one(
        {"_id": ObjectId(notebook_id), "user_id": user_id},
        {"$set": {"labels": labels, "updated_at": datetime.datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Notebook not found"}), 404
        
    return jsonify({"message": "Labels updated successfully"}), 200

# Update section labels
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/labels", methods=["PATCH"])
def update_section_labels(user_id, notebook_id, section_id):
    data = request.get_json()
    
    if "labels" not in data:
        return jsonify({"message": "Labels field is required"}), 400
        
    labels = data.get("labels", [])
    
    result = sections_collection.update_one(
        {"_id": ObjectId(section_id), "notebook_id": notebook_id, "user_id": user_id},
        {"$set": {"labels": labels, "updated_at": datetime.datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Section not found"}), 404
        
    return jsonify({"message": "Labels updated successfully"}), 200

# Update note labels
@app.route("/api/users/<user_id>/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>/labels", methods=["PATCH"])
def update_note_labels(user_id, notebook_id, section_id, note_id):
    data = request.get_json()
    
    if "labels" not in data:
        return jsonify({"message": "Labels field is required"}), 400
        
    labels = data.get("labels", [])
    
    result = notes_collection.update_one(
        {"_id": ObjectId(note_id), "section_id": section_id, "user_id": user_id},
        {"$set": {"labels": labels, "updated_at": datetime.datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Note not found"}), 404
        
    return jsonify({"message": "Labels updated successfully"}), 200


@app.route("/api/users/<user_id>/labels", methods=["GET"])
def get_all_user_labels(user_id):
    # We need to get all unique labels across the objects
    
    notebook_labels = notebooks_collection.distinct("labels", {"user_id": user_id})
    
    section_labels = sections_collection.distinct("labels", {"user_id": user_id})
    
    note_labels = notes_collection.distinct("labels", {"user_id": user_id})
    
    # Combine all and remove duplicates
    all_labels = sorted(list(set(notebook_labels + section_labels + note_labels)))
    
    # Filter none or empty values
    all_labels = [label for label in all_labels if label]
    
    return jsonify({"labels": all_labels}), 200


# Setup
def setup_app():
    with app.app_context():
        init_db(app)
    
    # Register the search endpoint
    register_search_endpoint(app, notebooks_collection, sections_collection, notes_collection)
    
    return app

# ------------------------------------------------------------------------------
# Run the Flask Application
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    setup_app()
    app.run(debug=True, port=5000)
