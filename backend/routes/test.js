const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

// Открытый маршрут
router.get("/public", (req, res) => {
  res.json({ message: "Public endpoint" });
});

// Маршрут только с verifyToken
router.get("/protected", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Маршрут только для admin
router.get("/admin", verifyToken, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome admin", user: req.user });
});

// Маршрут для worker или admin
router.get(
  "/worker-or-admin",
  verifyToken,
  requireRole("worker", "admin"),
  (req, res) => {
    res.json({ message: `Welcome ${req.user.role}`, user: req.user });
  },
);

module.exports = router;
