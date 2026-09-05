import pool from "../config/db.js";
import { summarizeInvestigation } from "../services/aiService.js";

// GET /api/investigations
export const getInvestigations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM investigations ORDER BY created_at DESC`
    );
    res.json({ success: true, investigations: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch investigations" });
  }
};

// GET /api/investigations/:id
export const getInvestigationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM investigations WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Investigation not found" });
    }

    res.json({ success: true, investigation: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch investigation" });
  }
};

// GET /api/investigations/:id/summary
export const getInvestigationSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM investigations WHERE id = $1`,
      [id]
    );
    const investigation = result.rows[0];

    if (!investigation) {
      return res.status(404).json({ success: false, message: "Investigation not found" });
    }

    const summary = await summarizeInvestigation(investigation);
    res.json({ success: true, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to generate summary" });
  }
};