import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

# load our environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all frontend requests


# mongodb URI from environment, or use default string if it fails to get from env
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/note_app")
client = MongoClient(MONGO_URI)
db = client["note_app"]
notes_collection = db["notes"]


def create_initial_note():
    if notes_collection.count_documents({}) == 0:  # if empty create initial note
        notes_collection.insert_one({
            "title": "Initial note",
            "content": "This is an initial note"
        })
        print("Initial note created.")

# create an initial note
create_initial_note()

# api check
@app.route("/api/", methods=["GET"])
def api_status():
    return jsonify({"message": "API is running!"})

@app.route("/api/notes", methods=["GET"])
def get_notes():
    notes = list(notes_collection.find({}, {"_id": 0}))  # Exclude MongoDB _id
    return jsonify(notes)

@app.route("/api/notes", methods=["POST"])
def create_note():
    data = request.json
    new_note = {"title": data["title"], "content": data["content"]}
    notes_collection.insert_one(new_note)
    return jsonify({"message": "Note added"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
