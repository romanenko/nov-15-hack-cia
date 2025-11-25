-- Add metadata columns to research_runs table
-- These store research data that is NOT displayed as features but kept for reference

-- Biography: 200-300 word third-person professional biography
ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS biography TEXT;

-- Confidence: Percentage indicating model confidence in accuracy
ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS confidence TEXT;

-- Sources: Array of URLs used in constructing the profile (stored as JSONB)
ALTER TABLE research_runs ADD COLUMN IF NOT EXISTS sources JSONB;

-- Add comments for documentation
COMMENT ON COLUMN research_runs.biography IS 'Polished 200-300 word third-person professional biography from Linkup research';
COMMENT ON COLUMN research_runs.confidence IS 'Percentage indicating model confidence in accuracy and match of findings';
COMMENT ON COLUMN research_runs.sources IS 'Array of URLs used in constructing the profile (public OSINT sources)';
