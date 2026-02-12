// ===== ADMIN.JS — Полная логика панели администратора =====

let dashboardData = null;
let requestsData = [];
let workersData = [];
let timelineChart = null;
let categoriesChart = null;
let hotspotMap = null;
let currentSortColumn = "id";
let currentSortDirection = "asc";

/**
 * Инициализация страницы администратора
 */
function initAdminPage() {
  loadDashboard();
  loadRequests();
  loadWorkers();
  initHotspotMap();
  initNavigation();
}

/**
 * Загрузка данных дашборда
 */
async function loadDashboard() {
  // Показываем скелетоны
  showSkeletons();

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Мок-данные для дашборда
    dashboardData = getMockDashboardData();

    // Обновляем KPI карточки
    document.getElementById("stat-total").textContent =
      dashboardData.total_requests.toLocaleString();
    document.getElementById("stat-in-progress").textContent =
      dashboardData.in_progress;
    document.getElementById("stat-completed-today").textContent =
      dashboardData.completed_today;
    document.getElementById("stat-overdue").textContent = dashboardData.overdue;

    // Рендерим графики
    renderCharts(dashboardData);
  } catch (error) {
    console.error("Error loading dashboard:", error);
  } finally {
    hideSkeletons();
  }
}

/**
 * Показать скелетоны загрузки
 */
function showSkeletons() {
  // Добавляем класс skeleton к KPI карточкам
  document.querySelectorAll(".kpi-value").forEach((el) => {
    el.classList.add("skeleton");
    el.style.color = "transparent";
  });
}

/**
 * Скрыть скелетоны
 */
function hideSkeletons() {
  document.querySelectorAll(".kpi-value").forEach((el) => {
    el.classList.remove("skeleton");
    el.style.color = "";
  });
}

/**
 * Рендеринг графиков
 * @param {object} data - Данные для графиков
 */
