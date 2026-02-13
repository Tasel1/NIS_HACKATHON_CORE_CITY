// ===== ADMIN.JS — Полная логика панели администратора =====

let dashboardData = null;
let requestsData = [];
let workersData = [];
let timelineChart = null;
let categoriesChart = null;
let analyticsChart = null;
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
  initSidebarToggle();
  initFloatingAssignButton();
}

/**
 * Загрузка данных дашборда
 */
async function loadDashboard() {
  // Показываем скелетоны
  showSkeletons();

  try {
    // Запрос к API для получения данных дашборда
    const response = await fetch('/api/analytics/dashboard', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    dashboardData = await response.json();

    // Обновляем KPI карточки
    document.getElementById("stat-total").textContent =
      dashboardData.total.toLocaleString();
    document.getElementById("stat-in-progress").textContent =
      dashboardData.in_progress;
    document.getElementById("stat-completed-today").textContent =
      dashboardData.completed_today;
    document.getElementById("stat-overdue").textContent = dashboardData.overdue || 0;

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
  // Графики теперь отображаются как статические изображения
  // Обновляем src изображений с актуальными данными
  updateStaticCharts(data || {});
}

/**
 * Обновление статических графиков с новыми данными
 * @param {object} data - Данные для графиков
 */
function updateStaticCharts(data) {
  // Обновляем изображение графика категорий
  const categoryImg = document.getElementById('chart-categories-img');
  if (categoryImg && data.by_category) {
    // Safely extract category data
    const categoriesMap = {};
    if (Array.isArray(data.by_category)) {
      data.by_category.forEach(cat => {
        categoriesMap[cat.category] = cat.count || 0;
      });
    }
    
    const lighting = categoriesMap.lighting || 0;
    const pothole = categoriesMap.pothole || 0;
    const garbage = categoriesMap.garbage || 0;
    const other = categoriesMap.other || 0;

    const maxVal = Math.max(lighting, pothole, garbage, other);
    const maxY = Math.ceil(maxVal * 1.2);

    // Создаем объект конфигурации диаграммы
    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['Освещение', 'Дороги', 'Мусор', 'Другое'],
        datasets: [{
          label: 'Количество заявок',
          data: [lighting, pothole, garbage, other],
          backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9']
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Заявки по категориям'
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: maxY,
            ticks: {
              stepSize: Math.ceil(maxY/5)
            }
          }
        }
      }
    };

    // Кодируем конфигурацию в формат URL
    const configJson = JSON.stringify(chartConfig);
    const encodedConfig = encodeURIComponent(configJson);

    categoryImg.src = `https://quickchart.io/chart?width=600&height=400&chart=${encodedConfig}`;
  }

  // Обновляем изображение графика аналитики
  const analyticsImg = document.getElementById('analytics-performance-img');
  if (analyticsImg && data.by_category) {
    // Safely extract category data
    const categoriesMap = {};
    if (Array.isArray(data.by_category)) {
      data.by_category.forEach(cat => {
        categoriesMap[cat.category] = cat.count || 0;
      });
    }
    
    const lighting = categoriesMap.lighting || 0;
    const pothole = categoriesMap.pothole || 0;
    const garbage = categoriesMap.garbage || 0;
    const other = categoriesMap.other || 0;

    // Создаем объект конфигурации диаграммы для аналитики
    const analyticsConfig = {
      type: 'bar',
      data: {
        labels: ['Освещение', 'Дороги', 'Мусор', 'Зеленые насаждения', 'Другое'],
        datasets: [
          {
            label: 'Выполнено заявок',
            data: [lighting, pothole, garbage, 156, other],
            backgroundColor: [
              'rgba(59,130,246,0.7)',
              'rgba(245,158,11,0.7)',
              'rgba(16,185,129,0.7)',
              'rgba(16,185,129,0.7)',
              'rgba(139,92,246,0.7)'
            ]
          },
          {
            label: 'Среднее время выполнения (часы)',
            data: [12.5, 22.3, 18.7, 15.2, 25.1],
            type: 'line',
            borderColor: 'rgb(239,68,68)',
            backgroundColor: 'rgba(239,68,68,0.5)',
            fill: false
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Эффективность по категориям заявок'
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Количество'
            }
          }
        }
      }
    };

    // Кодируем конфигурацию в формат URL
    const analyticsJson = JSON.stringify(analyticsConfig);
    const encodedAnalytics = encodeURIComponent(analyticsJson);

    analyticsImg.src = `https://quickchart.io/chart?width=600&height=400&chart=${encodedAnalytics}`;
  }
}

