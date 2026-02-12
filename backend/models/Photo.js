// backend/models/Photo.js
const db = require("../config/database");

const Photo = {};

// --- 1. ДОБАВЛЕНИЕ ЗАПИСИ О ФАЙЛЕ ---
Photo.create = async (data) => {
  const { request_id, photo_type, file_path, uploaded_by } = data;

  // Валидация обязательных полей
  if (!request_id || !photo_type || !file_path || !uploaded_by) {
    throw new Error(
      "Missing required fields: request_id, photo_type, file_path, uploaded_by",
    );
  }

  const result = await db.query(
    `INSERT INTO photos (request_id, photo_type, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [request_id, photo_type, file_path, uploaded_by],
  );

  return result.rows[0];
};

// --- 2. ПОЛУЧЕНИЕ ВСЕХ ФОТО ПО ID ЗАЯВКИ ---
Photo.findByRequestId = async (requestId) => {
  const result = await db.query(
    `SELECT id, request_id, photo_type, file_path, uploaded_by, uploaded_at
     FROM photos
     WHERE request_id = $1
     ORDER BY uploaded_at ASC`,
    [requestId],
  );
  return result.rows;
};

module.exports = Photo;
