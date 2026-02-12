// ===== WORKER.JS — Полная логика интерфейса исполнителя =====

let map = null;
let markersLayer = null;
let currentTasks = [];
let selectedTaskId = null;
let timerInterval = null;
let timerSeconds = 0;
let currentTaskDetail = null;

/**
 * Инициализация страницы работника
 */
function initWorkerPage() {
  loadTasks();
  initMap();

  // Фильтр задач
  document
    .getElementById("taskStatusFilter")
    .addEventListener("change", function () {
      loadTasks(this.value);
    });
}

/**
 * Загрузить задачи исполнителя
 * @param {string} statusFilter - Фильтр по статусу
 */
async function loadTasks(statusFilter = "assigned,in_progress") {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML =
    '<div class="text-center" style="padding: 24px;">⏳ Загрузка задач...</div>';

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user = getCurrentUser();
    if (!user) return;

    // Мок-данные для демонстрации
    currentTasks = getMockWorkerTasks(user.id);

    // Фильтрация по статусу
    let filtered = currentTasks;
    if (statusFilter !== "all") {
      const statuses = statusFilter.split(",");
      filtered = currentTasks.filter((task) => statuses.includes(task.status));
    }

    renderTaskList(filtered);
    addTaskMarkers(filtered);
  } catch (error) {
    console.error("Error loading tasks:", error);
    taskList.innerHTML =
      '<div class="text-center" style="padding: 24px; color: var(--danger);">❌ Ошибка загрузки задач</div>';
  }
}

/**
 * Рендеринг списка задач
 * @param {Array} tasks - Массив задач
 */
function renderTaskList(tasks) {
  const taskList = document.getElementById("taskList");

  if (!tasks || tasks.length === 0) {
    taskList.innerHTML =
      '<div class="text-center" style="padding: 24px; color: var(--gray-500);">📭 Нет активных задач</div>';
    return;
  }

  // Сортировка по приоритету
  const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
  const sortedTasks = [...tasks].sort(
    (a, b) =>
      (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99),
  );

  taskList.innerHTML = sortedTasks.map((task) => renderTaskCard(task)).join("");

  // Добавляем обработчики клика
  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      const taskId = parseInt(this.dataset.taskId);
      selectTask(taskId);
    });
  });
}

/**
 * Рендеринг одной карточки задачи
 * @param {object} task - Объект задачи
 * @returns {string} HTML карточки
 */
function renderTaskCard(task) {
  const categoryIcons = {
    lighting: "💡",
    garbage: "🗑️",
    pothole: "🕳️",
    other: "🔧",
  };

  const icon = categoryIcons[task.category] || "📌";
  const priorityClass = `priority-${task.priority}`;
  const isSelected = task.id === selectedTaskId ? "selected" : "";

  // Расстояние (мок)
  const distance = (Math.random() * 3 + 0.5).toFixed(1);

  return `
        <div class="task-card ${priorityClass} ${isSelected}" data-task-id="${task.id}">
            <div class="task-card-header">
                <span class="task-category">${icon}</span>
                <span class="priority-badge">${getPriorityText(task.priority)}</span>
            </div>
            <div class="task-title">${task.description.substring(0, 50)}</div>
            <div class="task-address">📍 ${task.address}</div>
            <div class="task-meta">
                <span class="task-distance">🚗 ${distance} км</span>
                ${
                  task.status === "in_progress"
                    ? `<span class="task-timer">⏱️ 00:23:15</span>`
                    : `<span class="task-deadline ${isDeadlineUrgent(task.deadline) ? "deadline-urgent" : ""}">
                        ⏰ ${getDeadlineText(task.deadline)}
                       </span>`
                }
            </div>
        </div>
    `;
}

/**
 * Получить текст приоритета
 */
function getPriorityText(priority) {
  const map = {
    urgent: "Срочно",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return map[priority] || priority;
}

/**
 * Проверка, близок ли дедлайн
 */
function isDeadlineUrgent(deadline) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
  return diffHours < 4;
}

/**
 * Получить текст дедлайна
 */
function getDeadlineText(deadline) {
  if (!deadline) return "Нет срока";
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffHours = Math.floor((deadlineDate - now) / (1000 * 60 * 60));

  if (diffHours < 0) return "Просрочено";
  if (diffHours < 24) return `${diffHours} ч`;
  return `${Math.floor(diffHours / 24)} д`;
}

/**
 * Выбрать задачу
 * @param {number} taskId - ID задачи
 */
async function selectTask(taskId) {
  selectedTaskId = taskId;

  // Подсветка в списке
  document.querySelectorAll(".task-card").forEach((card) => {
    card.classList.remove("selected");
    if (parseInt(card.dataset.taskId) === taskId) {
      card.classList.add("selected");
    }
  });

  // Центрируем карту на задаче
  const task = currentTasks.find((t) => t.id === taskId);
  if (task && map) {
    map.setView([task.latitude || 51.18, task.longitude || 71.45], 16);
  }

  // Загружаем детали задачи
  await showTaskDetail(taskId);
}