/**
 * Инициализация карты горячих точек
 */
async function initHotspotMap() {
  try {
    const response = await fetch('/api/analytics/hotspots', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const hotspots = await response.json();

    // Check if hotspots exist and have proper data
    if (!hotspots || !Array.isArray(hotspots) || hotspots.length === 0) {
      console.warn("No hotspot data available");
      return;
    }

    hotspotMap = L.map("hotspot-map").setView([51.18, 71.45], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(hotspotMap);

    // Prepare heat data, ensuring valid coordinates
    const heatData = hotspots
      .filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)))
      .map((h) => [parseFloat(h.lat), parseFloat(h.lng), (h.count || 1) / 5]);

    // Only add heat layer if there's valid data
    if (heatData.length > 0) {
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
    }

    // Кластеризованные маркеры
    const markers = L.markerClusterGroup();

    hotspots.forEach((h) => {
      // Validate coordinates before creating markers
      if (!h.lat || !h.lng || isNaN(parseFloat(h.lat)) || isNaN(parseFloat(h.lng))) {
        return; // Skip invalid coordinates
      }

      let color = "#3B82F6";
      if (h.count > 10) color = "#EF4444";
      else if (h.count > 5) color = "#F59E0B";

      const markerIcon = L.divIcon({
        html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>`,
        className: "hotspot-marker",
        iconSize: [22, 22],
        popupAnchor: [0, -11],
      });

      const marker = L.marker([parseFloat(h.lat), parseFloat(h.lng)], { icon: markerIcon });
      marker.bindPopup(`
                <b>Горячая точка</b><br>
                Обращений: ${h.count || 0}<br>
                Категория: ${h.category || 'Неизвестно'}
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
    const response = await fetch('/api/requests', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    requestsData = await response.json();

    renderRequestsTable(requestsData);

    // Сброс фильтров к начальному состоянию
    if (document.getElementById('requestStatusFilter')) {
      document.getElementById('requestStatusFilter').value = '';
    }
    if (document.getElementById('requestCategoryFilter')) {
      document.getElementById('requestCategoryFilter').value = '';
    }
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
    const response = await fetch('/api/analytics/workers', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    workersData = await response.json();

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
                ${w.full_name || w.name || w.email || "Исполнитель"}
            </td>
            <td>${w.assigned_count || w.total_assigned || 0}</td>
            <td>${w.completed_count || w.total_completed || 0}</td>
            <td><span style="color: ${((w.completion_rate || 0) > 90 ? "#10B981" : "#F59E0B")}; font-weight: 600;">${w.completion_rate || 0}%</span></td>
            <td>${w.avg_time_minutes || w.avg_time || 0} мин</td>
            <td>
                ${(() => {
                  // Handle the rating field properly
                  let ratingValue = 0;
                  if (w.rating != null && !isNaN(parseFloat(w.rating))) {
                    ratingValue = parseFloat(w.rating);
                  } else if (w.completion_rate != null && !isNaN(parseFloat(w.completion_rate))) {
                    // Calculate a rating based on completion rate if rating is not available
                    ratingValue = Math.min(5, Math.max(0, parseFloat(w.completion_rate) / 20)); // Scale 0-100% to 0-5 stars
                  }
                  
                  // Ensure ratingValue is a valid number
                  if (isNaN(ratingValue) || typeof ratingValue !== 'number') {
                    ratingValue = 0;
                  }
                  
                  const ratingFloor = Math.max(0, Math.min(5, Math.floor(ratingValue)));
                  const stars = "★".repeat(ratingFloor);
                  const emptyStars = "☆".repeat(Math.max(0, 5 - ratingFloor));
                  return `
                  <span style="color: #FFB800;">${stars}${emptyStars}</span>
                  <span style="margin-left: 4px; font-weight: 600;">${ratingValue.toFixed(1)}</span>
                  `;
                })()}
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
async function openAssignModal(requestId) {
  const modal = document.getElementById("assignModal");
  const content = document.getElementById("assignModalContent");

  // Показываем индикатор загрузки
  content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p><strong>Заявка #${requestId || "1001"}</strong></p>
            <p style="color: var(--gray-500); font-size: 0.875rem; margin-top: 4px;">
                Загрузка списка исполнителей...
            </p>
        </div>
        <div style="text-align: center; padding: 20px;">⏳</div>
    `;

  modal.style.display = "flex";

  try {
    // Загружаем список исполнителей (пользователей с ролью worker)
    const response = await fetch('/api/users?role=worker', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const workers = await response.json();
    
    // Фильтруем только пользователей с ролью worker
    const availableWorkers = Array.isArray(workers) ? 
      workers.map(w => ({ id: w.id, name: w.full_name || w.email })) : 
      [];

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
                    <option value="${w.id}">${w.name}</option>
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
  } catch (error) {
    console.error("Error loading workers:", error);
    
    // В случае ошибки, используем резервный вариант с данными из таблицы исполнителей
    try {
      // Попробуем использовать данные из уже загруженного workersData
      const availableWorkers = workersData && Array.isArray(workersData) ? 
        workersData.map(w => ({ id: w.id, name: w.name })) : 
        [];
      
      if (availableWorkers.length > 0) {
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
                        <option value="${w.id}">${w.name}</option>
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
      } else {
        // Если нет данных, покажем сообщение об ошибке
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>Заявка #${requestId || "1001"}</strong></p>
                <p style="color: var(--danger); font-size: 0.875rem; margin-top: 4px;">
                    Не удалось загрузить список исполнителей
                </p>
            </div>
            
            <div class="form-group">
                <label for="workerSelect">Исполнитель</label>
                <select id="workerSelect" class="input" disabled>
                    <option value="">Нет доступных исполнителей</option>
                </select>
            </div>

            <div class="form-group">
                <label for="deadline">Дедлайн</label>
                <input type="date" id="deadline" class="input" value="${getDefaultDeadline()}" disabled>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-primary" style="flex: 1;" disabled>Назначить</button>
                <button onclick="closeAssignModal()" class="btn btn-outline" style="flex: 1;">Отмена</button>
            </div>
        `;
      }
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      // Финальный резервный вариант
      content.innerHTML = `
          <div style="margin-bottom: 20px;">
              <p><strong>Заявка #${requestId || "1001"}</strong></p>
              <p style="color: var(--danger); font-size: 0.875rem; margin-top: 4px;">
                  Ошибка загрузки списка исполнителей
              </p>
          </div>
          
          <div class="form-group">
              <label for="workerSelect">Исполнитель</label>
              <select id="workerSelect" class="input">
                  <option value="">Выберите исполнителя</option>
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
    }
  }
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
  const deadlineInput = document.getElementById("deadline");
  let deadline = deadlineInput.value;

  if (!workerId) {
    alert("Выберите исполнителя");
    return;
  }

  // Ensure deadline is properly formatted or null if not provided
  if (!deadline) {
    deadline = null; // Send null instead of undefined/empty string
  }

  try {
    const response = await fetch(`/api/requests/${requestId}/assign`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(), // Use spread operator to avoid overriding Content-Type
        'Content-Type': 'application/json' // Ensure correct content type for JSON
      },
      body: JSON.stringify({ workerId, deadline })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка при назначении исполнителя');
    }

    alert(`✅ Исполнитель назначен на заявку #${requestId}`);
    closeAssignModal();

    // Обновляем таблицу
    loadRequests();
  } catch (error) {
    console.error("Error assigning worker:", error);
    alert(`❌ Ошибка при назначении исполнителя: ${error.message}`);
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
      document.getElementById("analytics-section").style.display = "none";

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
        // Инициализируем фильтры для заявок
        initRequestFilters();
      } else if (section === "workers") {
        document.getElementById("workers-section").style.display = "block";
      } else if (section === "analytics") {
        // Сначала скрываем все другие секции
        document.getElementById("dashboard-section").style.display = "none";
        document.getElementById("map-section").style.display = "none";
        document.getElementById("requests-section").style.display = "none";
        document.getElementById("workers-section").style.display = "none";
        
        // Показываем только секцию аналитики
        document.getElementById("analytics-section").style.display = "block";
        // Статические изображения графиков обновляются через updateStaticCharts
      }
    });
  });
}

/**
 * Инициализация сворачивания сайдбара
 */
function initSidebarToggle() {
  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainContent = document.querySelector('.admin-main');
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('sidebar-collapsed');
      
      // Обновляем иконку
      const icon = this.querySelector('.toggle-icon');
      if (sidebar.classList.contains('collapsed')) {
        icon.textContent = '»';
      } else {
        icon.textContent = '«';
      }
    });
  }
}

