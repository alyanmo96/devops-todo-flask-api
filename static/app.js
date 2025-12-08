// static/app.js

const API_BASE_URL = "";
const TASKS_ENDPOINT = "/api/tasks";

// ----- Header info -----
const backendSpan = document.getElementById("backend-host");
const apiSpan = document.getElementById("api-path");

if (backendSpan) {
  // show only host, without http://
  backendSpan.textContent = API_BASE_URL.replace(/^https?:\/\//, "");
}
if (apiSpan) {
  apiSpan.textContent = TASKS_ENDPOINT;
}

// ----- DOM elements -----
const input = document.getElementById("new-task-input");
const addButton = document.getElementById("add-btn");
const refreshButton = document.getElementById("refresh-btn");
const tasksContainer = document.getElementById("tasks-container");
const errorBox = document.getElementById("error-box");
const totalSpan = document.getElementById("total-count");
const openSpan = document.getElementById("open-count");
const doneSpan = document.getElementById("done-count");

// ----- Helpers -----
function showError(message) {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.style.display = "none";
}

// ----- API calls -----
async function fetchTasks() {
  clearError();
  if (tasksContainer) {
    tasksContainer.innerHTML = "<p class='muted'>Loading...</p>";
  }

  try {
    const res = await fetch(`${API_BASE_URL}${TASKS_ENDPOINT}`);
    if (!res.ok) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    if (tasksContainer) tasksContainer.innerHTML = "";
    showError(`Failed to load tasks: ${err.message}`);
  }
}

function renderTasks(tasks) {
  if (!tasksContainer) return;
  tasksContainer.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML =
      "<p class='muted'>No tasks yet. Add something!</p>";
  }

  const total = tasks.length;
  // Backend uses "is_done" instead of "done"
  const done = tasks.filter((t) => t.is_done).length;
  const open = total - done;

  if (totalSpan) totalSpan.textContent = total;
  if (openSpan) openSpan.textContent = open;
  if (doneSpan) doneSpan.textContent = done;

  for (const task of tasks) {
    const row = document.createElement("div");
    row.className =
      "task-row" + (task.is_done ? " task-row--done" : "");

    const text = document.createElement("span");
    // Backend returns "title" instead of "description"
    text.textContent = task.title || "(no title)";

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className =
      "btn btn-small" + (task.is_done ? " btn-secondary" : " btn-primary");
    toggleBtn.textContent = task.is_done ? "Re-open" : "Done";
    toggleBtn.onclick = () => toggleTask(task);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-small btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(task);

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(text);
    row.appendChild(actions);
    tasksContainer.appendChild(row);
  }
}

async function addTask() {
  clearError();
  const description = input && input.value ? input.value.trim() : "";
  if (!description) return;

  if (addButton) addButton.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}${TASKS_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Backend expects "title" (and uses "is_done" field in response)
      body: JSON.stringify({ title: description, is_done: false }),
    });
    if (!res.ok) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    if (input) input.value = "";
    await fetchTasks();
  } catch (err) {
    showError(`Failed to add task: ${err.message}`);
  } finally {
    if (addButton) addButton.disabled = false;
  }
}

async function toggleTask(task) {
  clearError();
  try {
    const res = await fetch(`${API_BASE_URL}${TASKS_ENDPOINT}/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Backend uses "is_done" instead of "done"
      body: JSON.stringify({ is_done: !task.is_done }),
    });
    if (!res.ok) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    await fetchTasks();
  } catch (err) {
    showError(`Failed to update task: ${err.message}`);
  }
}

async function deleteTask(task) {
  clearError();
  try {
    const res = await fetch(`${API_BASE_URL}${TASKS_ENDPOINT}/${task.id}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    await fetchTasks();
  } catch (err) {
    showError(`Failed to delete task: ${err.message}`);
  }
}

// ----- Events -----
if (addButton) addButton.addEventListener("click", addTask);
if (refreshButton) refreshButton.addEventListener("click", fetchTasks);
if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
}

// Initial load
fetchTasks();