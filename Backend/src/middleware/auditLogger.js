import { createAuditLog } from "../models/AuditLog.js";
import logger from "../utils/logger.js";

/**
 * Route-level audit logging.
 * Usage: router.get("/", protect, requireRole("admin"), auditLog("VIEW", "audit_logs"), getAuditLogs);
 */
export function auditLog(action, resource) {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      createAuditLog({
        userId: req.user?.id,
        action,
        resource,
        resourceId: req.params?.id || req.params?.candidateId || null,
        ipAddress: req.ip,
      }).catch((err) => logger.error(`Audit log failed: ${err.message}`));
    });
    next();
  };
}