/**
 * Инициализация плавающей кнопки назначения исполнителя
 */
function initFloatingAssignButton() {
  const floatingBtn = document.getElementById('floating-assign-btn');

  if (floatingBtn) {
    floatingBtn.addEventListener('click', function() {
      // Показываем модальное окно выбора заявки для назначения
      showRequestSelectionModal();
    });
  }
}

/**
 * Инициализация фильтров для заявок
 */
function initRequestFilters() {
  // Добавляем обработчики для фильтров
  const statusFilter = document.getElementById('requestStatusFilter');
  const categoryFilter = document.getElementById('requestCategoryFilter');

  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      applyRequestFilters();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      applyRequestFilters();
    });
  }
}

/**
 * Применить фильтры к заявкам
 */
function applyRequestFilters() {
  const statusFilter = document.getElementById('requestStatusFilter').value;
  const categoryFilter = document.getElementById('requestCategoryFilter').value;

  let filteredRequests = [...requestsData];

  // Фильтрация по статусу
  if (statusFilter) {
    filteredRequests = filteredRequests.filter(request => 
      !statusFilter || request.status === statusFilter
    );
  }

  // Фильтрация по категории
  if (categoryFilter) {
    filteredRequests = filteredRequests.filter(request => 
      !categoryFilter || request.category === categoryFilter
    );
  }

  // Рендерим отфильтрованные заявки
  renderRequestsTable(filteredRequests);
}

