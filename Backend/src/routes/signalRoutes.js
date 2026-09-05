// signalRoutes.js — serves "/api/records"
import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";
import {
  getRecords,
  analyzeRecord,
  getRecordCandidates,
  reviewCandidate,
  submitRecord,
  uploadRecord,
} from "../controllers/signalController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get("/", getRecords);
router.post("/submit", protect, auditLog("SUBMIT_RECORD", "signal"), submitRecord);
router.post("/upload", protect, upload.single("file"), auditLog("UPLOAD_RECORD", "signal"), uploadRecord);
router.post("/:id/analyze", protect, auditLog("ANALYZE", "signal"), analyzeRecord);
router.get("/:id/candidates", getRecordCandidates);
router.patch("/candidates/:candidateId", protect, auditLog("REVIEW_CANDIDATE", "signal_candidate"), reviewCandidate);

export default router;