/**
 * Показать детали задачи
 * @param {number} taskId - ID задачи
 */
async function showTaskDetail(taskId) {
  const taskDetail = document.getElementById("taskDetail");

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");

    currentTaskDetail = task;

    let html = `
            <div class="task-detail-header">
                <h3>Задача #${task.id}</h3>
                <span class="badge badge-${task.status}">${getStatusText(task.status)}</span>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 8px;">АДРЕС</h4>
                <p style="font-weight: 600;">${task.address}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 8px;">ОПИСАНИЕ</h4>
                <p>${task.description}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 8px;">ФОТО ПРОБЛЕМЫ</h4>
                <img src="${task.photos?.[0]?.url || "https://via.placeholder.com/400x300?text=Фото+проблемы"}" 
                     style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;">
            </div>
        `;

    // Если задача в работе — показываем таймер, фотоотчёт, заметки
    if (task.status === "in_progress") {
      html += `
                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 16px;">⏱️ УЧЁТ ВРЕМЕНИ</h4>
                    <div class="timer-container">
                        <span class="timer-display" id="taskTimer">00:23:15</span>
                        <div class="timer-controls">
                            <button onclick="pauseTimer()" class="btn btn-secondary btn-small">⏸ Пауза</button>
                            <button onclick="completeTask(${task.id})" class="btn btn-success btn-small">✅ Завершить</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 16px;">📸 ФОТООТЧЁТ</h4>
                    <div class="photo-report">
                        <div class="photo-column">
                            <div class="photo-label">
                                <span>До начала работ</span>
                                <span class="required-badge">обязательно</span>
                            </div>
                            <div class="upload-box" onclick="triggerUpload('before', ${task.id})">
                                <span class="upload-icon">📷</span>
                                <span class="upload-text">Загрузить фото</span>
                            </div>
                            <div id="beforePreview" class="photo-preview">
                                <img src="https://via.placeholder.com/200x150?text=Фото+До" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                            </div>
                        </div>
                        <div class="photo-column">
                            <div class="photo-label">
                                <span>После выполнения</span>
                                <span class="required-badge">обязательно</span>
                            </div>
                            <div class="upload-box" onclick="triggerUpload('after', ${task.id})">
                                <span class="upload-icon">📷</span>
                                <span class="upload-text">Загрузить фото</span>
                            </div>
                            <div id="afterPreview" class="photo-preview empty">
                                Нет фото
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 8px;">📝 ЗАМЕТКИ</h4>
                    <textarea id="workNotes" class="notes-input" placeholder="Добавьте заметки о выполненной работе..."></textarea>
                </div>
            `;
    } else {
      // Задача назначена, но не начата — показываем кнопку старта
      html += `
                <button onclick="startWork(${task.id})" class="btn btn-success btn-large" style="width: 100%; margin-top: 16px;">
                    ▶ Начать работу
                </button>
            `;
    }

    taskDetail.innerHTML = html;
  } catch (error) {
    console.error("Error loading task detail:", error);
    taskDetail.innerHTML =
      '<div class="text-center" style="padding: 40px; color: var(--danger);">❌ Ошибка загрузки деталей задачи</div>';
  }
}

/**
 * Начать работу над задачей
 * @param {number} taskId - ID задачи
 */
async function startWork(taskId) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Обновляем статус задачи
    const task = currentTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = "in_progress";
    }

    // Перезагружаем список задач
    loadTasks(document.getElementById("taskStatusFilter").value);

    // Показываем детали с таймером
    await showTaskDetail(taskId);

    // Запускаем таймер
    startTimer();

    alert("✅ Работа начата!");
  } catch (error) {
    console.error("Error starting work:", error);
    alert("❌ Ошибка при начале работы");
  }
}

/**
 * Завершить задачу
 * @param {number} taskId - ID задачи
 */
async function completeTask(taskId) {
  // Проверяем, загружено ли фото "после"
  const afterPreview = document.getElementById("afterPreview");
  if (!afterPreview || afterPreview.classList.contains("empty")) {
    alert('❌ Необходимо загрузить фото "После выполнения"');
    return;
  }

  const notes = document.getElementById("workNotes")?.value || "";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Обновляем статус задачи
    const task = currentTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = "completed";
    }

    // Останавливаем таймер
    stopTimer();

    // Обновляем список
    loadTasks(document.getElementById("taskStatusFilter").value);

    // Показываем заглушку в деталях
    document.getElementById("taskDetail").innerHTML =
      '<div class="text-center" style="padding: 40px;">✅ Задача завершена и отправлена на проверку</div>';

    alert("✅ Задача успешно завершена!");
  } catch (error) {
    console.error("Error completing task:", error);
    alert("❌ Ошибка при завершении задачи");
  }
}

