// trendRoutes.js
import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";
import { getTrends, refreshTrends } from "../controllers/trendController.js";
const router = express.Router();
router.get("/", getTrends);
router.post("/refresh", protect, requireRole("admin", "supervisor"), auditLog("REFRESH_TRENDS", "trends"), refreshTrends);
export default router;