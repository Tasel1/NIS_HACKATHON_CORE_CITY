// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");

// Настройка хранилища
const storage = multer.diskStorage({
  destination: "./uploads/", // папка для сохранения
  filename: (req, file, cb) => {
    // Генерируем уникальное имя: userId_время_случайная_строка.расширение
    const uniqueSuffix = `${req.user?.id || "anonymous"}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Фильтр файлов – только JPEG и PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

// Лимиты – максимум 5 МБ
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

// Создаём и экспортируем настроенный multer
module.exports = multer({
  storage,
  fileFilter,
  limits,
});
