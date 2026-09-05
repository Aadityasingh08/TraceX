// alertRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";
import { getAlerts, verifySignal, rejectSignal, requestMoreEvidence, acknowledgeAlert } from "../controllers/alertController.js";

const router = express.Router();
router.get("/", getAlerts);
router.post("/:id/verify", protect, auditLog("VERIFY", "alerts"), verifySignal);
router.post("/:id/reject", protect, auditLog("REJECT", "alerts"), rejectSignal);
router.post("/:id/request-evidence", protect, auditLog("REQUEST_EVIDENCE", "alerts"), requestMoreEvidence);
router.post("/:id/acknowledge", protect, auditLog("ACKNOWLEDGE", "alerts"), acknowledgeAlert);
export default router;