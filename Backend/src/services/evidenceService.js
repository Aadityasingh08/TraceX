import crypto from "crypto";
import pool from "../config/db.js";

export function hashContent(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Creates an evidence record with a SHA-256 hash computed from the raw content,
 * so integrity can be verified later by re-hashing the same content and comparing.
 */
export async function createEvidence({ source, content, confidence, finding, investigationId }) {
  const hash = hashContent(content);
  const evidenceId = `EVID-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO evidence (evidence_id, source, sha256_hash, confidence, status, finding, investigation_id)
     VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
     RETURNING id, evidence_id AS "evidenceId", source, created_at AS "timestamp",
               sha256_hash AS "hash", confidence, status, finding`,
    [evidenceId, source || "manual_submission", hash, confidence || null, finding || null, investigationId || null]
  );
  return result.rows[0];
}

/**
 * Re-hashes the given content and compares it to the stored hash — confirms the
 * evidence hasn't been altered since it was recorded.
 */
export async function verifyEvidence(id, content) {
  const evRes = await pool.query(`SELECT sha256_hash FROM evidence WHERE id = $1`, [id]);
  if (evRes.rows.length === 0) return null;

  const actualHash = hashContent(content);
  const matches = actualHash === evRes.rows[0].sha256_hash;

  if (matches) {
    await pool.query(`UPDATE evidence SET status = 'VERIFIED' WHERE id = $1`, [id]);
  }
  return { matches, expectedHash: evRes.rows[0].sha256_hash, actualHash };
}