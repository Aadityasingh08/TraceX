import pool from "../config/db.js";
import { summarizeReport } from "../services/aiService.js";
import logger from "../utils/logger.js";

export async function generateReport(req, res, next) {
  try {
    const investigationRes = req.body?.investigationId
      ? await pool.query(`SELECT * FROM investigations WHERE id = $1`, [req.body.investigationId])
      : await pool.query(`SELECT * FROM investigations ORDER BY created_at DESC LIMIT 1`);

    const investigation = investigationRes.rows[0];
    if (!investigation) {
      return res.status(404).json({ success: false, message: "No investigation found" });
    }

    const [entities, records, relationships, evidence, alerts, risk] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM entities`),
      pool.query(`SELECT COUNT(*)::int AS count FROM signals`),
      pool.query(`SELECT COUNT(*)::int AS count FROM relationships`),
      pool.query(`SELECT COUNT(*)::int AS count FROM evidence`),
      pool.query(`SELECT COUNT(*)::int AS count FROM alerts`),
      pool.query(`SELECT AVG(confidence)::numeric(5,2) AS "avgRiskScore", MAX(priority)::int AS "highestPriority" FROM alerts`),
    ]);

    const stats = {
      entities: entities.rows[0].count,
      records: records.rows[0].count,
      relationships: relationships.rows[0].count,
      evidence: evidence.rows[0].count,
      alerts: alerts.rows[0].count,
      avgRiskScore: risk.rows[0].avgRiskScore ? Number(risk.rows[0].avgRiskScore) : null,
      highestPriority: risk.rows[0].highestPriority,
    };

    // Best-effort — if Groq is unavailable, the report still generates with
    // its real, live counts; it just won't have the AI executive summary.
    let aiExecutiveSummary = null;
    try {
      aiExecutiveSummary = await summarizeReport({
        investigation: investigation.title,
        stats,
      });
    } catch (err) {
      logger.error(`AI executive summary skipped: ${err.message}`);
    }

    res.json({
      id: `REPORT-${Date.now().toString().slice(-6)}`,
      title: `${investigation.title} Intelligence Report`,
      generatedAt: new Date().toISOString(),
      investigationId: investigation.id,
      investigationCaseCode: investigation.case_code,
      investigation: investigation.title,
      generatedBy: req.user.name,
      sections: 12,
      stats,
      aiExecutiveSummary,
    });
  } catch (err) { next(err); }
}