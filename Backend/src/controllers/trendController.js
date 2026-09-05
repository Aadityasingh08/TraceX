// trendController.js
import pool from "../config/db.js";
import { computeTrends } from "../services/trendAnalysisService.js";

export async function getTrends(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM trends`);
    res.json(result.rows);
  } catch (err) { next(err); }
}

// POST /api/trends/refresh — recompute trends from real extracted candidates
export async function refreshTrends(req, res, next) {
  try {
    const results = await computeTrends();
    res.json({ success: true, trends: results });
  } catch (err) { next(err); }
}