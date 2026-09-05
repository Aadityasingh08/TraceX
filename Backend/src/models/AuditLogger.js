import { createAuditLog } from "../models/AuditLog.js";
import logger from "../utils/logger.js";

/**
 * Route-level audit logging.
 * Usage: router.get("/", protect, requireRole("admin"), auditLog("VIEW", "audit_logs"), getAuditLogs);
 *
 * Logs only after the response has actually been sent (res.on("finish")), and only
 * on success (status < 400) — so a failed request never gets recorded as if it happened,
 * and a slow/failed audit write can never block or break the real request.
 */
export function auditLog(action, resource) {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      createAuditLog({
        userId: req.user?.id,
        action,
        resource,
        resourceId: req.params?.id,
        ipAddress: req.ip,
      }).catch((err) => logger.error(`Audit log failed: ${err.message}`));
    });
    next();
  };
}