/**
 * Триггер загрузки фото
 * @param {string} type - Тип фото (before/after)
 * @param {number} taskId - ID задачи
 */
function triggerUpload(type, taskId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png";
  input.onchange = function (e) {
    if (e.target.files.length > 0) {
      uploadPhoto(taskId, type, e.target.files[0]);
    }
  };
  input.click();
}

/**
 * Загрузить фото
 * @param {number} taskId - ID задачи
 * @param {string} type - Тип фото
 * @param {File} file - Файл изображения
 */
async function uploadPhoto(taskId, type, file) {
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Файл слишком большой. Максимум 5MB");
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const reader = new FileReader();
    reader.onload = function (e) {
      const previewId = type === "before" ? "beforePreview" : "afterPreview";
      const preview = document.getElementById(previewId);

      if (preview) {
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">`;
        preview.classList.remove("empty");
      }
    };
    reader.readAsDataURL(file);

    alert(`✅ Фото "${type === "before" ? "До" : "После"}" загружено`);
  } catch (error) {
    console.error("Error uploading photo:", error);
    alert("❌ Ошибка загрузки фото");
  }
}

/**
 * Инициализация карты
 */
function initMap() {
  map = L.map("map").setView([51.18, 71.45], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  markersLayer = L.markerClusterGroup();
  map.addLayer(markersLayer);
}

/**
 * Добавить маркеры задач на карту
 * @param {Array} tasks - Массив задач
 */
function addTaskMarkers(tasks) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  tasks.forEach((task) => {
    const lat = task.latitude || 51.18 + (Math.random() - 0.5) * 0.1;
    const lng = task.longitude || 71.45 + (Math.random() - 0.5) * 0.1;

    // Цвет маркера по приоритету
    let markerColor = "#2563EB";
    if (task.priority === "urgent") markerColor = "#EF4444";
    if (task.priority === "high") markerColor = "#F59E0B";
    if (task.priority === "medium") markerColor = "#3B82F6";

    const markerIcon = L.divIcon({
      html: `<div style="background: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>`,
      className: "custom-marker",
      iconSize: [18, 18],
      popupAnchor: [0, -9],
    });

    const marker = L.marker([lat, lng], { icon: markerIcon });
    marker.bindPopup(`
            <b>Задача #${task.id}</b><br>
            ${task.description.substring(0, 50)}<br>
            <span style="color: ${markerColor};">● ${getPriorityText(task.priority)}</span>
        `);

    markersLayer.addLayer(marker);
  });
}

/**
 * Запустить таймер
 */
function startTimer() {
  timerSeconds = 23 * 60 + 15; // 23:15 для демо
  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

/**
 * Остановить таймер
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Пауза таймера
 */
function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Обновить отображение таймера
 */
function updateTimerDisplay() {
  const timerElement = document.getElementById("taskTimer");
  if (!timerElement) return;

  const hours = Math.floor(timerSeconds / 3600);
  const minutes = Math.floor((timerSeconds % 3600) / 60);
  const seconds = timerSeconds % 60;

  timerElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Получить мок-данные задач для работника
 */
function getMockWorkerTasks(workerId) {
  return [
    {
      id: 1002,
      worker_id: workerId,
      category: "pothole",
      description:
        "Глубокая яма во дворе, машины задевают дно. Требуется ямочный ремонт.",
      address: "ул. Пушкина, д. 10",
      latitude: 51.19,
      longitude: 71.46,
      status: "in_progress",
      priority: "urgent",
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/400x300?text=Яма" }],
    },
    {
      id: 1001,
      worker_id: workerId,
      category: "lighting",
      description: "Не горит фонарь на углу дома, требуется замена лампы.",
      address: "ул. Ленина, д. 15",
      latitude: 51.18,
      longitude: 71.45,
      status: "assigned",
      priority: "high",
      deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/400x300?text=Фонарь" }],
    },
    {
      id: 1003,
      worker_id: workerId,
      category: "garbage",
      description:
        "Переполненный мусорный контейнер, требуется внеплановый вывоз.",
      address: "пр. Мира, д. 5",
      latitude: 51.17,
      longitude: 71.44,
      status: "assigned",
      priority: "medium",
      deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/400x300?text=Мусор" }],
    },
  ];
}

/**
 * Получить текст статуса
 */
function getStatusText(status) {
  const map = {
    assigned: "Назначено",
    in_progress: "В работе",
    completed: "Выполнено",
  };
  return map[status] || status;
}

// Экспорт функций в глобальную область
window.initWorkerPage = initWorkerPage;
window.loadTasks = loadTasks;
window.selectTask = selectTask;
window.startWork = startWork;
window.completeTask = completeTask;
window.triggerUpload = triggerUpload;
window.pauseTimer = pauseTimer;
