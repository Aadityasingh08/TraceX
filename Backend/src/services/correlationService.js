import pool from "../config/db.js";
import { similarity } from "./entityResolutionService.js";

const AUTO_MERGE_THRESHOLD = 0.85;

/**
 * Given a signal's CONFIRMED candidates, resolves each one to an entity
 * (matching an existing alias, or creating a new entity for human review when
 * nothing matches) and creates CO_OCCURRENCE relationships between every pair
 * of entities that appeared together in that signal.
 *
 * This is the pipeline's "Correlate" + "Connect" stages running on real
 * confirmed data — call it after an analyst confirms a candidate via
 * reviewCandidate() in signalController.js.
 */
export async function correlateSignal(signalId) {
  const candRes = await pool.query(
    `SELECT * FROM signal_candidates WHERE signal_id = $1 AND status = 'CONFIRMED'`,
    [signalId]
  );
  if (candRes.rows.length === 0) return { entityIds: [], relationshipsCreated: 0 };

  const signalRes = await pool.query(`SELECT * FROM signals WHERE id = $1`, [signalId]);
  const signal = signalRes.rows[0];

  const entityIds = [];
  for (const cand of candRes.rows) {
    const entityId = await resolveOrCreateEntity(cand, signal);
    entityIds.push(entityId);
    await pool.query(`UPDATE signal_candidates SET matched_entity_id = $1 WHERE id = $2`, [entityId, cand.id]);
  }

  let relationshipsCreated = 0;
  const uniqueEntityIds = [...new Set(entityIds)];
  for (let i = 0; i < uniqueEntityIds.length; i++) {
    for (let j = i + 1; j < uniqueEntityIds.length; j++) {
      const [a, b] = [uniqueEntityIds[i], uniqueEntityIds[j]];
      const existing = await pool.query(
        `SELECT id FROM relationships WHERE (source_id = $1 AND target_id = $2) OR (source_id = $2 AND target_id = $1)`,
        [a, b]
      );
      if (existing.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO relationships (source_id, target_id, type, confidence, investigation_id)
         VALUES ($1, $2, 'CO_OCCURRENCE', $3, $4)`,
        [a, b, 60, signal?.investigation_id || null]
      );
      relationshipsCreated++;
    }
  }

  return { entityIds: uniqueEntityIds, relationshipsCreated };
}

/**
 * Resolves a confirmed candidate to an entity: exact alias match first, then a
 * fuzzy pass reusing entityResolutionService's Levenshtein similarity() against
 * every existing entity's aliases — the same algorithm the /matches endpoint uses
 * for analyst-facing duplicate suggestions, applied here as an auto-merge gate
 * with a stricter threshold since no human confirms this specific decision.
 * Falls through to creating a new entity only when nothing clears the bar.
 */
async function resolveOrCreateEntity(candidate, signal) {
  const value = candidate.canonical_value || candidate.value;

  const exactMatch = await pool.query(`SELECT id FROM entities WHERE aliases ? $1`, [value]);
  if (exactMatch.rows.length > 0) {
    const entityId = exactMatch.rows[0].id;
    await pool.query(
      `UPDATE entities SET last_observed = NOW(), activity = COALESCE(activity, 0) + 1 WHERE id = $1`,
      [entityId]
    );
    return entityId;
  }

  const allEntities = await pool.query(`SELECT id, aliases FROM entities`);
  let bestEntityId = null;
  let bestScore = 0;
  for (const row of allEntities.rows) {
    for (const alias of row.aliases || []) {
      const score = similarity(value, alias);
      if (score > bestScore) {
        bestScore = score;
        bestEntityId = row.id;
      }
    }
  }
  if (bestEntityId && bestScore >= AUTO_MERGE_THRESHOLD) {
    await pool.query(
      `UPDATE entities
       SET aliases = aliases || to_jsonb($1::text), last_observed = NOW(), activity = COALESCE(activity, 0) + 1
       WHERE id = $2`,
      [value, bestEntityId]
    );
    return bestEntityId;
  }

  const insertRes = await pool.query(
    `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, community, description, first_observed, last_observed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING id`,
    [
      value,
      candidate.type,
      candidate.confidence >= 0.8 ? "HIGH" : "MEDIUM",
      signal?.investigation_id || null,
      JSON.stringify([value]),
      JSON.stringify(signal?.source ? [signal.source] : []),
      1,
      null,
      `Auto-created from a confirmed candidate in signal ${signal?.id || "unknown"}`,
    ]
  );
  return insertRes.rows[0].id;
}