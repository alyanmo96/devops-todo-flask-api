// static/app.js

// ======================
// API configuration
// ======================

// Base URL for the API (your backend ELB / DNS)
const API_BASE_URL = "http://a62766389bd3f410ab789de92fa009e9-678903922.us-west-2.elb.amazonaws.com";

// Path of the tasks endpoint
const TASKS_ENDPOINT = "/api/tasks";

// Full URL for tasks
const TASKS_URL = `${API_BASE_URL}${TASKS_ENDPOINT}`;

// ======================
// DOM elements
// ======================

const backendSpan = document.getElementById("backend-host");
const apiSpan = document.getElementById("api-path");

if (backendSpan) backendSpan.textContent = new URL(API_BASE_URL || window.location.origin).host;
if (apiSpan) apiSpan.textContent = TASKS_ENDPOINT;

const input = document.getElementById("new-task-input");
const addButton = document.getElementById("add-task-btn");
const refreshButton = document.getElementById("refresh-btn");

const tasksList = document.getElementById("tasks-list");
const errorBox = document.getElementById("error-message");

const totalCountSpan = document.getElementById("total-count");
const openCountSpan = document.getElementById("open-count");
const doneCountSpan = document.getElementById("done-count");

// Show backend + API path in header (without http://)
if (backendSpan) {
  backendSpan.textContent = API_BASE_URL.replace(/^https?:\/\//, "");
}
if (apiSpan) {
  apiSpan.textContent = TASKS_ENDPOINT;
}

// ======================
// Helpers
// ======================

function showError(msg) {
  console.error(msg);
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.style.opacity = "1";

  // hide after a few seconds
  setTimeout(() => {
    errorBox.style.opacity = "0";
  }, 4000);
}

function clearTasksList() {
  if (!tasksList) return;
  tasksList.innerHTML = "";
}

function updateCounters(tasks) {
  if (!Array.isArray(tasks)) return;

  const total = tasks.length;
  const done = tasks.filter((t) => t.done || t.is_done).length;
  const open = total - done;

  if (totalCountSpan) totalCountSpan.textContent = total;
  if (openCountSpan) openCountSpan.textContent = open;
  if (doneCountSpan) doneCountSpan.textContent = done;
}

// Render a single task row
function renderTask(task) {
  if (!tasksList) return;
  const li = document.createElement("li");
  li.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !!(task.done || task.is_done);
  checkbox.className = "task-checkbox";

  const titleSpan = document.createElement("span");
  titleSpan.className = "task-title";
  titleSpan.textContent = task.title || task.description || "";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task-delete-btn";
  deleteBtn.textContent = "✕";

  // toggle done
  checkbox.addEventListener("change", () => {
    toggleTask(task.id);
  });

  // delete
  deleteBtn.addEventListener("click", () => {
    deleteTask(task.id);
  });

  li.appendChild(checkbox);
  li.appendChild(titleSpan);
  li.appendChild(deleteBtn);

  tasksList.appendChild(li);
}

// ======================
// API calls
// ======================

// GET /api/tasks
async function fetchTasks() {
  if (!tasksList) return;

  clearTasksList();

  const loadingLi = document.createElement("li");
  loadingLi.textContent = "Loading tasks…";
  loadingLi.className = "task-loading";
  tasksList.appendChild(loadingLi);

  try {
    const res = await fetch(TASKS_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`GET ${TASKS_URL} failed: ${res.status}`);
    }

    const data = await res.json();

    clearTasksList();

    if (!data || data.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.textContent = "No tasks yet. Add your first one 👇";
      emptyLi.className = "task-empty";
      tasksList.appendChild(emptyLi);
    } else {
      data.forEach(renderTask);
    }

    updateCounters(data);
  } catch (err) {
    clearTasksList();
    showError(`Failed to load tasks: ${err.message}`);
  }
}

// POST /api/tasks
async function addTask() {
  if (!input) return;
  const title = input.value.trim();
  if (!title) return;

  addButton && (addButton.disabled = true);

  try {
    const res = await fetch(TASKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`POST ${TASKS_URL} failed: ${res.status}`);
    }

    input.value = "";
    await fetchTasks();
  } catch (err) {
    showError(`Failed to add task: ${err.message}`);
  } finally {
    addButton && (addButton.disabled = false);
  }
}

// PATCH /api/tasks/:id  (toggle done)
async function toggleTask(id) {
  try {
    const res = await fetch(`${TASKS_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ toggle: true }),
    });

    if (!res.ok) {
      throw new Error(`PATCH ${TASKS_URL}/${id} failed: ${res.status}`);
    }

    await fetchTasks();
  } catch (err) {
    showError(`Failed to update task: ${err.message}`);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(id) {
  try {
    const res = await fetch(`${TASKS_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`DELETE ${TASKS_URL}/${id} failed: ${res.status}`);
    }

    await fetchTasks();
  } catch (err) {
    showError(`Failed to delete task: ${err.message}`);
  }
}

// ======================
// Wire up events
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