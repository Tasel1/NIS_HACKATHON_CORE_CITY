// backend/routes/photoRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");
const { getRequestPhotos } = require("../controllers/photoController"); // ← импорт

// Загрузка одной фотографии (поле 'photo' в form-data)
router.post("/upload", verifyToken, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(201).json({
    message: "File uploaded successfully",
    filename: req.file.filename,
    path: req.file.path,
  });
});

// ✅ ПОЛУЧЕНИЕ ВСЕХ ФОТО ЗАЯВКИ (новый маршрут)
router.get("/request/:id", verifyToken, getRequestPhotos);

module.exports = router;