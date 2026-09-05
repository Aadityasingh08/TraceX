// notificationController.js
import pool from "../config/db.js";
export async function getNotifications(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, detail, route,
              alert_id AS "alertId",
              entity_id AS "entityId",
              trend_id AS "trendId",
              unread, time
       FROM notifications`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}