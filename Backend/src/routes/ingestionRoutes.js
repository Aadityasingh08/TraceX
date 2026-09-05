import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { auditLog } from "../middleware/auditLogger.js";
import {
  getFeedSources,
  addFeedSource,
  toggleFeedSource,
  triggerIngestion,
} from "../controllers/ingestionController.js";

const router = express.Router();

router.get("/sources", protect, getFeedSources);
router.post("/sources", protect, requireRole("admin", "supervisor"), auditLog("ADD_FEED_SOURCE", "feed_source"), addFeedSource);
router.patch("/sources/:id", protect, requireRole("admin", "supervisor"), auditLog("TOGGLE_FEED_SOURCE", "feed_source"), toggleFeedSource);
router.post("/run", protect, requireRole("admin", "supervisor"), auditLog("RUN_INGESTION", "feed_source"), triggerIngestion);

export default router;