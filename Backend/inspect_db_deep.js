import pool from './src/config/db.js';

async function run() {
  const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('=== TABLES IN TRACEX DB ===');
  for (const row of tablesRes.rows) {
    const t = row.table_name;
    const cnt = await pool.query(`SELECT count(*) FROM "${t}"`);
    console.log(`- ${t}: ${cnt.rows[0].count} rows`);
  }

  console.log('\n=== USERS TABLE ===');
  const users = await pool.query('SELECT id, name, email, role, created_at FROM users');
  console.log(users.rows);

  console.log('\n=== FOREIGN KEYS ===');
  const fkRes = await pool.query(`
    SELECT
      tc.table_name, kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY'
  `);
  console.log(fkRes.rows);

  await pool.end();
}

run().catch(console.error);
