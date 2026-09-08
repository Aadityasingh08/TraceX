import pool from "../config/db.js";

export async function getRelationships(req, res, next) {
  try {
    const { investigationId, sourceId, targetId, type, limit, offset } = req.query;
    let query = `
      SELECT id,
             source_id AS "sourceId",
             target_id AS "targetId",
             type, confidence,
             created_at AS "timestamp"
      FROM relationships
      WHERE 1=1
    `;
    const params = [];

    if (investigationId) {
      params.push(Number(investigationId));
      query += ` AND investigation_id = $${params.length}`;
    }
    if (sourceId) {
      params.push(Number(sourceId));
      query += ` AND (source_id = $${params.length} OR target_id = $${params.length})`;
    }
    if (targetId) {
      params.push(Number(targetId));
      query += ` AND target_id = $${params.length}`;
    }
    if (type) {
      params.push(String(type).toUpperCase());
      query += ` AND type = $${params.length}`;
    }

    query += ` ORDER BY id ASC`;

    if (limit) {
      params.push(Math.min(Math.max(Number(limit) || 50, 1), 5000));
      query += ` LIMIT $${params.length}`;
    }
    if (offset) {
      params.push(Math.max(Number(offset) || 0, 0));
      query += ` OFFSET $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
}

export async function createRelationship(req, res, next) {
  try {
    const {
      sourceId,
      targetId,
      type = "ASSOCIATED_WITH",
      confidence = 85,
      investigationId
    } = req.body;

    if (!sourceId || !targetId) {
      return res.status(400).json({ message: "sourceId and targetId are required" });
    }

    let invId = investigationId;
    if (!invId) {
      const invResult = await pool.query("SELECT id FROM investigations ORDER BY id ASC LIMIT 1");
      if (invResult.rows.length > 0) {
        invId = invResult.rows[0].id;
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO relationships (
        source_id, target_id, type, confidence, investigation_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id,
                source_id AS "sourceId",
                target_id AS "targetId",
                type, confidence,
                created_at AS "timestamp"`,
      [Number(sourceId), Number(targetId), String(type).toUpperCase(), Number(confidence), invId || null]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    next(err);
  }
}