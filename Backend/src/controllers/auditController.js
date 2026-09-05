import { findAuditLogs } from "../models/AuditLog.js";

// GET /api/audit-logs?userId=&action=&resource=&limit=&offset=
export async function getAuditLogs(req, res, next) {
  try {
    const { userId, action, resource, limit, offset } = req.query;
    const logs = await findAuditLogs({
      userId,
      action,
      resource,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
}