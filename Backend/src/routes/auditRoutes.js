import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

// Allow all authenticated users (analysts, supervisors, admins, etc.) to view the audit trail
router.get("/", protect, getAuditLogs);

export default router;