// categoryController.js
import pool from "../config/db.js";
export async function getCategories(req, res, next) {
  try {
    const result = await pool.query(`SELECT name FROM categories`);
    res.json(result.rows.map((r) => r.name));
  } catch (err) { next(err); }
}