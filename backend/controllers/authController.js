// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// --- РЕГИСТРАЦИЯ ---
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // 1. Базовая валидация (можно вынести в middleware, но для простоты здесь)
    if (!email || !password || !full_name || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }
    // Роль по умолчанию — citizen, если не указана
    const userRole = role || "citizen";
    const allowedRoles = ["citizen", "worker", "admin"];
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 2. Проверка уникальности email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // 3. Создание пользователя (points по умолчанию 0)
    const newUser = await User.create({
      email,
      password,
      full_name,
      phone,
      role: userRole,
      points: 0,
    });

    // 4. Генерация JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 5. Ответ (без password_hash)
    res.status(201).json({
      token,
      user: newUser,
    });
  } catch (err) {
    next(err); // передаём ошибку в глобальный обработчик
  }
};

// --- ЛОГИН ---
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 1. Поиск пользователя по email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Проверка пароля
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Генерация токена
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 4. Убираем hash из ответа
    const { password_hash, ...userWithoutHash } = user;

    res.json({
      token,
      user: userWithoutHash,
    });
  } catch (err) {
    next(err);
  }
};

// --- ПРОФИЛЬ (требует verifyToken) ---
const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
