// ========= CONFIG =========
const API_BASE_URL = "";
const TASKS_ENDPOINT = "/api/tasks";


const newTaskForm   = document.querySelector("#new-task-form");
const newTaskInput  = document.querySelector("#new-task-input");
const formError     = document.querySelector("#form-error");

const totalSpan     = document.querySelector("#stat-total");
const openSpan      = document.querySelector("#stat-open");
const doneSpan      = document.querySelector("#stat-done");

const reloadBtn     = document.querySelector("#reload-btn");
const loadingDiv    = document.querySelector("#loading");
const tasksList     = document.querySelector("#tasks-list");
const emptyState    = document.querySelector("#empty-state");
const listError     = document.querySelector("#list-error");

// Helper
function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// ========= RENDER =========
function renderTasks(tasks) {

  if (loadingDiv) {
    loadingDiv.classList.add("hidden");
  }
  if (listError) {
    listError.classList.add("hidden");
  }

  tasksList.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    // لا يوجد مهام
    emptyState.classList.remove("hidden");
    totalSpan.textContent = "0";
    openSpan.textContent = "0";
    doneSpan.textContent = "0";
    return;
  }

  emptyState.classList.add("hidden");

  let openCount = 0;
  let doneCount = 0;

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = task.title ?? "(no title)";

    const statusSpan = document.createElement("span");
    const isDone =
      task.is_done === true ||
      task.is_done === 1 ||
      task.completed === true;

    statusSpan.textContent = isDone ? "Done" : "Open";
    statusSpan.className = isDone ? "badge badge--done" : "badge badge--open";

    li.appendChild(titleSpan);
    li.appendChild(statusSpan);
    tasksList.appendChild(li);

    if (isDone) {
      doneCount += 1;
    } else {
      openCount += 1;
    }
  });

  totalSpan.textContent = String(tasks.length);
  openSpan.textContent = String(openCount);
  doneSpan.textContent = String(doneCount);
}

// ========= API CALLS =========
async function fetchTasks() {
  try {
    if (loadingDiv) {
      loadingDiv.classList.remove("hidden");
      loadingDiv.textContent = "Loading tasks…";
    }
    if (listError) {
      listError.classList.add("hidden");
    }

    const res = await fetch(apiUrl(TASKS_ENDPOINT), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error("Failed to fetch tasks:", res.status, res.statusText);
      if (listError) {
        listError.textContent = "Failed to load tasks.";
        listError.classList.remove("hidden");
      }
      return;
    }

    const data = await res.json();
    console.log("Tasks from API:", data);
    renderTasks(data);
  } catch (err) {
    console.error("Error while fetching tasks:", err);
    if (listError) {
      listError.textContent = "Error loading tasks.";
      listError.classList.remove("hidden");
    }
  } finally {
    if (loadingDiv) {
      loadingDiv.classList.add("hidden");
    }
  }
}

async function addTask(title) {
  if (!title || title.trim() === "") {
    if (formError) {
      formError.textContent = "Please enter a task title.";
      formError.classList.remove("hidden");
    }
    return;
  }

  if (formError) {
    formError.classList.add("hidden");
  }

  try {
    const res = await fetch(apiUrl(TASKS_ENDPOINT), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (!res.ok) {
      console.error("Failed to add task:", res.status, res.statusText);
      if (formError) {
        formError.textContent = "Failed to add task. Try again.";
        formError.classList.remove("hidden");
      }
      return;
    }

    const created = await res.json();
    console.log("Created task:", created);

    newTaskInput.value = "";
    await fetchTasks();
  } catch (err) {
    console.error("Error while adding task:", err);
    if (formError) {
      formError.textContent = "Error while adding task.";
      formError.classList.remove("hidden");
    }
  }
}

// ========= INIT / EVENTS =========
document.addEventListener("DOMContentLoaded", () => {
  fetchTasks();

  if (newTaskForm) {
    newTaskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addTask(newTaskInput.value);
    });
  }

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      fetchTasks();
    });
  }
});