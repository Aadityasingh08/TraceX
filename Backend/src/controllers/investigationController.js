import pool from "../config/db.js";
import { summarizeInvestigation } from "../services/aiService.js";

// GET /api/investigations
export const getInvestigations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.case_code AS "caseCode", i.title AS name, i.title, i.status, i.created_at AS "createdAt",
              (SELECT COUNT(*)::int FROM signals s WHERE s.investigation_id = i.id) AS "recordsCount",
              (SELECT COUNT(*)::int FROM entities e WHERE e.investigation_id = i.id) AS "entitiesCount",
              (SELECT COUNT(*)::int FROM relationships r WHERE r.investigation_id = i.id) AS "relationshipsCount",
              (SELECT COUNT(*)::int FROM alerts a WHERE a.investigation_id = i.id) AS "alertsCount"
       FROM investigations i
       ORDER BY i.id ASC`
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

// POST /api/investigations
export const createInvestigation = async (req, res) => {
  try {
    const { title, case_code, caseCode, description, status } = req.body;
    const code = case_code || caseCode || `CASE-${Date.now().toString().slice(-4)}`;
    const name = title || "New Cyber Investigation";
    const stat = status || "ACTIVE";

    const result = await pool.query(
      `INSERT INTO investigations (title, case_code, status) VALUES ($1, $2, $3) RETURNING *`,
      [name, code, stat]
    );

    res.status(201).json({ success: true, investigation: result.rows[0] });
  } catch (error) {
    console.error("Create investigation failed:", error);
    res.status(500).json({ success: false, message: "Failed to create investigation" });
  }
};