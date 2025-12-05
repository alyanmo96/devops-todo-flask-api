import os
import sys

# أضف مجلد المشروع (اللي فيه app.py) إلى الـ sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app, db, Task


def setup_function(_func):
    """first, clean the DB"""
    with app.app_context():
        db.drop_all()
        db.create_all()


def test_create_and_list_tasks():
    client = app.test_client()

    # first, 
    res = client.get("/api/tasks")
    assert res.status_code == 200
    assert res.get_json() == []

    # create a new task
    res = client.post("/api/tasks", json={"title": "Test task"})
    assert res.status_code == 201
    data = res.get_json()
    assert data["title"] == "Test task"
    assert data["is_done"] is False

    # return list of tasks
    res = client.get("/api/tasks")
    assert res.status_code == 200
    tasks = res.get_json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Test task"