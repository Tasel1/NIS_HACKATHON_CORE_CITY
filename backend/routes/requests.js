const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload"); // multer для нескольких файлов
const {
  createRequest,
  getRequests,
  getRequestById,
  updateStatus,
  assignWorker,
  approveWork,
} = require("../controllers/requestController");

// Все маршруты требуют авторизации
router.use(verifyToken);

// Создание заявки (только citizen, с загрузкой фото)
router.post(
  "/",
  requireRole("citizen"),
  upload.array("photos", 5),
  createRequest,
); // до 5 файлов

// Получение списка заявок (все роли, но с RBAC)
router.get("/", getRequests);

// Получение одной заявки
router.get("/:id", getRequestById);

// Обновление статуса (worker/admin)
router.patch("/:id/status", requireRole("worker", "admin"), updateStatus);

// Назначение исполнителя (только admin)
router.patch("/:id/assign", requireRole("admin"), assignWorker);

// Подтверждение выполнения (только citizen-владелец)
router.patch("/:id/approve", requireRole("citizen"), approveWork);

module.exports = router;
