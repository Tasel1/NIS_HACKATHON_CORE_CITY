const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// ✅ Доступно всем авторизованным (любая роль)
router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// ✅ Только для админов
router.delete('/users/:id', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: `Admin deleted user ${req.params.id}` });
});

// ✅ Для исполнителей или админов
router.put('/tasks/:id', verifyToken, requireRole('worker', 'admin'), (req, res) => {
  res.json({ message: `Task ${req.params.id} updated by ${req.user.role}` });
});

module.exports = router;