import pool from "../config/db.js";
import { createEvidence } from "../services/evidenceService.js";

const entityId = process.argv[2];
if (!entityId) {
  console.error("Usage: node testEvidenceCreation.js <entityId>");
  process.exit(1);
}

async function run() {
  const signalRes = await pool.query(
    `SELECT DISTINCT s.snippet, s.source, s.investigation_id
     FROM signal_candidates sc
     JOIN signals s ON s.id = sc.signal_id
     WHERE sc.matched_entity_id = $1 AND sc.status = 'CONFIRMED'
     LIMIT 1`,
    [entityId]
  );
  console.log("Matching confirmed signal found:", signalRes.rows[0] || "NONE");

  if (signalRes.rows.length === 0) {
    console.log("No confirmed signal linked to this entity — nothing to create evidence from.");
    process.exit();
  }

  const signal = signalRes.rows[0];
  const evidence = await createEvidence({
    source: signal.source || "signal",
    content: signal.snippet,
    confidence: 99,
    finding: `TEST — source record for entity ${entityId}`,
    investigationId: signal.investigation_id,
  });
  console.log("Created evidence:", evidence);
  process.exit();
}

run();