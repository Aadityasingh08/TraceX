import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { env } from "../config/env.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: "1d",
    });

    res.status(201).json({ success: true, token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// In-memory failed login tracking with lockout timer
const loginAttemptsMap = new Map(); // email -> { count, lockedUntil }
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const attemptRecord = loginAttemptsMap.get(normalizedEmail) || { count: 0, lockedUntil: null };

    // 1. Check if account is currently locked out
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return res.status(429).json({
        success: false,
        locked: true,
        message: `Security Lockout Active: Too many failed attempts. Access blocked for ${remainingMinutes} more minute(s) (${remainingSeconds}s remaining).`,
        remainingSeconds,
      });
    }

    // If lockout duration has passed, reset count
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil <= now) {
      attemptRecord.count = 0;
      attemptRecord.lockedUntil = null;
    }

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [normalizedEmail]);
    const user = result.rows[0];

    // Check credentials
    let isMatch = false;
    if (user) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!user || !isMatch) {
      attemptRecord.count += 1;

      if (attemptRecord.count >= MAX_FAILED_ATTEMPTS) {
        attemptRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
        loginAttemptsMap.set(normalizedEmail, attemptRecord);
        return res.status(429).json({
          success: false,
          locked: true,
          message: `Security Alert: 3 consecutive failed login attempts. This account has been blocked for 5 minutes.`,
          remainingSeconds: 300,
          attemptsLeft: 0,
        });
      }

      loginAttemptsMap.set(normalizedEmail, attemptRecord);
      const attemptsLeft = MAX_FAILED_ATTEMPTS - attemptRecord.count;
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Warning: ${attemptsLeft} attempt(s) remaining before security lockout.`,
        attemptsLeft,
        locked: false,
      });
    }

    // Successful login: reset failed attempts
    loginAttemptsMap.delete(normalizedEmail);

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};