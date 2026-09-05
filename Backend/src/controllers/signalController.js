// signalController.js — serves "/api/records"
import pool from "../config/db.js";
import crypto from "crypto";
import { analyzeSignal } from "../services/signalDetectionService.js";
import { correlateSignal } from "../services/correlationService.js";
import { maybeCreateAlert } from "../services/alertGenerationService.js";
import logger from "../utils/logger.js";

export async function getRecords(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, entity_id AS "entityId", source_id AS "sourceId",
              source AS "sourceLabel",
              type, title, snippet, timestamp,
              COALESCE(confidence, 0) AS confidence,
              topic
       FROM signals`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

export async function analyzeRecord(req, res, next) {
  try {
    const { id } = req.params;
    const sigRes = await pool.query(`SELECT snippet FROM signals WHERE id = $1`, [id]);
    if (sigRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Signal not found" });
    }
    const candidates = await analyzeSignal(id, sigRes.rows[0].snippet);
    res.json({ success: true, candidates });
  } catch (err) { next(err); }
}

export async function getRecordCandidates(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, type, value, canonical_value AS "canonicalValue", confidence,
              matched_entity_id AS "matchedEntityId", status
       FROM signal_candidates WHERE signal_id = $1
       ORDER BY confidence DESC`,
      [req.params.id]
    );
    res.json({ success: true, candidates: result.rows });
  } catch (err) { next(err); }
}

export async function reviewCandidate(req, res, next) {
  try {
    const { candidateId } = req.params;
    const { status, matchedEntityId } = req.body;
    if (!["CONFIRMED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be CONFIRMED or REJECTED" });
    }

    const updateRes = await pool.query(
      `UPDATE signal_candidates
       SET status = $1, matched_entity_id = $2, reviewed_by = $3, reviewed_at = now()
       WHERE id = $4
       RETURNING signal_id AS "signalId"`,
      [status, matchedEntityId || null, req.user?.id || null, candidateId]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    let correlation = null;
    let alertsCreated = [];
    if (status === "CONFIRMED") {
      const { signalId } = updateRes.rows[0];
      correlation = await correlateSignal(signalId);
      for (const entityId of correlation.entityIds) {
        const alertId = await maybeCreateAlert(entityId).catch((err) => {
          logger.error(`Alert generation failed for ${entityId}: ${err.message}`);
          return null;
        });
        if (alertId) alertsCreated.push(alertId);
      }
    }

    res.json({ success: true, correlation, alertsCreated });
  } catch (err) { next(err); }
}

export async function submitRecord(req, res, next) {
  try {
    const { title, snippet, sourceLabel, timestamp, type } = req.body;
    if (!snippet || typeof snippet !== "string" || snippet.trim().length === 0) {
      return res.status(400).json({ success: false, message: "snippet (the case text) is required" });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO signals (id, entity_id, source_id, source, type, title, snippet, timestamp, confidence, topic)
       VALUES ($1, NULL, NULL, $2, $3, $4, $5, $6, NULL, NULL)`,
      [
        id,
        sourceLabel || "manual_submission",
        type || "submission",
        title || "Untitled submission",
        snippet,
        timestamp || new Date().toISOString(),
      ]
    );

    const candidates = await analyzeSignal(id, snippet);
    res.status(201).json({ success: true, signalId: id, candidates });
  } catch (err) { next(err); }
}

export async function uploadRecord(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "file is required (field name: file)" });
    }
    const snippet = req.file.buffer.toString("utf-8").slice(0, 5000);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO signals (id, entity_id, source_id, source, type, title, snippet, timestamp, confidence, topic)
       VALUES ($1, NULL, NULL, $2, 'submission', $3, $4, $5, NULL, NULL)`,
      [id, "file_upload", req.file.originalname, snippet, new Date().toISOString()]
    );

    const candidates = await analyzeSignal(id, snippet);
    res.status(201).json({ success: true, signalId: id, filename: req.file.originalname, candidates });
  } catch (err) { next(err); }
}