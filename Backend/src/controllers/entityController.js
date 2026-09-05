import pool from "../config/db.js";
import { computeEntityScore, computeNetworkMetrics } from "../services/scoringService.js";
import { findPotentialMatches } from "../services/entityResolutionService.js";

export async function getEntities(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, type, aliases, sources, priority,
              first_observed AS "firstObserved",
              last_observed AS "lastObserved",
              activity, community,
              COALESCE(description, '') AS description
       FROM entities`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

export async function getEntity(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, type, aliases, sources, priority,
              first_observed AS "firstObserved",
              last_observed AS "lastObserved",
              activity, community,
              COALESCE(description, '') AS description
       FROM entities WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Entity not found" });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

export async function getEntityScore(req, res, next) {
  try {
    const data = await computeEntityScore(req.params.id);
    if (!data) return res.status(404).json({ message: "Entity not found" });
    res.json(data);
  } catch (err) { next(err); }
}

export async function getEntityMatches(req, res, next) {
  try {
    const matches = await findPotentialMatches(req.params.id);
    res.json(matches);
  } catch (err) { next(err); }
}

export async function getEntityNetworkMetrics(req, res, next) {
  try {
    const metrics = await computeNetworkMetrics(req.params.id);
    res.json(metrics);
  } catch (err) { next(err); }
}

export async function createEntity(req, res, next) {
  try {
    const {
      name,
      type = "SUSPECT",
      priority = "HIGH",
      aliases = [],
      sources = ["Analyst-Manual"],
      description = "",
      community = "Unclassified",
      activity = 1,
      investigationId
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Entity identifier or name is required" });
    }

    // Resolve an investigation_id if not provided
    let invId = investigationId;
    if (!invId) {
      const invResult = await pool.query("SELECT id FROM investigations ORDER BY id ASC LIMIT 1");
      if (invResult.rows.length > 0) {
        invId = invResult.rows[0].id;
      }
    }

    const aliasesJson = JSON.stringify(Array.isArray(aliases) ? aliases : String(aliases).split(",").map((s) => s.trim()).filter(Boolean));
    const sourcesJson = JSON.stringify(Array.isArray(sources) ? sources : String(sources).split(",").map((s) => s.trim()).filter(Boolean));
    const now = new Date();

    const insertResult = await pool.query(
      `INSERT INTO entities (
        name, type, priority, investigation_id, aliases, sources, description,
        first_observed, last_observed, activity, community
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11)
      RETURNING id, name, type, aliases, sources, priority,
                first_observed AS "firstObserved",
                last_observed AS "lastObserved",
                activity, community,
                COALESCE(description, '') AS description`,
      [
        name.trim(),
        type.toUpperCase(),
        priority.toUpperCase(),
        invId || null,
        aliasesJson,
        sourcesJson,
        description,
        now,
        now,
        activity,
        community
      ]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    next(err);
  }
}