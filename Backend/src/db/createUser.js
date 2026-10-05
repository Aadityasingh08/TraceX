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

    await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password = $3, role = $4`,
      ["Aditya Singh", "adityasingh.as0608@gmail.com", hash, "admin"]
    );

    await pool.query(
      `UPDATE users SET password = $1 WHERE name ILIKE '%aditya%' OR email ILIKE '%aditya%'`,
      [hash]
    );

    console.log("✅ Default users created/updated successfully: analyst@tracex.local and Aditya Singh / analyst123");
  } catch (err) {
    console.error("Error creating user:", err);
  } finally {
    process.exit();
  }
}

createUser();

