import express from "express";
import { getEvidence, createEvidenceRecord, verifyEvidenceRecord } from "../controllers/evidenceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";

const router = express.Router();
router.get("/", getEvidence);
router.post("/", protect, auditLog("CREATE", "evidence"), createEvidenceRecord);
router.post("/:id/verify", protect, auditLog("VERIFY", "evidence"), verifyEvidenceRecord);
export default router;