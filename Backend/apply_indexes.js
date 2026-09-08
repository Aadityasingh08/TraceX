import pool from "./src/config/db.js";
import fs from "fs";
import path from "path";

async function applyIndexes() {
  try {
    const sqlPath = path.resolve("..", "database", "migrations_phase4_indexes.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("Indexes migration applied successfully!");

    const res = await pool.query(`
      SELECT tablename, indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    console.log("\n--- VERIFIED CUSTOM INDEXES IN POSTGRESQL ---");
    for (const r of res.rows) {
      console.log(`  ${r.tablename} -> ${r.indexname}`);
    }
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    process.exit();
  }
}

applyIndexes();