function renderCharts(data) {
  // График динамики заявок (линейный)
  const timelineCtx = document
    .getElementById("chart-timeline")
    .getContext("2d");

  if (timelineChart) {
    timelineChart.destroy();
  }

  timelineChart = new Chart(timelineCtx, {
    type: "line",
    data: {
      labels: data.last_7_days.map((d) => d.date),
      datasets: [
        {
          label: "Новые заявки",
          data: data.last_7_days.map((d) => d.count),
          borderColor: "#2563EB",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#2563EB",
          pointBorderColor: "white",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  // График категорий (круговая диаграмма)
  const categoriesCtx = document
    .getElementById("chart-categories")
    .getContext("2d");

  if (categoriesChart) {
    categoriesChart.destroy();
  }

  categoriesChart = new Chart(categoriesCtx, {
    type: "doughnut",
    data: {
      labels: ["Освещение", "Дороги", "Мусор", "Другое"],
      datasets: [
        {
          data: [
            data.requests_by_category.lighting,
            data.requests_by_category.pothole,
            data.requests_by_category.garbage,
            data.requests_by_category.other,
          ],
          backgroundColor: ["#2563EB", "#F59E0B", "#10B981", "#8B5CF6"],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
          },
        },
      },
      cutout: "70%",
    },
  });
}

/**
 * Инициализация карты горячих точек
 */
async function initHotspotMap() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const hotspots = getMockHotspots();

    hotspotMap = L.map("hotspot-map").setView([51.18, 71.45], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(hotspotMap);

    // Тепловая карта
    const heatData = hotspots.map((h) => [h.lat, h.lng, h.count / 5]);
    L.heatLayer(heatData, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.2: "#3B82F6",
        0.4: "#F59E0B",
        0.6: "#EF4444",
      },
    }).addTo(hotspotMap);

    // Кластеризованные маркеры
    const markers = L.markerClusterGroup();

    hotspots.forEach((h) => {
      let color = "#3B82F6";
      if (h.count > 10) color = "#EF4444";
      else if (h.count > 5) color = "#F59E0B";

      const markerIcon = L.divIcon({
        html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>`,
        className: "hotspot-marker",
        iconSize: [22, 22],
        popupAnchor: [0, -11],
      });

      const marker = L.marker([h.lat, h.lng], { icon: markerIcon });
      marker.bindPopup(`
                <b>Горячая точка</b><br>
                Обращений: ${h.count}<br>
                Категория: ${h.category}
            `);

      markers.addLayer(marker);
    });

    hotspotMap.addLayer(markers);

    // Легенда
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function (map) {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "white";
      div.style.padding = "12px 16px";
      div.style.borderRadius = "12px";
      div.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      div.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px;">Уровень обращений</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #EF4444; border-radius: 50%;"></span>
                    <span>Высокий (>10)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #F59E0B; border-radius: 50%;"></span>
                    <span>Средний (5-10)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #3B82F6; border-radius: 50%;"></span>
                    <span>Низкий (<5)</span>
                </div>
            `;
      return div;
    };
    legend.addTo(hotspotMap);
  } catch (error) {
    console.error("Error loading hotspot map:", error);
  }
}

/**
 * Загрузка списка заявок
 */
async function loadRequests() {
  const tbody = document.getElementById("requests-table-body");
  tbody.innerHTML =
    '<tr><td colspan="9" style="text-align: center; padding: 48px;">⏳ Загрузка заявок...</td></tr>';

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    requestsData = getMockRequests();

    renderRequestsTable(requestsData);
  } catch (error) {
    console.error("Error loading requests:", error);
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align: center; padding: 48px; color: var(--danger);">❌ Ошибка загрузки заявок</td></tr>';
  }
}

/**
 * Рендеринг таблицы заявок
 * @param {Array} requests - Массив заявок
 */
function renderRequestsTable(requests) {
  const tbody = document.getElementById("requests-table-body");

  if (!requests || requests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align: center; padding: 48px;">📭 Нет заявок</td></tr>';
    return;
  }

  // Сортировка
  const sortedRequests = sortData(
    requests,
    currentSortColumn,
    currentSortDirection,
  );

  tbody.innerHTML = sortedRequests
    .map(
      (req) => `
        <tr>
            <td>#${req.id}</td>
            <td>
                <span class="category-badge">
                    ${getCategoryIcon(req.category)} ${getCategoryName(req.category)}
                </span>
            </td>
            <td>${req.address.substring(0, 30)}${req.address.length > 30 ? "…" : ""}</td>
            <td><span class="badge badge-${req.status}">${getStatusText(req.status)}</span></td>
            <td><span class="priority-badge priority-${req.priority}">${getPriorityText(req.priority)}</span></td>
            <td>${req.citizen_name}</td>
            <td>${req.worker_name || '<span style="color: var(--gray-400);">Не назначен</span>'}</td>
            <td>${formatDate(req.created_at)}</td>
            <td>
                ${
                  req.status === "pending"
                    ? `<button class="btn btn-small btn-primary" onclick="openAssignModal(${req.id})">Назначить</button>`
                    : `<button class="btn btn-small btn-outline" onclick="viewRequest(${req.id})">👁️</button>`
                }
            </td>
        </tr>
    `,
    )
    .join("");
}

/**
 * Загрузка данных исполнителей
 */
async function loadWorkers() {
  const tbody = document.getElementById("workers-table-body");
  tbody.innerHTML =
    '<tr><td colspan="6" style="text-align: center; padding: 48px;">⏳ Загрузка данных...</td></tr>';

  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    workersData = getMockWorkers();

    renderWorkersTable(workersData);
  } catch (error) {
    console.error("Error loading workers:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; padding: 48px; color: var(--danger);">❌ Ошибка загрузки данных</td></tr>';
  }
}

/**
 * Рендеринг таблицы исполнителей
 * @param {Array} workers - Массив исполнителей
 */
function renderWorkersTable(workers) {
  const tbody = document.getElementById("workers-table-body");

  if (!workers || workers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; padding: 48px;">📭 Нет данных</td></tr>';
    return;
  }

  tbody.innerHTML = workers
    .map(
      (w) => `
        <tr>
            <td style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 32px; height: 32px; background: var(--gray-200); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    ${w.avatar || "👨‍🔧"}
                </span>
                ${w.name}
            </td>
            <td>${w.total_assigned}</td>
            <td>${w.total_completed}</td>
            <td><span style="color: ${w.completion_rate > 90 ? "#10B981" : "#F59E0B"}; font-weight: 600;">${w.completion_rate}%</span></td>
            <td>${w.avg_time} ч</td>
            <td>
                <span style="color: #FFB800;">${"★".repeat(Math.floor(w.rating))}${"☆".repeat(5 - Math.floor(w.rating))}</span>
                <span style="margin-left: 4px; font-weight: 600;">${w.rating.toFixed(1)}</span>
            </td>
        </tr>
    `,
    )
    .join("");
}

/**
 * Сортировка таблицы
 * @param {string} column - Колонка для сортировки
 */
function sortTable(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
  } else {
    currentSortColumn = column;
    currentSortDirection = "asc";
  }

  renderRequestsTable(requestsData);
}

/**
 * Сортировка таблицы исполнителей
 */
function sortWorkers(column) {
  // Аналогичная логика для таблицы исполнителей
  console.log("Sort workers by:", column);
}

/**
 * Сортировка данных
 * @param {Array} data - Массив данных
 * @param {string} column - Колонка
 * @param {string} direction - Направление
 * @returns {Array} Отсортированный массив
 */
function sortData(data, column, direction) {
  return [...data].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    if (column === "created_at") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (direction === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

/**
 * Открыть модальное окно назначения исполнителя
 * @param {number} requestId - ID заявки
 */
function openAssignModal(requestId) {
  const modal = document.getElementById("assignModal");
  const content = document.getElementById("assignModalContent");

  // Получаем список доступных исполнителей
  const availableWorkers = workersData.length ? workersData : getMockWorkers();

  content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p><strong>Заявка #${requestId || "1001"}</strong></p>
            <p style="color: var(--gray-500); font-size: 0.875rem; margin-top: 4px;">
                Выберите исполнителя для назначения
            </p>
        </div>
        
        <div class="form-group">
            <label for="workerSelect">Исполнитель</label>
            <select id="workerSelect" class="input">
                <option value="">Выберите исполнителя</option>
                ${availableWorkers
                  .map(
                    (w) => `
                    <option value="${w.id}">${w.name} (${w.total_completed} вып.)</option>
                `,
                  )
                  .join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label for="deadline">Дедлайн</label>
            <input type="date" id="deadline" class="input" value="${getDefaultDeadline()}">
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button onclick="assignWorker(${requestId || 1001})" class="btn btn-primary" style="flex: 1;">Назначить</button>
            <button onclick="closeAssignModal()" class="btn btn-outline" style="flex: 1;">Отмена</button>
        </div>
    `;

  modal.style.display = "flex";
}

/**
 * Закрыть модальное окно назначения
 */
function closeAssignModal() {
  document.getElementById("assignModal").style.display = "none";
}

/**
 * Назначить исполнителя на заявку
 * @param {number} requestId - ID заявки
 */
async function assignWorker(requestId) {
  const workerSelect = document.getElementById("workerSelect");
  const workerId = workerSelect.value;
  const deadline = document.getElementById("deadline").value;

  if (!workerId) {
    alert("Выберите исполнителя");
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    alert(`✅ Исполнитель назначен на заявку #${requestId}`);
    closeAssignModal();

    // Обновляем таблицу
    loadRequests();
  } catch (error) {
    console.error("Error assigning worker:", error);
    alert("❌ Ошибка при назначении исполнителя");
  }
}

/**
 * Просмотр деталей заявки
 */
function viewRequest(requestId) {
  alert(`Просмотр заявки #${requestId} (будет реализовано в модальном окне)`);
}

/**
 * Инициализация навигации (переключение секций)
 */
function initNavigation() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Убираем активный класс у всех пунктов
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });

      // Добавляем активный класс текущему пункту
      this.classList.add("active");

      // Скрываем все секции
      document.getElementById("dashboard-section").style.display = "none";
      document.getElementById("map-section").style.display = "none";
      document.getElementById("requests-section").style.display = "none";
      document.getElementById("workers-section").style.display = "none";

      // Показываем нужную секцию
      const section = this.dataset.section;
      if (section === "dashboard") {
        document.getElementById("dashboard-section").style.display = "block";
      } else if (section === "map") {
        document.getElementById("map-section").style.display = "block";
        // Перерисовываем карту если нужно
        setTimeout(() => {
          if (hotspotMap) hotspotMap.invalidateSize();
        }, 100);
      } else if (section === "requests") {
        document.getElementById("requests-section").style.display = "block";
      } else if (section === "workers") {
        document.getElementById("workers-section").style.display = "block";
      }
    });
  });
}

