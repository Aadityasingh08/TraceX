import pool from "../config/db.js";

async function run() {
  const checks = [
    ["entities_no_name", `SELECT COUNT(*)::int AS count FROM entities WHERE name IS NULL`],
    ["alerts_no_title", `SELECT COUNT(*)::int AS count FROM alerts WHERE title IS NULL`],
    ["evidence_no_hash", `SELECT COUNT(*)::int AS count FROM evidence WHERE sha256_hash IS NULL`],
    ["signals_no_snippet", `SELECT COUNT(*)::int AS count FROM signals WHERE snippet IS NULL`],
  ];
  for (const [label, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`${label}: ${r.rows[0].count}`);
  }
  process.exit();
}

run();