/**
 * Показать модальное окно выбора заявки для назначения исполнителя
 */
function showRequestSelectionModal() {
  // Фильтруем заявки, которые можно назначить (статус pending или assigned)
  const assignableRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'assigned');

  // Создаем модальное окно для выбора заявки
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'requestSelectionModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;

  let requestOptions = '';
  if (assignableRequests.length > 0) {
    requestOptions = assignableRequests.map(req => `
      <div class="request-option" data-request-id="${req.id}" style="
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        background: white;
      ">
        <strong>#${req.id}</strong> - ${req.category} | ${req.address.substring(0, 50)}${req.address.length > 50 ? '...' : ''}
        <span style="float: right; background: #e2e8f0; padding: 2px 8px; border-radius: 20px; font-size: 0.8em;">
          ${req.status}
        </span>
      </div>
    `).join('');
  } else {
    requestOptions = '<div style="padding: 20px; text-align: center; color: #666;">Нет заявок для назначения</div>';
  }

  modal.innerHTML = `
    <div class="modal-content" style="
      background: white;
      padding: 24px;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    ">
      <h3 style="margin-top: 0;">Выберите заявку для назначения исполнителя</h3>
      <div class="requests-list">
        ${requestOptions}
      </div>
      <div style="margin-top: 20px; text-align: right;">
        <button onclick="closeRequestSelectionModal()" class="btn btn-outline">Отмена</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Добавляем обработчики для выбора заявки
  document.querySelectorAll('.request-option').forEach(option => {
    option.addEventListener('click', function() {
      const requestId = parseInt(this.dataset.requestId);
      closeRequestSelectionModal();
      openAssignModal(requestId); // Открываем модальное окно назначения для выбранной заявки
    });
  });
}

/**
 * Закрыть модальное окно выбора заявки
 */
function closeRequestSelectionModal() {
  const modal = document.getElementById('requestSelectionModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Инициализация графика аналитики
 */
function initAnalyticsChart() {
  const ctx = document.getElementById('analytics-performance');
  if (!ctx) return;
  
  // Уничтожаем существующий экземпляр графика, если он есть
  if (analyticsChart) {
    analyticsChart.destroy();
  }
  
  // Данные для графика эффективности
  const data = {
    labels: ['Освещение', 'Дороги', 'Мусор', 'Зеленые насаждения', 'Другое'],
    datasets: [
      {
        label: 'Выполнено заявок',
        data: [234, 456, 321, 156, 80],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)',
          'rgb(16, 185, 129)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      },
      {
        label: 'Среднее время выполнения (часы)',
        data: [12.5, 22.3, 18.7, 15.2, 25.1],
        type: 'line',
        fill: false,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.2,
        yAxisID: 'y1'
      }
    ]
  };
  
  // Опции графика
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Эффективность по категориям заявок'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 500, // Фиксированный максимум для оси Y
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        title: {
          display: true,
          text: 'Количество заявок'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 30, // Фиксированный максимум для оси Y1
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Время (часы)'
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 0 // Отключаем анимацию для статичного вида
    }
  };
  
  // Создаем график
  analyticsChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: options
  });
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

/**
 * Функция экспорта данных
 */
function exportData() {
  const activeSection = document.querySelector('.nav-item.active').dataset.section;
  
  switch(activeSection) {
    case 'dashboard':
      exportDashboardData();
      break;
    case 'requests':
      exportRequestsData();
      break;
    case 'workers':
      exportWorkersData();
      break;
    case 'analytics':
      exportAnalyticsData();
      break;
    case 'map':
      exportMapData();
      break;
    default:
      exportDashboardData();
  }
}

/**
 * Экспорт данных дашборда
 */
function exportDashboardData() {
  const data = {
    total_requests: document.getElementById("stat-total").textContent,
    in_progress: document.getElementById("stat-in-progress").textContent,
    completed_today: document.getElementById("stat-completed-today").textContent,
    overdue: document.getElementById("stat-overdue").textContent,
    export_date: new Date().toLocaleString('ru-RU')
  };
  
  downloadJSON(data, 'dashboard_export');
}

/**
 * Экспорт данных заявок
 */
function exportRequestsData() {
  const tableRows = document.querySelectorAll('#requests-table-body tr');
  const data = [];
  
  tableRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      data.push({
        id: cells[0].textContent,
        category: cells[1].textContent,
        address: cells[2].textContent,
        status: cells[3].textContent,
        priority: cells[4].textContent,
        citizen: cells[5].textContent,
        worker: cells[6].textContent,
        created_at: cells[7].textContent
      });
    }
  });
  
  downloadCSV(data, 'requests_export');
}

/**
 * Экспорт данных исполнителей
 */
function exportWorkersData() {
  const tableRows = document.querySelectorAll('#workers-table-body tr');
  const data = [];
  
  tableRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      data.push({
        name: cells[0].textContent.replace(/\s+/g, ' ').trim(),
        assigned: cells[1].textContent,
        completed: cells[2].textContent,
        rate: cells[3].textContent,
        avg_time: cells[4].textContent,
        rating: cells[5].textContent
      });
    }
  });
  
  downloadCSV(data, 'workers_export');
}

/**
 * Экспорт аналитических данных
 */
function exportAnalyticsData() {
  const data = {
    export_date: new Date().toLocaleString('ru-RU')
  };
  
  downloadJSON(data, 'analytics_export');
}

/**
 * Экспорт данных карты
 */
function exportMapData() {
  const data = {
    map_center: hotspotMap ? hotspotMap.getCenter() : null,
    zoom_level: hotspotMap ? hotspotMap.getZoom() : null,
    export_date: new Date().toLocaleString('ru-RU')
  };
  
  downloadJSON(data, 'map_export');
}

/**
 * Скачать JSON файл
 */
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Скачать CSV файл
 */
function downloadCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
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
window.exportData = exportData;
