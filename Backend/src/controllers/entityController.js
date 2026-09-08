import pool from "../config/db.js";
import { computeEntityScore, computeNetworkMetrics } from "../services/scoringService.js";
import { findPotentialMatches } from "../services/entityResolutionService.js";

export async function getEntities(req, res, next) {
  try {
    const { investigationId, type, search, limit, offset } = req.query;
    let query = `
      SELECT id, name, type, aliases, sources, priority,
              first_observed AS "firstObserved",
              last_observed AS "lastObserved",
              activity, community,
              COALESCE(description, '') AS description,
              COALESCE(display_name, name) AS "displayName",
              person_name AS "personName",
              telegram_handle AS "telegramHandle",
              phone,
              email,
              location,
              wallet_address AS "walletAddress"
       FROM entities
    `;
    const conditions = [];
    const params = [];

    if (investigationId) {
      params.push(parseInt(investigationId, 10));
      conditions.push(`investigation_id = $${params.length}`);
    }
    if (type) {
      params.push(type.toUpperCase());
      conditions.push(`type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length} OR display_name ILIKE $${params.length} OR person_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR telegram_handle ILIKE $${params.length} OR email ILIKE $${params.length} OR location ILIKE $${params.length} OR wallet_address ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY id ASC`;

    if (limit) {
      params.push(parseInt(limit, 10));
      query += ` LIMIT $${params.length}`;
      if (offset) {
        params.push(parseInt(offset, 10));
        query += ` OFFSET $${params.length}`;
      }
    }

    const result = await pool.query(query, params);
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
              COALESCE(description, '') AS description,
              COALESCE(display_name, name) AS "displayName",
              person_name AS "personName",
              telegram_handle AS "telegramHandle",
              phone,
              email,
              location,
              wallet_address AS "walletAddress"
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