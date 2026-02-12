// ===== AUTH.JS - Полная система аутентификации =====

// Базовый URL API (заглушка, будет заменён при подключении бэкенда)
const API_BASE_URL = "http://localhost:3000/api";

/**
 * Функция входа в систему
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 * @param {string} role - Роль (citizen/worker/admin)
 */
function login(email, password, role) {
  // Имитация запроса к API
  console.log("Login attempt:", { email, password, role });

  // Создаём фейковый JWT токен (base64 encoded)
  const payload = {
    id: role === "citizen" ? 1 : role === "worker" ? 5 : 10,
    email: email,
    role: role,
    exp: Date.now() + 86400000, // 24 часа
    iat: Date.now(),
  };

  // Кодируем в base64 (имитация JWT)
  const token = btoa(JSON.stringify(payload));

  // Создаём объект пользователя
  const user = {
    id: payload.id,
    email: email,
    role: role,
    full_name: email.split("@")[0] || "Пользователь",
    phone: "+7 (999) 123-45-67",
    points: role === "citizen" ? 245 : 0,
  };

  // Сохраняем в localStorage
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  // Перенаправляем согласно роли
  redirectByRole(role);
}

/**
 * Выход из системы
 */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

/**
 * Получить токен из localStorage
 * @returns {string|null} JWT токен
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Получить текущего пользователя
 * @returns {object|null} Объект пользователя
 */
function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

/**
 * Декодировать JWT токен (без проверки подписи)
 * @returns {object|null} Декодированный payload
 */
function decodeToken() {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT состоит из header.payload.signature
    // Мы просто декодируем payload (base64)
    const payload = JSON.parse(atob(token));
    return payload;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}

/**
 * Проверка аутентификации
 * Если нет токена - редирект на login.html
 */
function requireAuth() {
  if (!getToken() || !getCurrentUser()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/**
 * Перенаправление по роли
 * @param {string} role - Роль пользователя
 */
function redirectByRole(role) {
  const pages = {
    citizen: "citizen.html",
    worker: "worker.html",
    admin: "admin.html",
  };

  window.location.href = pages[role] || "citizen.html";
}

/**
 * Получить заголовки авторизации для fetch
 * @returns {object} Headers объект
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Экспортируем функции в глобальную область
window.login = login;
window.logout = logout;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.decodeToken = decodeToken;
window.redirectByRole = redirectByRole;
window.getAuthHeaders = getAuthHeaders;