/**
 * Мок-данные для дашборда
 */
function getMockDashboardData() {
  return {
    total_requests: 1247,
    pending_requests: 45,
    in_progress: 156,
    completed_today: 89,
    overdue: 12,
    avg_completion_time_hours: 18.5,
    sla_compliance_rate: 0.87,
    requests_by_category: {
      lighting: 234,
      garbage: 456,
      pothole: 678,
      other: 155,
    },
    last_7_days: [
      { date: "12.02", count: 15 },
      { date: "13.02", count: 22 },
      { date: "14.02", count: 18 },
      { date: "15.02", count: 25 },
      { date: "16.02", count: 30 },
      { date: "17.02", count: 28 },
      { date: "18.02", count: 35 },
    ],
  };
}

/**
 * Мок-данные для заявок
 */
function getMockRequests() {
  return [
    {
      id: 1001,
      category: "lighting",
      address: "ул. Ленина, д. 15",
      status: "pending",
      priority: "medium",
      citizen_name: "Иван Петров",
      worker_name: null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 1002,
      category: "pothole",
      address: "ул. Пушкина, д. 10",
      status: "in_progress",
      priority: "high",
      citizen_name: "Мария Соколова",
      worker_name: "Алексей Смирнов",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 1003,
      category: "garbage",
      address: "пр. Мира, д. 5",
      status: "completed",
      priority: "low",
      citizen_name: "Сергей Козлов",
      worker_name: "Иван Петров",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Мок-данные для работников
 */
function getMockWorkers() {
  return [
    {
      id: 5,
      name: "Иван Петров",
      avatar: "👨‍🔧",
      total_assigned: 150,
      total_completed: 142,
      completion_rate: 94.7,
      avg_time: 16.2,
      rating: 4.8,
    },
    {
      id: 6,
      name: "Алексей Смирнов",
      avatar: "👷",
      total_assigned: 110,
      total_completed: 98,
      completion_rate: 89.1,
      avg_time: 18.5,
      rating: 4.5,
    },
    {
      id: 7,
      name: "Сергей Иванов",
      avatar: "👩‍🔧",
      total_assigned: 220,
      total_completed: 210,
      completion_rate: 95.5,
      avg_time: 14.3,
      rating: 4.9,
    },
  ];
}

/**
 * Мок-данные для горячих точек
 */
function getMockHotspots() {
  return [
    { lat: 51.18, lng: 71.45, count: 15, category: "pothole" },
    { lat: 51.19, lng: 71.46, count: 8, category: "lighting" },
    { lat: 51.17, lng: 71.44, count: 12, category: "garbage" },
    { lat: 51.2, lng: 71.47, count: 5, category: "other" },
    { lat: 51.16, lng: 71.43, count: 10, category: "lighting" },
  ];
}

/**
 * Получить иконку категории
 */
function getCategoryIcon(category) {
  const icons = {
    lighting: "💡",
    garbage: "🗑️",
    pothole: "🕳️",
    other: "🔧",
  };
  return icons[category] || "📌";
}

/**
 * Получить название категории
 */
function getCategoryName(category) {
  const names = {
    lighting: "Освещение",
    garbage: "Мусор",
    pothole: "Дороги",
    other: "Другое",
  };
  return names[category] || category;
}

/**
 * Получить текст статуса
 */
function getStatusText(status) {
  const map = {
    pending: "Ожидает",
    assigned: "Назначено",
    in_progress: "В работе",
    completed: "Выполнено",
    approved: "Принято",
    rejected: "Отклонено",
  };
  return map[status] || status;
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
 * Форматирование даты
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU");
}

/**
 * Получить дефолтный дедлайн (завтра)
 */
function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

// Экспорт функций в глобальную область
window.initAdminPage = initAdminPage;
window.loadRequests = loadRequests;
window.loadWorkers = loadWorkers;
window.sortTable = sortTable;
window.sortWorkers = sortWorkers;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.assignWorker = assignWorker;
window.viewRequest = viewRequest;
