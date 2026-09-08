// relationshipRoutes.js
import express from "express";
import { getRelationships, createRelationship } from "../controllers/relationshipController.js";
import { validateCreateRelationship } from "../middleware/validateRequest.js";

const router = express.Router();
router.get("/", getRelationships);
router.post("/", validateCreateRelationship, createRelationship);
export default router;