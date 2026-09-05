import pool from "../config/db.js";

const migrationSQL = `
ALTER TABLE entities ADD COLUMN IF NOT EXISTS activity INTEGER DEFAULT 0;
ALTER TABLE entities ADD COLUMN IF NOT EXISTS community VARCHAR(100);

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'ANALYST',
  created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS signal_candidates;
DROP TABLE IF EXISTS signals CASCADE;
DROP TABLE IF EXISTS trends;

CREATE TABLE IF NOT EXISTS feed_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100),
  enabled BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keyword_dictionary (
  id SERIAL PRIMARY KEY,
  term VARCHAR(255) NOT NULL,
  canonical_term VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  weight NUMERIC(5,2) DEFAULT 0.7
);

CREATE TABLE signals (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  snippet TEXT,
  source VARCHAR(255),
  source_id INTEGER REFERENCES feed_sources(id),
  entity_id INTEGER REFERENCES entities(id),
  investigation_id INTEGER REFERENCES investigations(id),
  topic VARCHAR(100),
  type VARCHAR(50),
  confidence NUMERIC(5,2),
  verification_status VARCHAR(20) DEFAULT 'unverified',
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE signal_candidates (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES signals(id),
  type VARCHAR(50),
  value TEXT,
  canonical_value TEXT,
  confidence NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'PENDING_REVIEW',
  matched_entity_id INTEGER REFERENCES entities(id),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trends (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  growth_percent NUMERIC(6,2),
  confidence NUMERIC(5,2),
  entities JSONB DEFAULT '[]',
  status VARCHAR(20),
  color VARCHAR(20),
  description TEXT,
  investigation_id INTEGER REFERENCES investigations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_signal ON signal_candidates(signal_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(migrationSQL);
    await client.query("COMMIT");
    console.log("✅ Migration applied to the database the app actually uses.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();