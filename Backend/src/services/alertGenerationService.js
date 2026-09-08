import pool from "../config/db.js";
import { computeEntityScore } from "./scoringService.js";
import { explainAlert } from "./aiService.js";
import { createEvidence } from "./evidenceService.js";
import logger from "../utils/logger.js";

const ALERT_THRESHOLD = 70;

/**
 * Checks an entity's explainable score (from scoringService) and opens a real
 * alert if it crosses the threshold and there isn't already an open one for it.
 * The rule-based score and reasons are what actually decide whether an alert
 * fires; an AI-written one-sentence narration is added on top, best-effort,
 * purely to make `why` readable — if Groq is slow, rate-limited, or the key
 * isn't set, the alert still gets created with its rule-based `why` intact.
 */
export async function maybeCreateAlert(entityId) {
  const scoreData = await computeEntityScore(entityId);
  if (!scoreData || scoreData.score < ALERT_THRESHOLD) return null;

  const existing = await pool.query(
    `SELECT id FROM alerts WHERE entity_ids @> to_jsonb($1::int) AND status NOT IN ('REJECTED', 'ACKNOWLEDGED')`,
    [entityId]
  );
  if (existing.rows.length > 0) return null;

  const what = `Entity ${entityId} crossed the analytical threshold (score ${scoreData.score})`;
  const why = scoreData.reasons.map((r) => `${r.label} (+${r.points})`).join("; ");

  let aiSummary = null;
  try {
    aiSummary = await explainAlert({ what, why });
  } catch (err) {
    logger.error(`AI explanation skipped for entity ${entityId}: ${err.message}`);
  }

  // Trace this alert back to the real signal that produced the entity, and
  // record a hashed evidence entry from that actual source text — so an alert
  // has a genuine, re-verifiable evidentiary basis instead of an empty array.
  const evidenceIds = [];
  try {
    const signalRes = await pool.query(
      `SELECT DISTINCT s.snippet, s.source, s.investigation_id
       FROM signal_candidates sc
       JOIN signals s ON s.id = sc.signal_id
       WHERE sc.matched_entity_id = $1 AND sc.status = 'CONFIRMED'
       LIMIT 1`,
      [entityId]
    );
    if (signalRes.rows.length > 0 && signalRes.rows[0].snippet) {
      const signal = signalRes.rows[0];
      const evidence = await createEvidence({
        source: signal.source || "signal",
        content: signal.snippet,
        confidence: scoreData.score,
        finding: `Source record for entity ${entityId}: ${what}`,
        investigationId: signal.investigation_id,
      });
      evidenceIds.push(evidence.id);
    }
  } catch (err) {
    logger.error(`Evidence creation skipped for entity ${entityId}: ${err.message}`);
  }

  const result = await pool.query(
    `INSERT INTO alerts (title, severity, priority, confidence, status, entity_ids, evidence_ids, reason, ai_summary)
     VALUES ($1, $2, $3, $4, 'UNREVIEWED', $5, $6, $7, $8)
     RETURNING id`,
    [
      what,
      scoreData.score >= 85 ? "HIGH" : "MEDIUM",
      scoreData.score >= 85 ? 1 : 2,
      scoreData.score,
      JSON.stringify([entityId]),
      JSON.stringify(evidenceIds),
      JSON.stringify({ factors: scoreData.reasons }),
      aiSummary,
    ]
  );
  return result.rows[0].id;
}