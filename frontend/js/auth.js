// ===== AUTH.JS - Полная система аутентификации =====

// Базовый URL API - using relative path which will be proxied by Vite to backend
const API_BASE_URL = '';

/**
 * Функция входа в систему
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 */
async function login(email, password) {
  try {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка входа');
    }

    const data = await response.json();
    
    // Сохраняем токен и данные пользователя в localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Перенаправляем согласно роли пользователя
    redirectByRole(data.user.role);
  } catch (error) {
    console.error("Login error:", error);
    alert(`Ошибка входа: ${error.message}`);
  }
}

/**
 * Функция регистрации нового пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 * @param {string} full_name - Полное имя
 * @param {string} phone - Телефон
 * @param {string} role - Роль (citizen/worker/admin)
 */
async function register(email, password, full_name, phone, role = 'citizen') {
  try {
    const response = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name, phone, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка регистрации');
    }

    const data = await response.json();
    
    // Сохраняем токен и данные пользователя в localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Перенаправляем согласно роли пользователя
    redirectByRole(data.user.role);
  } catch (error) {
    console.error("Registration error:", error);
    alert(`Ошибка регистрации: ${error.message}`);
  }
}

/**
 * Выход из системы
 */
function logout() {
  localStorage.clear();
  window.location.href = "../login.html";
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
    window.location.href = "../login.html";
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
    citizen: "../citizen.html",
    worker: "../worker.html",
    admin: "../admin.html",
  };

  window.location.href = pages[role] || "../citizen.html";
}

/**
 * Получить заголовки авторизации для fetch
 * @returns {object} Headers объект
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
}

// Экспортируем функции в глобальную область
window.login = login;
window.register = register;
window.logout = logout;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.decodeToken = decodeToken;
window.redirectByRole = redirectByRole;
window.getAuthHeaders = getAuthHeaders;
