from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{BASE_DIR / 'tasks.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    is_done = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "is_done": self.is_done,
            "created_at": self.created_at.isoformat(),
        }


# ===== Frontend (same origin) =====

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


# ===== Healthcheck =====

@app.get("/health")
def health():
    return jsonify({"status": "healthy"}), 200


# ===== Tasks API =====

@app.route("/api/tasks", methods=["GET", "POST"])
def tasks_collection():
    if request.method == "GET":
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([t.to_dict() for t in tasks]), 200

    # POST
    data = request.get_json() or {}
    title = data.get("title") or data.get("description")
    if not title:
        return jsonify({"error": "title is required"}), 400

    task = Task(title=title, is_done=False)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.route("/api/tasks/<int:task_id>", methods=["PATCH", "DELETE"])
def task_detail(task_id):
    task = Task.query.get_or_404(task_id)

    if request.method == "PATCH":
        data = request.get_json() or {}
        # نقبل is_done أو done
        if "is_done" in data:
            task.is_done = bool(data["is_done"])
        elif "done" in data:
            task.is_done = bool(data["done"])
        db.session.commit()
        return jsonify(task.to_dict()), 200

    # DELETE
    db.session.delete(task)
    db.session.commit()
    return "", 204


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)