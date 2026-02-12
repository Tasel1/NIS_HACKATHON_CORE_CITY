// ===== CITIZEN.JS — Полная логика интерфейса жителя =====

// Глобальные переменные
let allRequests = [];
let currentFilter = "all";
let map = null;
let marker = null;

/**
 * Инициализация страницы жителя
 */
function initCitizenPage() {
  // Загружаем заявки
  loadMyRequests();

  // Инициализация формы
  initRequestForm();

  // Инициализация фильтров
  initFilters();
}

/**
 * Загрузить заявки текущего пользователя
 * @param {string} filter - Фильтр по статусу
 */
async function loadMyRequests(filter = "all") {
  currentFilter = filter;

  const requestsList = document.getElementById("requests-list");
  requestsList.innerHTML =
    '<div class="text-center" style="grid-column: 1/-1; padding: 48px;">⏳ Загрузка заявок...</div>';

  try {
    // Имитация API-запроса
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Получаем текущего пользователя
    const user = getCurrentUser();
    if (!user) return;

    // Мок-данные для демонстрации
    allRequests = getMockRequests(user.id);

    // Применяем фильтр
    let filteredRequests = allRequests;
    if (filter !== "all") {
      filteredRequests = allRequests.filter((req) => req.status === filter);
    }

    // Рендерим карточки
    renderRequests(filteredRequests);
  } catch (error) {
    console.error("Error loading requests:", error);
    requestsList.innerHTML =
      '<div class="text-center" style="grid-column: 1/-1; padding: 48px; color: var(--danger);">❌ Ошибка загрузки заявок</div>';
  }
}

/**
 * Рендеринг списка заявок
 * @param {Array} requests - Массив заявок
 */
function renderRequests(requests) {
  const requestsList = document.getElementById("requests-list");

  if (!requests || requests.length === 0) {
    requestsList.innerHTML =
      '<div class="text-center" style="grid-column: 1/-1; padding: 48px; color: var(--gray-500);">📭 У вас пока нет заявок</div>';
    return;
  }

  requestsList.innerHTML = requests
    .map((request) => renderRequestCard(request))
    .join("");
}

/**
 * Рендеринг одной карточки заявки
 * @param {object} request - Объект заявки
 * @returns {string} HTML карточки
 */
function renderRequestCard(request) {
  const categoryIcons = {
    lighting: "💡",
    garbage: "🗑️",
    pothole: "🕳️",
    other: "🔧",
  };

  const icon = categoryIcons[request.category] || "📌";
  const date = formatRelativeTime(request.created_at);
  const descriptionShort =
    request.description.length > 50
      ? request.description.substring(0, 50) + "…"
      : request.description;

  return `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-header">
                <span class="badge badge-${request.status}">${getStatusText(request.status)}</span>
                <span class="category-icon">${icon}</span>
            </div>
            <h3 class="request-title">${descriptionShort}</h3>
            <div class="request-address">📍 ${request.address || "Адрес не указан"}</div>
            <div class="request-date">🕒 ${date}</div>
            ${renderStatusBar(request.status)}
            <button onclick="showRequestDetails(${request.id})" class="btn btn-secondary btn-small">Подробнее</button>
        </div>
    `;
}

/**
 * Рендеринг статус-бара (4 шага)
 * @param {string} status - Текущий статус
 * @returns {string} HTML статус-бара
 */
function renderStatusBar(status) {
  const steps = [
    { key: "pending", label: "Ожидает" },
    { key: "assigned", label: "Назначено" },
    { key: "in_progress", label: "В работе" },
    { key: "completed", label: "Выполнено" },
  ];

  let currentIndex = steps.findIndex((step) => step.key === status);
  if (status === "approved") currentIndex = 3;
  if (status === "rejected") currentIndex = 1;

  let html = '<div class="status-bar">';

  steps.forEach((step, index) => {
    let stepClass = "";
    let indicatorContent = "";

    if (index < currentIndex) {
      stepClass = "completed";
      indicatorContent = "✓";
    } else if (index === currentIndex) {
      stepClass = "active";
      indicatorContent = (index + 1).toString();
    } else {
      indicatorContent = (index + 1).toString();
    }

    html += `
            <div class="status-step ${stepClass}">
                <div class="step-indicator">${indicatorContent}</div>
                <span>${step.label}</span>
            </div>
        `;
  });

  html += "</div>";
  return html;
}

/**
 * Получить текстовое представление статуса
 */
function getStatusText(status) {
  const statusMap = {
    pending: "Ожидает",
    assigned: "Назначено",
    in_progress: "В работе",
    completed: "Выполнено",
    approved: "Принято",
    rejected: "Отклонено",
  };
  return statusMap[status] || status;
}

/**
 * Форматирование относительного времени
 * @param {string} dateString - ISO дата
 * @returns {string} Относительное время
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHour < 24) return `${diffHour} ч назад`;
  if (diffDay < 7) return `${diffDay} дн назад`;

  return date.toLocaleDateString("ru-RU");
}

/**
 * Показать детали заявки в модалке
 * @param {number} requestId - ID заявки
 */
