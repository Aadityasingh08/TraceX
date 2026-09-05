// relationshipRoutes.js
import express from "express";
import { getRelationships, createRelationship } from "../controllers/relationshipController.js";
const router = express.Router();
router.get("/", getRelationships);
router.post("/", createRelationship);
export default router;