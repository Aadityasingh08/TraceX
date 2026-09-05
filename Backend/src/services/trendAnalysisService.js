import pool from "../config/db.js";

/**
 * Recomputes trend rows from real extracted candidates: for each keyword-dictionary
 * category, compares candidate volume in the last 7 days against the 7 days before
 * that, and upserts a `trends` row with growth %, a confidence estimate, and the
 * number of distinct entities involved.
 *
 * Replaces the static seeded trend rows with numbers derived from what the
 * pipeline has actually extracted from ingested/submitted signals.
 */
export async function computeTrends() {
  const categoriesRes = await pool.query(`SELECT DISTINCT category FROM keyword_dictionary`);
  const results = [];

  for (const { category } of categoriesRes.rows) {
    const currentRes = await pool.query(
      `SELECT COUNT(*)::int AS count, COUNT(DISTINCT matched_entity_id)::int AS entities
       FROM signal_candidates sc
       JOIN keyword_dictionary kd ON sc.value = kd.term
       WHERE kd.category = $1 AND sc.created_at >= now() - interval '7 days'`,
      [category]
    );
    const previousRes = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM signal_candidates sc
       JOIN keyword_dictionary kd ON sc.value = kd.term
       WHERE kd.category = $1
         AND sc.created_at >= now() - interval '14 days'
         AND sc.created_at < now() - interval '7 days'`,
      [category]
    );

    const current = currentRes.rows[0].count;
    const previous = previousRes.rows[0].count;
    const entities = currentRes.rows[0].entities;

    const growth = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
    const confidence = Math.min(95, 40 + current * 5);
    const status = growth > 20 ? "RISING" : growth < -20 ? "DECLINING" : "STABLE";
    const color = status === "RISING" ? "red" : status === "DECLINING" ? "green" : "amber";

    const id = `TREND-${category.toUpperCase().replace(/\s+/g, "_")}`;
    await pool.query(
      `INSERT INTO trends (id, name, growth_percent, confidence, entities, status, color, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         growth_percent = EXCLUDED.growth_percent, confidence = EXCLUDED.confidence,
         entities = EXCLUDED.entities, status = EXCLUDED.status,
         color = EXCLUDED.color, description = EXCLUDED.description`,
      [id, category, growth, confidence, entities, status, color,
       `${current} mentions in the last 7 days (${previous} the week before)`]
    );
    results.push({ id, category, growth, current, previous });
  }

  return results;
}