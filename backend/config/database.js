const { Pool } = require("pg");
const path = require("path");

// Явно указываем путь к .env (он лежит в папке backend)
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect((err) => {
  if (err) console.error("DB Error:", err);
  else console.log("✅ DB Connected");
});

module.exports = { query: (text, params) => pool.query(text, params) };
