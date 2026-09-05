-- Phase 2 additions: keyword dictionary + signal candidate extraction ("Verify" stage)
-- Your audit_logs table already exists in schema.sql — nothing to add there.
-- Run this file after schema.sql. Every statement is idempotent (safe to re-run).

ALTER TABLE signals ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- Analyst-maintained slang/codeword -> canonical term mapping.
-- Lets the extraction pipeline adapt to new terminology without a code change,
-- and keeps the mapping itself auditable and owned by analysts, not hardcoded.
CREATE TABLE IF NOT EXISTS keyword_dictionary (
  id SERIAL PRIMARY KEY,
  term TEXT UNIQUE NOT NULL,
  canonical_term TEXT NOT NULL,
  category TEXT NOT NULL,        -- e.g. 'location', 'product_code', 'contact_method'
  weight NUMERIC DEFAULT 0.6,    -- base confidence contribution (0-1)
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Every entity candidate extracted from a signal's text, before a human confirms it.
-- This is what powers the explainability panel and the "Verify" pipeline stage.
CREATE TABLE IF NOT EXISTS signal_candidates (
  id TEXT PRIMARY KEY,
  signal_id TEXT REFERENCES signals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- 'handle' | 'email' | 'wallet' | 'phone' | 'amount' | 'keyword'
  value TEXT NOT NULL,
  canonical_value TEXT,
  confidence NUMERIC NOT NULL,
  matched_entity_id TEXT REFERENCES entities(id),
  status TEXT DEFAULT 'PENDING_REVIEW',   -- PENDING_REVIEW | CONFIRMED | REJECTED
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_candidates_signal ON signal_candidates(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_status ON signal_candidates(status);