import pool from "../config/db.js";

async function run() {
  await pool.query(`UPDATE users SET role = 'admin' WHERE email = 'analyst@tracex.local'`);
  const result = await pool.query(`SELECT id, name, email, role FROM users`);
  console.log(result.rows);
  process.exit();
}

run();