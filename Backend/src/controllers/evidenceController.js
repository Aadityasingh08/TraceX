import pool from "../config/db.js";
import { createEvidence, verifyEvidence } from "../services/evidenceService.js";

export async function getEvidence(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id,
              evidence_id AS "evidenceId",
              source,
              created_at AS "timestamp",
              sha256_hash AS "hash",
              sha256_hash AS "fullHash",
              confidence, status, finding
       FROM evidence`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

// POST /api/evidence — records new evidence and hashes its content for later integrity checks
export async function createEvidenceRecord(req, res, next) {
  try {
    const { source, content, confidence, finding, investigationId } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "content is required" });
    }
    const evidence = await createEvidence({ source, content, confidence, finding, investigationId });
    res.status(201).json({ success: true, evidence });
  } catch (err) { next(err); }
}

// POST /api/evidence/:id/verify — re-hashes the given content and confirms it matches the stored hash
export async function verifyEvidenceRecord(req, res, next) {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "content is required" });
    }
    const result = await verifyEvidence(req.params.id, content);
    if (!result) return res.status(404).json({ success: false, message: "Evidence not found" });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}