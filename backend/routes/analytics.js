const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  getDashboard,
  getHotspots,
  getWorkerPerformance,
} = require("../controllers/analyticsController");

// Все маршруты аналитики доступны только админам
router.use(verifyToken, requireRole("admin"));

router.get("/dashboard", getDashboard);
router.get("/hotspots", getHotspots);
router.get("/workers", getWorkerPerformance);

module.exports = router;
