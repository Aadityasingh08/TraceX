import pool from "../config/db.js";
import bcrypt from "bcryptjs";

async function createUser() {
  try {
    const hash = await bcrypt.hash("analyst123", 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password = $3, role = $4`,
      ["Lead Analyst", "analyst@tracex.local", hash, "admin"]
    );
    console.log("✅ Default user created: analyst@tracex.local / analyst123");
  } catch (err) {
    console.error("Error creating user:", err);
  } finally {
    process.exit();
  }
}

createUser();
