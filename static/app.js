// static/app.js

// ======================
// API configuration
// ======================

const API_BASE_URL = "http://a62766389bd3f410ab789de92fa009e9-678903922.us-west-2.elb.amazonaws.com";

const TASKS_ENDPOINT = "/api/tasks";

const TASKS_URL = `${API_BASE_URL}${TASKS_ENDPOINT}`;


const backendSpan = document.getElementById("backend-host");
const apiSpan = document.getElementById("api-path");

if (backendSpan) backendSpan.textContent = new URL(API_BASE_URL).host;
if (apiSpan) apiSpan.textContent = TASKS_ENDPOINT;

const input = document.getElementById("new-task-input");
const addButton = document.getElementById("add-btn");
const refreshButton = document.getElementById("refresh-btn");

const tasksContainer = document.getElementById("tasks-container");
const errorBox = document.getElementById("error-box");

const totalSpan = document.getElementById("total-count");
const openSpan = document.getElementById("open-count");
const doneSpan = document.getElementById("done-count");

// ======================
// Helpers
// ======================

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

// ======================
// API calls
// ======================

async function fetchTasks() {
  clearError();
  tasksContainer.innerHTML = "<p class='muted'>Loading...</p>";

  try {
    const res = await fetch(TASKS_URL);
    if (!res.ok) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    tasksContainer.innerHTML = "";
    showError(`Failed to load tasks: ${err.message}`);
  }
}

function renderTasks(tasks) {
  tasksContainer.innerHTML = "";

  if (!tasks.length) {
    tasksContainer.innerHTML = "<p class='muted'>No tasks yet. Add something!</p>";
  }

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const open = total - done;

  totalSpan.textContent = total;
  openSpan.textContent = open;
  doneSpan.textContent = done;

  for (const task of tasks) {
    const row = document.createElement("div");
    row.className = "task-row" + (task.done ? " task-row--done" : "");

    const text = document.createElement("span");
    text.textContent = task.description;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className =
      "btn btn-small" + (task.done ? " btn-secondary" : " btn-primary");
    toggleBtn.textContent = task.done ? "Re-open" : "Done";
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
  const description = (input.value || "").trim();
  if (!description) return;

  addButton.disabled = true;
  try {
    const res = await fetch(TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    if (!res.ok) {
      throw new Error(res.statusText || `HTTP ${res.status}`);
    }
    input.value = "";
    await fetchTasks();
  } catch (err) {
    showError(`Failed to add task: ${err.message}`);
  } finally {
    addButton.disabled = false;
  }
}

async function toggleTask(task) {
  clearError();
  try {
    const res = await fetch(`${TASKS_URL}/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
    await fetchTasks();
  } catch (err) {
    showError(`Failed to update task: ${err.message}`);
  }
}

async function deleteTask(task) {
  clearError();
  try {
    const res = await fetch(`${TASKS_URL}/${task.id}`, {
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

// ======================
// Events
// ======================

if (addButton) addButton.addEventListener("click", addTask);
if (refreshButton) refreshButton.addEventListener("click", fetchTasks);
if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
}

// Initial load
fetchTasks();