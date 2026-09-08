import pool from "./src/config/db.js";

async function verifyCounts() {
  try {
    console.log("=================================================");
    console.log("📊 TRACE-X DATABASE AUDIT & VERIFICATION");
    console.log("=================================================");

    const tables = [
      "investigations", "entities", "relationships", "signals",
      "alerts", "evidence", "trends", "users", "audit_logs", "signal_candidates"
    ];

    console.log("\n--- TABLE ROW COUNTS ---");
    for (const t of tables) {
      const r = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`  ${t.padEnd(20)} : ${r.rows[0].count}`);
    }

    console.log("\n--- BREAKDOWN BY INVESTIGATION ---");
    const invs = await pool.query(`SELECT id, case_code, title, status FROM investigations ORDER BY id ASC`);
    for (const inv of invs.rows) {
      const e = await pool.query(`SELECT COUNT(*) FROM entities WHERE investigation_id = $1`, [inv.id]);
      const r = await pool.query(`SELECT COUNT(*) FROM relationships WHERE investigation_id = $1`, [inv.id]);
      const s = await pool.query(`SELECT COUNT(*) FROM signals WHERE investigation_id = $1`, [inv.id]);
      console.log(`  [${inv.case_code}] "${inv.title}" (ID: ${inv.id}, Status: ${inv.status})`);
      console.log(`     -> Entities: ${e.rows[0].count.padStart(4)} | Relationships: ${r.rows[0].count.padStart(4)} | Signals: ${s.rows[0].count.padStart(5)}`);
    }

    console.log("\n=================================================");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    process.exit();
  }
}

verifyCounts();
