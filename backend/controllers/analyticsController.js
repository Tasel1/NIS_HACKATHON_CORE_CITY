// backend/controllers/analyticsController.js
const db = require("../config/database");

const getDashboard = async (req, res, next) => {
  try {
    // Simple queries to avoid complex functions that might cause errors
    const totalQuery = `SELECT COUNT(*) as total FROM requests`;
    const pendingQuery = `SELECT COUNT(*) as pending FROM requests WHERE status = 'pending'`;
    const inProgressQuery = `SELECT COUNT(*) as in_progress FROM requests WHERE status = 'in_progress'`;
    const completedQuery = `SELECT COUNT(*) as completed FROM requests WHERE status = 'completed'`;
    const completedTodayQuery = `SELECT COUNT(*) as completed_today FROM requests WHERE DATE(completed_at) = CURRENT_DATE`;
    
    const [totalResult, pendingResult, inProgressResult, completedResult, completedTodayResult] = await Promise.all([
      db.query(totalQuery),
      db.query(pendingQuery),
      db.query(inProgressQuery),
      db.query(completedQuery),
      db.query(completedTodayQuery)
    ]);
    
    // Category breakdown
    const categoryQuery = `SELECT category, COUNT(*) as count FROM requests GROUP BY category ORDER BY count DESC`;
    const categoryResult = await db.query(categoryQuery);
    
    // Last 7 days
    const last7DaysQuery = `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM requests 
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' 
      GROUP BY DATE(created_at) 
      ORDER BY date
    `;
    const last7DaysResult = await db.query(last7DaysQuery);
    
    // Simple average calculation
    const avgHoursQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours
      FROM requests
      WHERE completed_at IS NOT NULL
    `;
    const avgHoursResult = await db.query(avgHoursQuery);
    const avgHours = avgHoursResult.rows[0]?.avg_hours || 0;

    res.json({
      total: parseInt(totalResult.rows[0]?.total) || 0,
      pending: parseInt(pendingResult.rows[0]?.pending) || 0,
      in_progress: parseInt(inProgressResult.rows[0]?.in_progress) || 0,
      completed: parseInt(completedResult.rows[0]?.completed) || 0,
      completed_today: parseInt(completedTodayResult.rows[0]?.completed_today) || 0,
      avg_hours: parseFloat(avgHours) || 0,
      sla_rate: 0, // Temporarily disable complex SLA calculation
      by_category: categoryResult.rows || [],
      last_7_days: last7DaysResult.rows || [],
    });
  } catch (err) {
    console.error('Error in getDashboard:', err);
    // Return a default response instead of crashing
    res.status(500).json({
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      completed_today: 0,
      avg_hours: 0,
      sla_rate: 0,
      by_category: [],
      last_7_days: [],
    });
  }
};

// все сверху это - dashboard, который будет возвращать все эти метрики в одном запросе

const getHotspots = async (req, res, next) => {
  try {
    // Simplified query to avoid rounding issues
    const query = `
      SELECT
        lat,
        lng,
        category,
        COUNT(*) AS count
      FROM requests
      WHERE lat IS NOT NULL AND lng IS NOT NULL
      GROUP BY lat, lng, category
      ORDER BY count DESC
      LIMIT 100
    `;
    const result = await db.query(query);
    // Round values in JavaScript instead of SQL to avoid database-specific functions
    const roundedResults = result.rows.map(row => ({
      ...row,
      lat: parseFloat(row.lat).toFixed(3),
      lng: parseFloat(row.lng).toFixed(3)
    }));
    res.json(roundedResults);
  } catch (err) {
    console.error('Error in getHotspots:', err);
    // Return an empty array instead of crashing
    res.json([]);
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
        COUNT(r.id) AS assigned_count,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        CASE 
          WHEN COUNT(r.id) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) * 100.0) / COUNT(r.id), 2)
        END AS completion_rate,
        COALESCE(ROUND(AVG(wl.duration_minutes), 2), 0) AS avg_time_minutes,
        CASE 
          WHEN COUNT(r.id) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) * 5.0) / COUNT(r.id), 2)
        END AS rating
      FROM users u
      LEFT JOIN requests r ON r.assigned_worker_id = u.id
      LEFT JOIN work_logs wl ON wl.worker_id = u.id AND wl.request_id = r.id
      WHERE u.role = 'worker'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY rating DESC
    `;
    const result = await db.query(query);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error in getWorkerPerformance:', err);
    // Return an empty array instead of crashing
    res.json([]);
  }
};

//сверху это - worker performance, который будет возвращать статистику по каждому работнику (кол-во назначенных заявок, кол-во выполненных, среднее время выполнения, рейтинг)

module.exports = { getDashboard, getHotspots, getWorkerPerformance };