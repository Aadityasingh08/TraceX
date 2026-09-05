import express from "express";
import {
  getInvestigations,
  getInvestigationById,
  getInvestigationSummary,
} from "../controllers/investigationController.js";

const router = express.Router();

router.get("/", getInvestigations);
router.get("/:id", getInvestigationById);
router.get("/:id/summary", getInvestigationSummary);

export default router;