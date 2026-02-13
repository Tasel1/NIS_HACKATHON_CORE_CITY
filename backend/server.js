require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict with Vite dev server

// 1. CORS – разрешаем запросы с любого источника (нужно для разработки)
app.use(cors());

// 2. Парсинг JSON и URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Раздача статических файлов фронтенда (ВАЖНО!)
//    Папка frontend лежит на уровень выше от backend
app.use(express.static(path.join(__dirname, "../frontend")));

// 4. Статика для загруженных фото
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 5. Подключение ваших API-роутов
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requests")); // или requestRoutes
app.use("/api/photos", require("./routes/photos")); // или photoRoutes
app.use("/api/analytics", require("./routes/analytics")); // или analyticsRoutes
app.use("/api/users", require("./routes/users")); // для управления пользователями


app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});


app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/health`);
});
