// backend/controllers/requestController.js
const Request = require("../models/Request");
const Photo = require("../models/Photo");
const db = require("../config/database"); // для прямых запросов (points)

// --- 1. СОЗДАНИЕ ЗАЯВКИ (только citizen) ---
const createRequest = async (req, res, next) => {
  try {
    // Проверка роли – только citizen может создавать
    if (req.user.role !== "citizen") {
      return res
        .status(403)
        .json({ message: "Only citizens can create requests" });
    }

    const { category, description, lat, lng, address, priority } = req.body;
    const files = req.files; // если используется multiple upload

    // Валидация
    if (!category || !description || !lat || !lng) {
      return res.status(400).json({
        message: "Missing required fields: category, description, lat, lng",
      });
    }
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one photo is required" });
    }

    // 1. Создаём заявку
    const newRequest = await Request.create({
      citizen_id: req.user.userId,
      category,
      description,
      lat,
      lng,
      address,
      priority: priority || "medium",
      status: "pending",
    });

    // 2. Сохраняем фото
    for (const file of files) {
      await Photo.create({
        request_id: newRequest.id,
        photo_type: "problem", // по умолчанию problem, можно брать из req.body.photo_type
        file_path: file.path,
        uploaded_by: req.user.userId,
      });
    }

    // 3. Начисляем +10 баллов гражданину
    await db.query("UPDATE users SET points = points + 10 WHERE id = $1", [
      req.user.userId,
    ]);

    // 4. Уведомляем всех администраторов
    const admins = await db.query("SELECT id FROM users WHERE role = $1", [
      "admin",
    ]);
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, request_id, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          admin.id,
          newRequest.id,
          `Новая заявка #${newRequest.id} от гражданина`,
          "new_request",
        ],
      );
    }

    // 5. Возвращаем созданную заявку с фото
    const createdRequest = await Request.findById(newRequest.id);
    res.status(201).json(createdRequest);
  } catch (err) {
    next(err);
  }
};

// --- 2. ПОЛУЧЕНИЕ СПИСКА ЗАЯВОК (с RBAC фильтрацией) ---
const getRequests = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filters = { status, category };

    // RBAC: в зависимости от роли добавляем фильтр
    if (req.user.role === "citizen") {
      filters.citizen_id = req.user.userId;
    } else if (req.user.role === "worker") {
      filters.worker_id = req.user.userId;
    }
    // admin: без фильтра (видит всё)

    const requests = await Request.findAll(filters);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// --- 3. ПОЛУЧЕНИЕ ЗАЯВКИ ПО ID (с проверкой доступа) ---
const getRequestById = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Проверка прав: citizen может смотреть только свои заявки
    if (req.user.role === "citizen" && request.citizen_id !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    // worker может смотреть только назначенные ему заявки
    if (
      req.user.role === "worker" &&
      request.assigned_worker_id !== req.user.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    // admin видит всё

    res.json(request);
  } catch (err) {
    next(err);
  }
};

// --- 4. ОБНОВЛЕНИЕ СТАТУСА (worker/admin) ---
const updateStatus = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status } = req.body;

    // Допустимые статусы и роли
    const allowedStatuses = [
      "assigned",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Проверка прав: worker может менять только назначенные ему, admin – любые
    if (
      req.user.role === "worker" &&
      request.assigned_worker_id !== req.user.userId
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this request" });
    }
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Citizen cannot change status" });
    }

    // Валидация перехода (нельзя из completed в pending)
    const forbiddenTransitions = {
      completed: ["pending", "assigned", "in_progress", "cancelled"],
      cancelled: ["pending", "assigned", "in_progress", "completed"],
    };
    if (forbiddenTransitions[request.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${request.status} to ${status}`,
      });
    }

    const updatedRequest = await Request.updateStatus(
      requestId,
      status,
      req.user.userId,
    );
    res.json(updatedRequest);
  } catch (err) {
    next(err);
  }
};

// --- 5. НАЗНАЧЕНИЕ ИСПОЛНИТЕЛЯ (только admin) ---
const assignWorker = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can assign worker" });
    }

    const requestId = parseInt(req.params.id);
    const { workerId, deadline } = req.body;

    if (!workerId) {
      return res.status(400).json({ message: "workerId is required" });
    }

    // Проверяем, существует ли worker и имеет ли роль worker
    const workerCheck = await db.query(
      "SELECT * FROM users WHERE id = $1 AND role = $2",
      [workerId, "worker"],
    );
    if (workerCheck.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid worker ID or user is not a worker" });
    }

    const updatedRequest = await Request.assignWorker(
      requestId,
      workerId,
      deadline,
    );
    res.json(updatedRequest);
  } catch (err) {
    next(err);
  }
};

// --- 6. ПОДТВЕРЖДЕНИЕ ВЫПОЛНЕНИЯ (только citizen-владелец) ---
const approveWork = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const { approved, comment } = req.body; // approved: boolean

    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved must be boolean" });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Проверка: только владелец-гражданин
    if (req.user.role !== "citizen" || request.citizen_id !== req.user.userId) {
      return res.status(403).json({
        message: "Only the citizen who created the request can approve",
      });
    }

    // Статус должен быть completed
    if (request.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Request must be completed before approval" });
    }

    const updatedRequest = await Request.approve(requestId, approved, comment);

    // Если approved = true, начисляем +5 баллов исполнителю
    if (approved && request.assigned_worker_id) {
      await db.query("UPDATE users SET points = points + 5 WHERE id = $1", [
        request.assigned_worker_id,
      ]);
    }

    res.json(updatedRequest);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateStatus,
  assignWorker,
  approveWork,
};
