import pool from "../config/db.js";
import crypto from "crypto";

const PATTERNS = [
  { type: "handle", regex: /@[\w.]{3,32}/g, confidence: 0.9 },
  { type: "email", regex: /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g, confidence: 0.95 },
  { type: "wallet", regex: /\b0x[a-fA-F0-9]{40}\b/g, confidence: 0.9 },
  { type: "phone", regex: /\b\+?\d[\d\s-]{8,13}\d\b/g, confidence: 0.75 },
  { type: "amount", regex: /\b(?:USD|INR|₹|\$)\s?\d+(?:[.,]\d+)?\b/gi, confidence: 0.7 },
];

/**
 * Extracts candidate entities from a raw text snippet using transparent pattern
 * matching plus an analyst-maintained keyword dictionary (`keyword_dictionary` table).
 * This is deliberately rule-based rather than a black-box model: every candidate
 * carries the exact pattern or dictionary term that triggered it, so a reviewing
 * analyst can see precisely why something was flagged.
 */
export async function extractCandidates(text) {
  if (!text || typeof text !== "string") return [];

  const candidates = [];

  for (const { type, regex, confidence } of PATTERNS) {
    const found = text.match(regex) || [];
    for (const value of new Set(found)) {
      candidates.push({ type, value, canonicalValue: null, confidence, matchedPattern: type });
    }
  }

  // Keyword dictionary lookups — analysts add/maintain terms, canonical mappings,
  // and a confidence weight, so the pipeline adapts to new terminology without a
  // code change or model retraining.
  const dictRes = await pool.query(`SELECT term, canonical_term, category, weight FROM keyword_dictionary`);
  const lowerText = text.toLowerCase();
  for (const row of dictRes.rows) {
    const term = row.term.toLowerCase();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordBoundary = new RegExp(`\\b${escaped}\\b`, "i");
    if (wordBoundary.test(lowerText)) {
      candidates.push({
        type: "keyword",
        value: row.term,
        canonicalValue: row.canonical_term,
        confidence: Number(row.weight),
        matchedPattern: `dictionary:${row.category}`,
      });
    }
  }

  return candidates;
}

/**
 * Runs extraction on a signal and stores every candidate as PENDING_REVIEW.
 * Nothing is auto-linked to an entity — this implements the pipeline's "Verify"
 * stage, requiring a human analyst to confirm or reject each candidate
 * (see reviewCandidate in signalController.js).
 */
export async function analyzeSignal(signalId, text) {
  const candidates = await extractCandidates(text);

  const inserted = [];
  for (const c of candidates) {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO signal_candidates (id, signal_id, type, value, canonical_value, confidence)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, signalId, c.type, c.value, c.canonicalValue, c.confidence]
    );
    inserted.push({ id, ...c });
  }

  await pool.query(`UPDATE signals SET verification_status = 'pending_review' WHERE id = $1`, [signalId]);

  return inserted;
}