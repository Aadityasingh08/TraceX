import pool from "./src/config/db.js";

async function inspect() {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  let cur = '';
  for (const r of res.rows) {
    if (r.table_name !== cur) {
      console.log('\n--- Table: ' + r.table_name + ' ---');
      cur = r.table_name;
    }
    console.log('  ' + r.column_name + ' (' + r.data_type + ', null=' + r.is_nullable + ')');
  }

  // Also check existing indexes
  console.log('\n=== EXISTING INDEXES ===');
  const idxRes = await pool.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  for (const idx of idxRes.rows) {
    console.log(`  ${idx.tablename} -> ${idx.indexname}: ${idx.indexdef}`);
  }

  process.exit();
}

inspect();
