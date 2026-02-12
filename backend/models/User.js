// backend/models/User.js
const db = require("../config/database");
const bcrypt = require("bcrypt");

const User = {}; // ← ТЫ ЗАБЫЛ ЭТУ СТРОКУ!

User.create = async (userData) => {
  const { email, password, full_name, phone, role, points } = userData;
  const password_hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, phone, role, points)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, full_name, phone, role, points`,
    [email, password_hash, full_name, phone, role || "citizen", points || 0],
  );
  return result.rows[0];
};

User.findByEmail = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0] || null;
};

User.findById = async (id) => {
  const result = await db.query(
    "SELECT id, email, full_name, phone, role, points FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

User.verifyPassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

module.exports = User;
