import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

// Only admins/supervisors can view the audit trail — analysts shouldn't be able
// to inspect or clear the log of who-did-what.
router.get("/", protect, requireRole("admin", "supervisor"), getAuditLogs);

export default router;