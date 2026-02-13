const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const db = require('../config/database'); // Импортируем базу данных

// Только администратор может просматривать пользователей
router.use(verifyToken, requireRole('admin'));

// Получить всех пользователей или фильтровать по роли
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    // Подготовка условий фильтрации
    let whereClause = 'WHERE 1=1'; // базовое условие
    const values = [];
    
    if (role) {
      whereClause += ` AND role = $${values.length + 1}`;
      values.push(role);
    }
    
    // Запрос к базе данных
    const query = `
      SELECT id, email, full_name, phone, role, points, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `;  
    
    const { rows } = await db.query(query, values);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
});

// Получить конкретного пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Ошибка при получении пользователя' });
  }
});

module.exports = router;