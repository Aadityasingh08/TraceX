CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'ANALYST',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigations (
  id SERIAL PRIMARY KEY,
  case_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  priority VARCHAR(20),
  investigation_id INTEGER REFERENCES investigations(id),
  aliases JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  description TEXT,
  first_observed TIMESTAMP,
  last_observed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relationships (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES entities(id),
  target_id INTEGER REFERENCES entities(id),
  type VARCHAR(50),
  confidence NUMERIC(5,2),
  investigation_id INTEGER REFERENCES investigations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100),
  enabled BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signals (
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

CREATE TABLE IF NOT EXISTS keyword_dictionary (
  id SERIAL PRIMARY KEY,
  term VARCHAR(255) NOT NULL,
  canonical_term VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  weight NUMERIC(5,2) DEFAULT 0.7
);

CREATE TABLE IF NOT EXISTS signal_candidates (
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

CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  evidence_id VARCHAR(50) UNIQUE NOT NULL,
  source VARCHAR(255),
  sha256_hash VARCHAR(64),
  confidence NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'PENDING',
  finding TEXT,
  investigation_id INTEGER REFERENCES investigations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(20),
  priority INTEGER,
  confidence NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'OPEN',
  investigation_id INTEGER REFERENCES investigations(id),
  entity_ids JSONB DEFAULT '[]',
  evidence_ids JSONB DEFAULT '[]',
  reason JSONB DEFAULT '{}',
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trends (
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

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id INTEGER,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_candidates_status ON signal_candidates(status);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_signal ON signal_candidates(signal_id);
CREATE INDEX IF NOT EXISTS idx_entities_investigation ON entities(investigation_id);
CREATE INDEX IF NOT EXISTS idx_alerts_investigation ON alerts(investigation_id);
CREATE INDEX IF NOT EXISTS idx_signals_investigation ON signals(investigation_id);
CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source_id);