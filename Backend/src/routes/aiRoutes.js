import express from "express";
import { copilotQuery } from "../services/aiService.js";

const router = express.Router();

// POST /api/ai/copilot
router.post("/copilot", async (req, res) => {
  try {
    const { query, context, history } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const response = await copilotQuery({ query, context, history });
    res.json({ success: true, ...response });
  } catch (err) {
    console.error("AI Copilot route error:", err);
    res.status(500).json({
      success: false,
      message: "AI analysis failed",
      reply: "The AI analyst service encountered an unexpected error. Please retry your inquiry.",
      threatLevel: "UNKNOWN",
      suggestedActions: []
    });
  }
});

export default router;
