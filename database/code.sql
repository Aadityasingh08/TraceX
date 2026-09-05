-- Phase 3: live ingestion sources.
-- Run after schema.sql and schema_phase2.sql. Idempotent.

CREATE TABLE IF NOT EXISTS feed_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  enabled BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with real, legitimate, publicly-accessible sources (Google News RSS search
-- results — no auth, no scraping restrictions, actual live news). Swap/add more
-- as you like; anything that returns a valid RSS feed will work with the parser.
INSERT INTO feed_sources (id, name, url, category) VALUES
  ('feed-narcotics-india', 'Google News: narcotics seizure India',
   'https://news.google.com/rss/search?q=narcotics+seizure+india&hl=en-IN&gl=IN&ceid=IN:en', 'seizure'),
  ('feed-drug-bust-india', 'Google News: drug bust India',
   'https://news.google.com/rss/search?q=drug+bust+india&hl=en-IN&gl=IN&ceid=IN:en', 'enforcement'),
  ('feed-darkweb-drugs', 'Google News: dark web drug trafficking',
   'https://news.google.com/rss/search?q=dark+web+drug+trafficking&hl=en-IN&gl=IN&ceid=IN:en', 'darkweb')
ON CONFLICT (id) DO NOTHING;