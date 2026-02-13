// backend/models/Request.js
const db = require("../config/database");

const Request = {};

// --- 1. СОЗДАНИЕ ЗАЯВКИ ---
Request.create = async (data) => {
  const {
    citizen_id,
    category,
    description,
    lat,
    lng,
    address,
    priority = "medium",
    status = "pending",
  } = data;
  const result = await db.query(
    `INSERT INTO requests (citizen_id, category, description, lat, lng, address, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [citizen_id, category, description, lat, lng, address, priority, status],
  );
  return result.rows[0];
};

// --- 2. ПОЛУЧЕНИЕ СПИСКА ЗАЯВОК С ФИЛЬТРАМИ ---
Request.findAll = async (filters = {}) => {
  const { status, category, citizen_id, worker_id } = filters;
  let query = `
    SELECT 
      r.*,
      citizen.full_name AS citizen_name,
      worker.full_name AS worker_name
    FROM requests r
    LEFT JOIN users citizen ON r.citizen_id = citizen.id
    LEFT JOIN users worker ON r.assigned_worker_id = worker.id
    WHERE 1=1
  `;
  const values = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND r.status = $${paramIndex++}`;
    values.push(status);
  }
  if (category) {
    query += ` AND r.category = $${paramIndex++}`;
    values.push(category);
  }
  if (citizen_id) {
    query += ` AND r.citizen_id = $${paramIndex++}`;
    values.push(citizen_id);
  }
  if (worker_id) {
    query += ` AND r.assigned_worker_id = $${paramIndex++}`;
    values.push(worker_id);
  }

  query += ` ORDER BY r.created_at DESC`;

  const result = await db.query(query, values);
  return result.rows;
};

// --- 3. ПОЛУЧЕНИЕ ОДНОЙ ЗАЯВКИ С ФОТО И РАБОЧИМИ ЛОГАМИ ---
Request.findById = async (id) => {
  // Получаем заявку
  const requestResult = await db.query(
    `SELECT 
       r.*,
       citizen.full_name AS citizen_name,
       worker.full_name AS worker_name
     FROM requests r
     LEFT JOIN users citizen ON r.citizen_id = citizen.id
     LEFT JOIN users worker ON r.assigned_worker_id = worker.id
     WHERE r.id = $1`,
    [id],
  );
  if (requestResult.rows.length === 0) return null;
  const request = requestResult.rows[0];

  // Получаем фотографии
  const photosResult = await db.query(
    `SELECT id, photo_type, file_path, uploaded_by, uploaded_at
     FROM photos
     WHERE request_id = $1
     ORDER BY uploaded_at`,
    [id],
  );
  request.photos = photosResult.rows;

  // Получаем логи работы
  const logsResult = await db.query(
    `SELECT id, worker_id, start_time, end_time, duration_minutes, notes, created_at
     FROM work_logs
     WHERE request_id = $1
     ORDER BY created_at`,
    [id],
  );
  request.work_logs = logsResult.rows;

  return request;
};

// --- 4. ОБНОВЛЕНИЕ СТАТУСА + УВЕДОМЛЕНИЕ ---
Request.updateStatus = async (id, status, userId) => {
  // Определяем, какое поле timestamp обновлять в зависимости от статуса
  let timestampField = "";
  if (status === "assigned") timestampField = "assigned_at";
  else if (status === "in_progress") timestampField = "started_at";
  else if (status === "completed") timestampField = "completed_at";
  else if (status === "approved" || status === "rejected")
    timestampField = "approved_at"; // добавим поле при необходимости

  let query = `UPDATE requests SET status = $1, updated_at = NOW()`;
  const values = [status];
  let paramIndex = 2;

  if (timestampField) {
    query += `, ${timestampField} = NOW()`;
  }

  query += ` WHERE id = $${paramIndex++} RETURNING *`;
  values.push(id);

  const result = await db.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Request not found');
  }
  
  const updatedRequest = result.rows[0];

  // Создаём уведомление для заявителя (только если citizen_id существует)
  if (updatedRequest.citizen_id) {
    await db.query(
      `INSERT INTO notifications (user_id, request_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        updatedRequest.citizen_id,
        id,
        `Статус вашей заявки #${id} изменён на "${status}"`,
        "status_update",
      ],
    );
  }

  return updatedRequest;
};

// --- 5. НАЗНАЧЕНИЕ ИСПОЛНИТЕЛЯ ---
Request.assignWorker = async (id, workerId, deadline) => {
  // Ensure deadline is properly handled (can be null)
  const deadlineValue = deadline || null;
  
  const result = await db.query(
    `UPDATE requests
     SET assigned_worker_id = $1, status = 'assigned', deadline = $2, assigned_at = NOW(), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [workerId, deadlineValue, id],
  );
  
  if (result.rows.length === 0) {
    throw new Error('Request not found');
  }
  
  const updatedRequest = result.rows[0];

  // Check if the worker exists before creating notification
  const workerExists = await db.query('SELECT id FROM users WHERE id = $1', [workerId]);
  if (workerExists.rows.length > 0) {
    // Уведомление для исполнителя
    await db.query(
      `INSERT INTO notifications (user_id, request_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        workerId,
        id,
        `Вам назначена заявка #${id}. Срок выполнения: ${deadlineValue || "не указан"}`,
        "assignment",
      ],
    );
  }

  // Check if the citizen exists before creating notification
  if (updatedRequest.citizen_id) {
    await db.query(
      `INSERT INTO notifications (user_id, request_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        updatedRequest.citizen_id,
        id,
        `Вашей заявке #${id} назначен исполнитель`,
        "assignment",
      ],
    );
  }

  return updatedRequest;
};

// --- 6. ПОДТВЕРЖДЕНИЕ/ОТКЛОНЕНИЕ ВЫПОЛНЕНИЯ ГРАЖДАНИНОМ ---
Request.approve = async (id, approved, comment) => {
  // Обновляем citizen_approved и статус в зависимости от approved
  const newStatus = approved ? "approved" : "in_progress";
  const result = await db.query(
    `UPDATE requests 
     SET citizen_approved = $1, status = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [approved, newStatus, id],
  );
  const updatedRequest = result.rows[0];

  // Уведомление для исполнителя (если назначен)
  if (updatedRequest.assigned_worker_id) {
    await db.query(
      `INSERT INTO notifications (user_id, request_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        updatedRequest.assigned_worker_id,
        id,
        approved
          ? `Гражданин подтвердил выполнение заявки #${id}`
          : `Гражданин отклонил выполнение заявки #${id}. Комментарий: ${comment || "не указан"}`,
        "citizen_approval",
      ],
    );
  }

  // Уведомление для всех администраторов
  const admins = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
  for (const admin of admins.rows) {
    await db.query(
      `INSERT INTO notifications (user_id, request_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        admin.id,
        id,
        approved
          ? `Гражданин подтвердил выполнение заявки #${id}`
          : `Гражданин отклонил выполнение заявки #${id}. Комментарий: ${comment || "не указан"}`,
        "citizen_approval",
      ],
    );
  }

  return updatedRequest;
};

module.exports = Request;
