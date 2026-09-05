import pool from "../config/db.js";

export async function computeEntityScore(entityId) {
  entityId = Number(entityId);
  const entityRes = await pool.query(`SELECT * FROM entities WHERE id = $1`, [entityId]);
  const entity = entityRes.rows[0];
  if (!entity) return null;

  const relCountRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM relationships WHERE source_id = $1 OR target_id = $1`,
    [entityId]
  );
  const relationshipCount = relCountRes.rows[0].count;

  const alertsRes = await pool.query(
    `SELECT evidence_ids FROM alerts WHERE entity_ids @> to_jsonb($1::int)`,
    [entityId]
  );
  const evidenceIds = new Set();
  alertsRes.rows.forEach((r) => (r.evidence_ids || []).forEach((id) => evidenceIds.add(id)));
  const evidenceCount = evidenceIds.size;
  const alertCount = alertsRes.rows.length;
  const sourceCount = (entity.sources || []).length;

  const reasons = [];
  let score = 20;
  reasons.push({ label: "Baseline analytical weight", points: 20 });

  const relPoints = Math.min(30, relationshipCount * 3);
  if (relPoints > 0) {
    score += relPoints;
    reasons.push({ label: `Network centrality (${relationshipCount} relationships)`, points: relPoints });
  }

  const evPoints = Math.min(25, evidenceCount * 8);
  if (evPoints > 0) {
    score += evPoints;
    reasons.push({ label: `Evidence-backed findings (${evidenceCount} items)`, points: evPoints });
  }

  const srcPoints = Math.min(15, Math.max(0, sourceCount - 1) * 5);
  if (srcPoints > 0) {
    score += srcPoints;
    reasons.push({ label: `Cross-source correlation (${sourceCount} sources)`, points: srcPoints });
  }

  const alertPoints = Math.min(10, alertCount * 5);
  if (alertPoints > 0) {
    score += alertPoints;
    reasons.push({ label: `Linked priority signals (${alertCount} alerts)`, points: alertPoints });
  }

  score = Math.min(100, score);

  return { entityId, score, reasons, relationshipCount, evidenceCount, sourceCount, alertCount };
}

export async function computeNetworkMetrics(entityId) {
  entityId = Number(entityId);
  const totalEntitiesRes = await pool.query(`SELECT COUNT(*)::int AS count FROM entities`);
  const totalEntities = totalEntitiesRes.rows[0].count;

  const relRes = await pool.query(
    `SELECT source_id, target_id FROM relationships WHERE source_id = $1 OR target_id = $1`,
    [entityId]
  );
  const degree = relRes.rows.length;
  const degreeCentrality = totalEntities > 1 ? +(degree / (totalEntities - 1)).toFixed(2) : 0;

  const neighbors = new Set();
  relRes.rows.forEach((r) => neighbors.add(r.source_id === entityId ? r.target_id : r.source_id));

  let neighborEdges = 0;
  if (neighbors.size > 1) {
    const neighborArr = [...neighbors];
    const edgeRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM relationships WHERE source_id = ANY($1) AND target_id = ANY($1)`,
      [neighborArr]
    );
    neighborEdges = edgeRes.rows[0].count;
  }
  const maxPossible = neighbors.size > 1 ? (neighbors.size * (neighbors.size - 1)) / 2 : 1;
  const connectionDensity = neighbors.size > 1 ? +(neighborEdges / maxPossible).toFixed(2) : 0;

  return { entityId, degree, degreeCentrality, connectedNodes: neighbors.size, connectionDensity };
}