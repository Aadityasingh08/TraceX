import pool from "../config/db.js";
import crypto from "crypto";
import { runIngestionCycle } from "../services/ingestionService.js";

// GET /api/ingestion/sources
export async function getFeedSources(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, url, category, enabled, last_fetched_at AS "lastFetchedAt"
       FROM feed_sources ORDER BY name`
    );
    res.json({ success: true, sources: result.rows });
  } catch (err) { next(err); }
}

// POST /api/ingestion/sources — add a new public feed to monitor
export async function addFeedSource(req, res, next) {
  try {
    const { name, url, category } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: "name and url are required" });
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO feed_sources (id, name, url, category) VALUES ($1, $2, $3, $4)`,
      [id, name, url, category || null]
    );
    res.status(201).json({ success: true, id });
  } catch (err) { next(err); }
}

// PATCH /api/ingestion/sources/:id — enable/disable a source
export async function toggleFeedSource(req, res, next) {
  try {
    const { enabled } = req.body;
    await pool.query(`UPDATE feed_sources SET enabled = $1 WHERE id = $2`, [!!enabled, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/ingestion/run — fetch every enabled source right now
export async function triggerIngestion(req, res, next) {
  try {
    const results = await runIngestionCycle();
    res.json({ success: true, ingested: results.length, results });
  } catch (err) { next(err); }
}