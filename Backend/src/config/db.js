import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
const isCloudDb = Boolean(
  connectionString &&
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1")
);
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER) || Boolean(process.env.VERCEL);

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: isCloudDb || (isProduction && connectionString) ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Database connection warning (non-fatal):", err.message);
});

export default pool;