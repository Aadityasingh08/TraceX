// reportRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";
import { generateReport } from "../controllers/reportController.js";
const router = express.Router();
router.post("/generate", protect, auditLog("GENERATE_REPORT", "report"), generateReport);
export default router;