async function showRequestDetails(requestId) {
  const modal = document.getElementById("requestModal");
  const modalContent = document.getElementById("modalContent");

  modal.style.display = "flex";
  modalContent.innerHTML =
    '<div style="text-align: center; padding: 40px;">⏳ Загрузка...</div>';

  try {
    // Имитация API-запроса
    await new Promise((resolve) => setTimeout(resolve, 600));

    const request = allRequests.find((r) => r.id === requestId);
    if (!request) throw new Error("Request not found");

    // Формируем содержимое модалки
    let content = `
            <h2 style="margin-bottom: 16px;">Заявка #${request.id}</h2>
            <div style="margin-bottom: 24px;">
                <span class="badge badge-${request.status}">${getStatusText(request.status)}</span>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1rem; color: var(--gray-500); margin-bottom: 8px;">Категория</h3>
                <p style="font-weight: 600;">${request.category}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1rem; color: var(--gray-500); margin-bottom: 8px;">Адрес</h3>
                <p style="font-weight: 600;">${request.address}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1rem; color: var(--gray-500); margin-bottom: 8px;">Описание</h3>
                <p>${request.description}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1rem; color: var(--gray-500); margin-bottom: 8px;">Фотография проблемы</h3>
                <div class="photo-gallery">
                    <img src="${request.photos?.[0]?.url || "https://via.placeholder.com/300x200?text=Фото"}" alt="Problem photo">
                </div>
            </div>
            
            <div id="modalMap" style="height: 400px; width: 100%; margin-bottom: 24px;"></div>
        `;

    // Если заявка выполнена - показываем фото до/после и кнопки приёмки
    if (request.status === "completed") {
      content += `
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 1rem; color: var(--gray-500); margin-bottom: 8px;">Фотоотчёт</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 8px;">До</p>
                            <img src="https://via.placeholder.com/300x200?text=До" style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px;">
                        </div>
                        <div>
                            <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 8px;">После</p>
                            <img src="https://via.placeholder.com/300x200?text=После" style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px;">
                        </div>
                    </div>
                </div>
                
                <div class="approve-buttons">
                    <button onclick="approveWork(${request.id}, true)" class="btn btn-success btn-large" style="flex: 1;">✅ Принять работу</button>
                    <button onclick="approveWork(${request.id}, false)" class="btn btn-danger btn-large" style="flex: 1;">🔄 Отправить на доработку</button>
                </div>
            `;
    }

    modalContent.innerHTML = content;

    // Инициализируем карту
    setTimeout(() => {
      if (map) map.remove();
      map = L.map("modalMap").setView(
        [request.latitude || 51.18, request.longitude || 71.45],
        15,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      if (marker) marker.remove();
      marker = L.marker([
        request.latitude || 51.18,
        request.longitude || 71.45,
      ]).addTo(map);
      marker
        .bindPopup(`<b>Заявка #${request.id}</b><br>${request.address}`)
        .openPopup();
    }, 100);
  } catch (error) {
    console.error("Error loading request details:", error);
    modalContent.innerHTML =
      '<div style="text-align: center; padding: 40px; color: var(--danger);">❌ Ошибка загрузки деталей заявки</div>';
  }
}

/**
 * Принять/отклонить работу
 * @param {number} requestId - ID заявки
 * @param {boolean} approved - true = принять, false = отклонить
 */
async function approveWork(requestId, approved) {
  let comment = "";

  if (!approved) {
    comment = prompt("Укажите причину доработки:");
    if (comment === null) return; // Пользователь отменил
  }

  try {
    // Имитация API-запроса
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Обновляем статус в локальных данных
    const request = allRequests.find((r) => r.id === requestId);
    if (request) {
      request.status = approved ? "approved" : "in_progress";
    }

    // Показываем уведомление
    alert(
      approved ? "✅ Работа принята!" : "🔄 Заявка отправлена на доработку",
    );

    // Закрываем модалку и обновляем список
    closeModal();
    loadMyRequests(currentFilter);
  } catch (error) {
    console.error("Error approving work:", error);
    alert("❌ Ошибка при подтверждении работы");
  }
}

/**
 * Закрыть модальное окно
 */
function closeModal() {
  document.getElementById("requestModal").style.display = "none";
  if (map) {
    map.remove();
    map = null;
  }
}

/**
 * Инициализация формы создания заявки
 */
function initRequestForm() {
  const form = document.getElementById("requestForm");
  const photoInput = document.getElementById("photo");
  const uploadArea = document.getElementById("uploadArea");
  const preview = document.getElementById("photoPreview");
  const detectBtn = document.getElementById("detectLocationBtn");
  const addressInput = document.getElementById("address");
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");
  const descriptionInput = document.getElementById("description");
  const counter = document.getElementById("char-counter");

  // Счётчик символов
  descriptionInput.addEventListener("input", function () {
    counter.textContent = this.value.length;
  });

  // Клик по области загрузки
  uploadArea.addEventListener("click", () => photoInput.click());

  // Drag & Drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--primary)";
    uploadArea.style.background = "var(--primary-light)";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "var(--gray-300)";
    uploadArea.style.background = "var(--gray-50)";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--gray-300)";
    uploadArea.style.background = "var(--gray-50)";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      photoInput.files = files;
      handlePhotoPreview(files[0]);
    }
  });

  // Выбор файла
  photoInput.addEventListener("change", function () {
    if (this.files.length > 0) {
      handlePhotoPreview(this.files[0]);
    }
  });

  // Функция превью фото
  function handlePhotoPreview(file) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимальный размер — 5MB");
      return;
    }

    if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
      alert("Поддерживаются только JPEG и PNG");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      preview.style.display = "grid";
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }

  // Определение местоположения
  detectBtn.addEventListener("click", function () {
    if (!navigator.geolocation) {
      alert("Geolocation не поддерживается вашим браузером");
      return;
    }

    detectBtn.textContent = "📍 Определение...";
    detectBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        latInput.value = latitude;
        lngInput.value = longitude;

        try {
          const address = await reverseGeocode(latitude, longitude);
          addressInput.value = address;
        } catch (error) {
          addressInput.value = `${latitude}, ${longitude}`;
        }

        detectBtn.textContent = "📍 Определить";
        detectBtn.disabled = false;
      },
      (error) => {
        alert("Не удалось определить местоположение");
        detectBtn.textContent = "📍 Определить";
        detectBtn.disabled = false;
      },
    );
  });

  // Обработка отправки формы
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Валидация
    const category = document.getElementById("category").value;
    const description = descriptionInput.value.trim();
    const photo = photoInput.files[0];
    const address = addressInput.value.trim();
    const lat = latInput.value;
    const lng = lngInput.value;

    if (!category) {
      alert("Выберите категорию");
      return;
    }

    if (description.length < 10) {
      alert("Описание должно содержать минимум 10 символов");
      return;
    }

    if (!photo) {
      alert("Добавьте фотографию проблемы");
      return;
    }

    if (!address) {
      alert("Укажите адрес");
      return;
    }

    if (!lat || !lng) {
      alert("Определите местоположение на карте");
      return;
    }

    // Имитация отправки
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "⏳ Отправка...";
    submitBtn.disabled = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Создаём новую заявку в мок-данных
      const user = getCurrentUser();
      const newRequest = {
        id: Date.now(),
        citizen_id: user.id,
        category: category,
        description: description,
        address: address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        status: "pending",
        created_at: new Date().toISOString(),
        photos: [{ url: URL.createObjectURL(photo) }],
      };

      allRequests.unshift(newRequest);

      // Очищаем форму
      form.reset();
      preview.style.display = "none";
      preview.innerHTML = "";
      counter.textContent = "0";

      // Обновляем список
      loadMyRequests(currentFilter);

      alert("✅ Заявка успешно отправлена!");
    } catch (error) {
      console.error("Error creating request:", error);
      alert("❌ Ошибка при отправке заявки");
    } finally {
      submitBtn.textContent = "📨 Отправить заявку";
      submitBtn.disabled = false;
    }
  });
}

