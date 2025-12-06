from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{BASE_DIR / 'tasks.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)


# ---------- Serve the frontend ----------

@app.route("/")
def index():
    # serve static/index.html
    return send_from_directory("static", "index.html")


# ---------- API endpoints ----------

@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/api/tasks", methods=["GET", "POST"])
def tasks():
    if request.method == "POST":
        data = request.get_json() or {}
        title = (data.get("title") or "").strip()

        if not title:
            return jsonify({"error": "Title is required"}), 400

        task = Task(description=title, done=False)
        db.session.add(task)
        db.session.commit()

        return (
            jsonify(
                {
                    "id": task.id,
                    "title": title,
                    "is_done": task.done,
                }
            ),
            201,
        )

    all_tasks = Task.query.order_by(Task.id.desc()).all()
    return (
        jsonify(
            [
                {
                    "id": t.id,
                    "title": t.description,
                    "is_done": t.done,
                }
                for t in all_tasks
            ]
        ),
        200,
    )


@app.route("/api/tasks/<int:task_id>", methods=["PATCH", "DELETE"])
def task_detail(task_id):
    task = Task.query.get_or_404(task_id)

    if request.method == "PATCH":
        data = request.get_json() or {}
        if "done" in data:
            task.done = bool(data["done"])
        db.session.commit()
        return jsonify({
            "id": task.id,
            "description": task.description,
            "title": task.description,
            "done": task.done,
        })

    # DELETE
    db.session.delete(task)
    db.session.commit()
    return "", 204


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8000, debug=True)
