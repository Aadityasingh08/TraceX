-- Phase 4 Scalability & Performance Indexes
-- Safe and idempotent: CREATE INDEX IF NOT EXISTS

CREATE INDEX IF NOT EXISTS idx_relationships_source_id ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_id ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_investigation ON relationships(investigation_id);

CREATE INDEX IF NOT EXISTS idx_entities_investigation_id ON entities(investigation_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_priority ON entities(priority);

CREATE INDEX IF NOT EXISTS idx_signals_investigation ON signals(investigation_id);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
