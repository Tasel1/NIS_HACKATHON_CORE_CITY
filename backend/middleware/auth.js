// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// 1. Проверка токена
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, ... }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// 2. ⭐⭐⭐ ТВОЙ ШАГ 4 ⭐⭐⭐
const requireRole = (...allowedRoles) => {
  // Возвращаем middleware
  return (req, res, next) => {
    // Проверяем, что пользователь авторизован (токен проверен)
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: no user' });
    }

    // Проверяем, есть ли роль в списке разрешённых
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    // Всё ок – идём дальше
    next();
  };
};

module.exports = { verifyToken, requireRole };