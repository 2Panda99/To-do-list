// DOM Elements
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const warningMessage = document.getElementById("warningMessage");
const searchInput = document.getElementById("searchInput");
const progressFill = document.getElementById("progressFill");
const progressPercentage = document.getElementById("progressPercentage");
const motivationMessage = document.getElementById("motivationMessage");
const filters = document.querySelectorAll(".filter-btn");
const confirmModal = document.getElementById("confirmModal");
const modalMessage = document.getElementById("modalMessage");
const cancelBtn = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");

// State
let tasks = [];
let currentFilter = "all";
let taskToDelete = null;

// Load tasks
function loadTasks() {
  const saved = localStorage.getItem("tasks");
  if (saved) tasks = JSON.parse(saved);
  renderTasks();
  updateProgress();
}

// Save tasks
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add Task
function addTask() {
  const text = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const category = categoryInput.value.trim() || "General";
  const priority = priorityInput.value;

  if (!text) {
    warningMessage.classList.remove("hidden");
    setTimeout(() => warningMessage.classList.add("hidden"), 3000);
    return;
  }

  const newTask = {
    id: Date.now(),
    text,
    dueDate: dueDate || null,
    category,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  taskInput.value = "";
  dueDateInput.value = "";
  categoryInput.value = "";
  priorityInput.value = "medium";
  saveTasks();
  renderTasks();
  updateProgress();
}

// Render Tasks
function renderTasks() {
  taskList.innerHTML = "";
  const now = new Date();
  const searchQuery = searchInput.value.toLowerCase().trim();

  let filteredTasks = tasks.filter(task => {
    // Filter by current tab
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    if (currentFilter === "overdue") {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    }

    return true;
  });

  // Search filter
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(t =>
      t.text.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery)
    );
  }

  // Sort: Priority (High > Medium > Low), then by creation
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  filteredTasks.sort((a, b) => {
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // newest first
  });

  if (filteredTasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.style.textAlign = "center";
    emptyItem.style.color = "#7f8c8d";
    emptyItem.style.fontStyle = "italic";
    emptyItem.textContent = "No tasks match your criteria.";
    taskList.appendChild(emptyItem);
  } else {
    filteredTasks.forEach(task => {
      const li = document.createElement("li");
      if (task.completed) li.classList.add("completed");

      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && !task.completed && dueDate < now;
      if (isOverdue) li.classList.add("overdue");

      li.innerHTML = `
        <div class="task-info">
          <span class="text">${task.text}</span>
          <div class="meta">
            <span class="priority-badge pri-${task.priority}">${task.priority}</span>
            <span>${task.category}</span>
            ${dueDate ? `<span>📅 ${dueDate.toLocaleDateString()}</span>` : ""}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-complete" title="Mark Complete">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn btn-delete" title="Delete Task">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      li.querySelector(".btn-complete").onclick = (e) => {
        e.stopPropagation();
        toggleComplete(task.id);
      };

      li.querySelector(".btn-delete").onclick = (e) => {
        e.stopPropagation();
        openConfirmModal(task.id);
      };

      taskList.appendChild(li);
    });
  }
}

// Toggle Complete
function toggleComplete(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks();
  renderTasks();
  updateProgress();
}

// Open Confirm Modal
function openConfirmModal(id) {
  const task = tasks.find(t => t.id === id);
  modalMessage.textContent = `Delete "${task?.text || 'this task'}"?`;
  taskToDelete = id;
  confirmModal.classList.add("active");
}

// Close Modal
function closeConfirmModal() {
  confirmModal.classList.remove("active");
  taskToDelete = null;
}

// Confirm Delete
function confirmDelete() {
  if (taskToDelete === null) return;

  tasks = tasks.filter(t => t.id !== taskToDelete);
  saveTasks();
  renderTasks();
  updateProgress();
  closeConfirmModal();
}

// Update Progress
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width = `${percent}%`;
  progressPercentage.textContent = `${percent}%`;

  if (total === 0) {
    motivationMessage.textContent = "Start adding tasks!";
  } else if (percent === 100) {
    motivationMessage.textContent = "🎉 All done! Amazing!";
  } else if (percent >= 75) {
    motivationMessage.textContent = "🔥 Almost there! Keep going!";
  } else if (percent >= 50) {
    motivationMessage.textContent = "💪 Halfway! You've got this!";
  } else if (percent >= 25) {
    motivationMessage.textContent = "🚀 Getting started! Push forward!";
  } else {
    motivationMessage.textContent = "🌱 Just beginning? Every step counts!";
  }
}

// Event Listeners
addButton.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => e.key === "Enter" && addTask());

// Search
searchInput.addEventListener("input", renderTasks);

// Filters
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter");
    renderTasks();
  });
});

// Modal
cancelBtn.addEventListener("click", closeConfirmModal);
confirmBtn.addEventListener("click", confirmDelete);
confirmModal.addEventListener("click", e => e.target === confirmModal && closeConfirmModal());
document.addEventListener("keydown", e => e.key === "Escape" && closeConfirmModal());

// Initial Load
loadTasks();

// confetti function when all tasks are completed
if (percent === 100 && tasks.length > 0) {
  motivationMessage.textContent = "🎉 All done! Amazing!";

  // Epic confetti burst
  confetti({
    particleCount: 200,
    spread: 180,
    origin: { y: 0.6 },
    colors: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6']
  });

  // Secondary burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#2ecc71', '#f1c40f']
    });
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#e74c3c', '#3498db']
    });
  }, 500);
}


// export tasks to PDF
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  // ✅ Correct way to initialize jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Your existing code below...
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("🎯 My To-Do List", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.line(14, 34, 190, 34);

  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`📊 Summary`, 14, 44);
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Tasks: ${tasks.length} | Completed: ${completed} | Overdue: ${overdue}`, 14, 52);

  let y = 62;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("📋 Task List", 14, y);
  y += 10;

  tasks.forEach(task => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const status = task.completed ? "✅" : "📄";
    const due = task.dueDate ? ` | Due: ${new Date(task.dueDate).toLocaleDateString()}` : "";
    const line = `${status} ${task.text} [${task.priority.toUpperCase()}] [${task.category}]${due}`;

    // Set color: gray for completed, red for overdue, black otherwise
    if (task.completed) {
      doc.setTextColor(100, 100, 100);
    } else if (task.dueDate && new Date(task.dueDate) < new Date()) {
      doc.setTextColor(231, 76, 60); // Red
    } else {
      doc.setTextColor(0, 0, 0); // Black
    }

    doc.text(line, 14, y);
    y += 8;
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Generated with ❤️ by your To-Do App", 14, 290);

  // Save PDF
  doc.save(`tasks-${new Date().toISOString().split("T")[0]}.pdf`);
});
// reorder tasks using drag and drop

// Make list sortable
if (taskList.children.length > 1) {
  Sortable.create(taskList, {
    animation: 150,
    onEnd: function() {
      // Reorder tasks array to match DOM
      const orderedIds = Array.from(taskList.children)
        .filter(el => !el.classList.contains("empty"))
        .map(el => {
          const idText = el.querySelector(".btn-complete")?.getAttribute("data-id") || "";
          return parseInt(idText);
        })
        .filter(id => !isNaN(id));

      tasks.sort((a, b) => {
        return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
      });

      saveTasks(); // Save new order
    }
  });
}

