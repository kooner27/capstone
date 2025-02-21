import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import jwt
import datetime
from functools import wraps

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow requests from any origin

# Flask configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_secret_key")

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/note_app")
client = MongoClient(MONGO_URI)
db = client["note_app"]

# Define collections
users_collection = db["users"]
notebooks_collection = db["notebooks"]
sections_collection = db["sections"]
notes_collection = db["notes"]

# ------------------------------------------------------------------------------
# API Status Endpoint
# ------------------------------------------------------------------------------
@app.route("/api/", methods=["GET"])
def api_status():
    return jsonify({"message": "API is running!"})

# ------------------------------------------------------------------------------
# User Registration & Login Endpoints
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
    # Return a token anyway (for future use) even though the frontend handles auth state
    token = jwt.encode({
        "user_id": str(user["_id"]),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config["SECRET_KEY"], algorithm="HS256")
    return jsonify({"token": token}), 200

@app.route("/api/user", methods=["GET"])
def get_user():
    # For now, simply return a dummy message (frontend should manage logged-in state)
    return jsonify({"message": "User endpoint (authentication handled on the frontend)"}), 200

# ------------------------------------------------------------------------------
# Hierarchical Endpoints: Notebooks → Sections → Notes
# ------------------------------------------------------------------------------
# --- Notebooks Endpoints ---
@app.route("/api/notebooks", methods=["GET"])
def get_notebooks():
    # For testing, we assume a dummy user_id "test"
    notebooks = list(notebooks_collection.find({}))
    for nb in notebooks:
        nb["_id"] = str(nb["_id"])
    return jsonify({"notebooks": notebooks}), 200

@app.route("/api/notebooks", methods=["POST"])
def create_notebook():
    data = request.get_json()
    notebook = {
        "user_id": "test",  # dummy user id for testing
        "name": data.get("name", "Untitled Notebook"),
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    result = notebooks_collection.insert_one(notebook)
    notebook["_id"] = str(result.inserted_id)
    return jsonify({"notebook": notebook}), 201

@app.route("/api/notebooks/<notebook_id>", methods=["PUT"])
def update_notebook(notebook_id):
    data = request.get_json()
    updated = {
        "name": data.get("name"),
        "updated_at": datetime.datetime.utcnow()
    }
    result = notebooks_collection.update_one({"_id": notebook_id}, {"$set": updated})
    if result.matched_count == 0:
        return jsonify({"message": "Notebook not found"}), 404
    return jsonify({"message": "Notebook updated successfully"}), 200

@app.route("/api/notebooks/<notebook_id>", methods=["DELETE"])
def delete_notebook(notebook_id):
    notebooks_collection.delete_one({"_id": notebook_id})
    # Delete associated sections and notes
    sections = list(sections_collection.find({"notebook_id": notebook_id}))
    for sec in sections:
        sec_id = str(sec["_id"])
        notes_collection.delete_many({"section_id": sec_id})
    sections_collection.delete_many({"notebook_id": notebook_id})
    return jsonify({"message": "Notebook and its sections/notes deleted"}), 200

# --- Sections Endpoints (nested in a Notebook) ---
@app.route("/api/notebooks/<notebook_id>/sections", methods=["GET"])
def get_sections(notebook_id):
    sections = list(sections_collection.find({"notebook_id": notebook_id}))
    for sec in sections:
        sec["_id"] = str(sec["_id"])
    return jsonify({"sections": sections}), 200

@app.route("/api/notebooks/<notebook_id>/sections", methods=["POST"])
def create_section(notebook_id):
    data = request.get_json()
    section = {
        "user_id": "test",  # dummy user id for testing
        "notebook_id": notebook_id,
        "title": data.get("title", "New Section"),
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    result = sections_collection.insert_one(section)
    section["_id"] = str(result.inserted_id)
    return jsonify({"section": section}), 201

@app.route("/api/notebooks/<notebook_id>/sections/<section_id>", methods=["PUT"])
def update_section(notebook_id, section_id):
    data = request.get_json()
    updated = {
        "title": data.get("title"),
        "updated_at": datetime.datetime.utcnow()
    }
    result = sections_collection.update_one({"_id": section_id, "notebook_id": notebook_id}, {"$set": updated})
    if result.matched_count == 0:
        return jsonify({"message": "Section not found"}), 404
    return jsonify({"message": "Section updated successfully"}), 200

@app.route("/api/notebooks/<notebook_id>/sections/<section_id>", methods=["DELETE"])
def delete_section(notebook_id, section_id):
    sections_collection.delete_one({"_id": section_id, "notebook_id": notebook_id})
    notes_collection.delete_many({"section_id": section_id})
    return jsonify({"message": "Section and its notes deleted"}), 200

# --- Notes Endpoints (nested in a Section and Notebook) ---
@app.route("/api/notebooks/<notebook_id>/sections/<section_id>/notes", methods=["GET"])
def get_notes(notebook_id, section_id):
    notes = list(notes_collection.find({"section_id": section_id}))
    for note in notes:
        note["_id"] = str(note["_id"])
    return jsonify({"notes": notes}), 200

@app.route("/api/notebooks/<notebook_id>/sections/<section_id>/notes", methods=["POST"])
def create_note(notebook_id, section_id):
    data = request.get_json()
    note = {
        "user_id": "test",  # dummy user id for testing
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

@app.route("/api/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>", methods=["PUT"])
def update_note(notebook_id, section_id, note_id):
    data = request.get_json()
    updated = {
        "title": data.get("title"),
        "content": data.get("content"),
        "labels": data.get("labels", []),
        "updated_at": datetime.datetime.utcnow()
    }
    result = notes_collection.update_one({"_id": note_id, "section_id": section_id}, {"$set": updated})
    if result.matched_count == 0:
        return jsonify({"message": "Note not found"}), 404
    return jsonify({"message": "Note updated successfully"}), 200

@app.route("/api/notebooks/<notebook_id>/sections/<section_id>/notes/<note_id>", methods=["DELETE"])
def delete_note(notebook_id, section_id, note_id):
    result = notes_collection.delete_one({"_id": note_id, "section_id": section_id})
    if result.deleted_count == 0:
        return jsonify({"message": "Note not found"}), 404
    return jsonify({"message": "Note deleted successfully"}), 200

# ------------------------------------------------------------------------------
# Run the Flask Application
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
