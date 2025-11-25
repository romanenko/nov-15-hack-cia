-- Add new columns to features table for question association and tracking

-- Add question_slug to link features to questions table
ALTER TABLE features ADD COLUMN IF NOT EXISTS question_slug TEXT;

-- Add research_run_id to track which research run produced this feature
ALTER TABLE features ADD COLUMN IF NOT EXISTS research_run_id BIGINT REFERENCES research_runs(id);

-- Add created_at timestamp for "Discovered X hours ago" display
ALTER TABLE features ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_features_handle_slug ON features(handle, question_slug);
CREATE INDEX IF NOT EXISTS idx_features_research_run ON features(research_run_id);

-- Add comments for documentation
COMMENT ON COLUMN features.question_slug IS 'Slug linking to questions table for human-readable question text';
COMMENT ON COLUMN features.research_run_id IS 'Reference to the research run that produced this feature';
COMMENT ON COLUMN features.created_at IS 'Timestamp when this feature was discovered/created';
