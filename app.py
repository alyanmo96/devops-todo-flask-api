from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# ----------------------------
# Database config - SQLite file
# ----------------------------

# path like: /Users/.../devOps project/tasks.db
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "tasks.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

VERSION = "1.0.0"


# ----------------------------
# Task model (SQLite table)
# ----------------------------

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    is_done = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convert Task object to plain dict for JSON responses."""
        return {
            "id": self.id,
            "title": self.title,
            "is_done": self.is_done,
            "created_at": self.created_at.isoformat()
        }


# ----------------------------
# Basic endpoints
# ----------------------------

@app.get("/")
def home():
    # just a small welcome message
    return jsonify({
        "message": "ToDo API is running",
        "endpoints": ["/health", "/api/version", "/api/tasks"]
    }), 200


@app.get("/health")
def health():
    return jsonify({"status": "healthy"}), 200


@app.get("/api/version")
def version():
    return jsonify({"version": VERSION}), 200


# ---- Tasks CRUD ----

@app.get("/api/tasks")
def list_tasks():
    """Return all tasks."""
    tasks = Task.query.order_by(Task.id).all()
    return jsonify([t.to_dict() for t in tasks]), 200


@app.post("/api/tasks")
def create_task():
    """Create a new task."""
    data = request.get_json() or {}
    title = data.get("title")

    if not title:
        return jsonify({"error": "title is required"}), 400

    task = Task(title=title, is_done=False)
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@app.put("/api/tasks/<int:task_id>")
def update_task(task_id):
    """Update title or done state of a task."""
    data = request.get_json() or {}

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404

    title = data.get("title")
    is_done = data.get("is_done")

    if title is not None:
        task.title = title

    if is_done is not None:
        task.is_done = bool(is_done)

    db.session.commit()
    return jsonify(task.to_dict()), 200


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    """Delete a task."""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "task deleted"}), 200


# ----------------------------
# App entrypoint
# ----------------------------
if __name__ == "__main__":
    # create tables if they don't exist yet
    with app.app_context():
        db.create_all()

    app.run(host="0.0.0.0", port=8000, debug=True)
