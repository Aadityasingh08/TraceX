// alertController.js — write actions use req.user.name from the JWT
import pool from "../config/db.js";

export async function getAlerts(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, severity, priority, confidence, status,
              entity_ids AS "entityIds",
              evidence_ids AS "evidenceIds",
              created_at AS "timestamp",
              title AS "what",
              reason AS "why",
              ai_summary AS "aiSummary"
       FROM alerts`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function updateAlertStatus(id, status) {
  const result = await pool.query(
    `UPDATE alerts SET status = $1 WHERE id = $2
     RETURNING id, title, severity, priority, confidence, status,
               entity_ids AS "entityIds", evidence_ids AS "evidenceIds",
               created_at AS "timestamp",
               title AS "what",
               reason AS "why",
               ai_summary AS "aiSummary"`,
    [status, id]
  );
  return result.rows[0];
}

export async function verifySignal(req, res, next) {
  try {
    const alert = await updateAlertStatus(req.params.id, "VERIFIED");
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    let evidence = null;
    if (alert.evidenceIds?.length) {
      const evResult = await pool.query(
        `UPDATE evidence SET status = 'VERIFIED' WHERE id = $1
         RETURNING id, evidence_id AS "evidenceId", source, created_at AS "timestamp", sha256_hash AS "hash", sha256_hash AS "fullHash", confidence, status, finding`,
        [alert.evidenceIds[0]]
      );
      evidence = evResult.rows[0] || null;
    }
    res.json({ alert, evidence, actor: req.user.name });
  } catch (err) { next(err); }
}

export async function rejectSignal(req, res, next) {
  try {
    const alert = await updateAlertStatus(req.params.id, "REJECTED");
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json({ alert, actor: req.user.name });
  } catch (err) { next(err); }
}

export async function requestMoreEvidence(req, res, next) {
  try {
    const alert = await updateAlertStatus(req.params.id, "NEEDS MORE EVIDENCE");
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json({ alert, actor: req.user.name });
  } catch (err) { next(err); }
}

export async function acknowledgeAlert(req, res, next) {
  try {
    const alert = await updateAlertStatus(req.params.id, "ACKNOWLEDGED");
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json(alert);
  } catch (err) { next(err); }
}