/**
 * Инициализация фильтров
 */
function initFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filter = this.dataset.filter;
      loadMyRequests(filter);
    });
  });
}

/**
 * Обратное геокодирование через Nominatim
 * @param {number} lat - Широта
 * @param {number} lng - Долгота
 * @returns {Promise<string>} Адрес
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`,
      {
        headers: {
          "User-Agent": "CoreCity/1.0",
        },
      },
    );
    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return `${lat}, ${lng}`;
  }
}

/**
 * Мок-данные для демонстрации
 */
function getMockRequests(userId) {
  return [
    {
      id: 1001,
      citizen_id: userId,
      category: "lighting",
      description: "Не горит фонарь на углу дома 15, очень темно и небезопасно",
      address: "ул. Ленина, д. 15",
      latitude: 51.18,
      longitude: 71.45,
      status: "pending",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/300x200?text=Фонарь" }],
    },
    {
      id: 1002,
      citizen_id: userId,
      category: "pothole",
      description: "Глубокая яма во дворе, машины задевают дно",
      address: "ул. Пушкина, д. 10",
      latitude: 51.19,
      longitude: 71.46,
      status: "in_progress",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/300x200?text=Яма" }],
    },
    {
      id: 1003,
      citizen_id: userId,
      category: "garbage",
      description: "Не вывозят мусор уже неделю, контейнеры переполнены",
      address: "пр. Мира, д. 5",
      latitude: 51.17,
      longitude: 71.44,
      status: "completed",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      photos: [{ url: "https://via.placeholder.com/300x200?text=Мусор" }],
    },
  ];
}

// Экспорт функций в глобальную область
window.initCitizenPage = initCitizenPage;
window.loadMyRequests = loadMyRequests;
window.showRequestDetails = showRequestDetails;
window.approveWork = approveWork;
window.closeModal = closeModal;
