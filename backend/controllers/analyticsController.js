// backend/controllers/analyticsController.js
const db = require("../config/database");

const getDashboard = async (req, res, next) => {
  try {
    // 1. Общая статистика по заявкам
    const statsQuery = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE) AS completed_today,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 2) AS avg_hours
      FROM requests
    `;
    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // 2. SLA rate – процент выполненных вовремя (deadline не нарушен)
    const slaQuery = `
      SELECT
        CASE 
          WHEN COUNT(*) FILTER (WHERE status = 'completed') = 0 THEN 0
          ELSE ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= COALESCE(deadline, completed_at)) * 100.0) 
            / COUNT(*) FILTER (WHERE status = 'completed'), 2
          )
        END AS sla_rate
      FROM requests
    `;
    const slaResult = await db.query(slaQuery);
    const slaRate = slaResult.rows[0].sla_rate;

    // 3. Количество заявок по категориям
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM requests
      GROUP BY category
      ORDER BY count DESC
    `;
    const categoryResult = await db.query(categoryQuery);

    // 4. Заявки за последние 7 дней (группировка по дате создания)
    const last7DaysQuery = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM requests
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    const last7DaysResult = await db.query(last7DaysQuery);

    // 5. Собираем всё вместе
    res.json({
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      in_progress: parseInt(stats.in_progress),
      completed: parseInt(stats.completed),
      completed_today: parseInt(stats.completed_today),
      avg_hours: stats.avg_hours || 0,
      sla_rate: parseFloat(slaRate) || 0,
      by_category: categoryResult.rows,
      last_7_days: last7DaysResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// все сверху это - dashboard, который будет возвращать все эти метрики в одном запросе

const getHotspots = async (req, res, next) => {
  try {
    const query = `
      SELECT
        ROUND(lat::numeric, 3) AS lat,
        ROUND(lng::numeric, 3) AS lng,
        category,
        COUNT(*) AS count
      FROM requests
      WHERE lat IS NOT NULL AND lng IS NOT NULL
      GROUP BY ROUND(lat::numeric, 3), ROUND(lng::numeric, 3), category
      ORDER BY count DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

//а все это сверху это - hotspots, который будет возвращать географические точки с количеством заявок в каждой точке (для heatmap)

const getWorkerPerformance = async (req, res, next) => {
  try {
    const query = `
      SELECT
        u.id AS worker_id,
        u.full_name,
        u.email,
        COUNT(DISTINCT r.id) AS assigned_count,
        COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed') AS completed_count,
        ROUND(
          (COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed') * 100.0) 
          / NULLIF(COUNT(DISTINCT r.id), 0), 
          2
        ) AS completion_rate,
        ROUND(AVG(wl.duration_minutes), 2) AS avg_time_minutes,
        ROUND(
          (COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed') * 100.0) 
          / NULLIF(COUNT(DISTINCT r.id), 0), 
          2
        ) AS rating
      FROM users u
      LEFT JOIN requests r ON r.assigned_worker_id = u.id
      LEFT JOIN work_logs wl ON wl.worker_id = u.id AND wl.request_id = r.id
      WHERE u.role = 'worker'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY rating DESC NULLS LAST
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

//сверху это - worker performance, который будет возвращать статистику по каждому работнику (кол-во назначенных заявок, кол-во выполненных, среднее время выполнения, рейтинг)

module.exports = { getDashboard, getHotspots, getWorkerPerformance };
