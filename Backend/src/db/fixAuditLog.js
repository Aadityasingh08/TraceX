import pool from "../config/db.js";

async function run() {
  await pool.query(`ALTER TABLE audit_logs ALTER COLUMN resource_id TYPE VARCHAR(64) USING resource_id::VARCHAR`);
  console.log("✅ audit_logs.resource_id widened to VARCHAR(64)");
  process.exit();
}

run();