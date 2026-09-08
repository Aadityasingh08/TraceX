import express from "express";
import {
  getInvestigations,
  getInvestigationById,
  getInvestigationSummary,
  createInvestigation,
} from "../controllers/investigationController.js";

const router = express.Router();

router.get("/", getInvestigations);
router.post("/", createInvestigation);
router.get("/:id", getInvestigationById);
router.get("/:id/summary", getInvestigationSummary);

export default router;