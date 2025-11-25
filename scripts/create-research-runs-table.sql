-- Create research_runs table to track Linkup research execution
-- This ensures we only run research once per day per user

CREATE TABLE IF NOT EXISTS research_runs (
  id BIGSERIAL PRIMARY KEY,
  handle TEXT NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

-- Index for faster lookups by handle and time
CREATE INDEX IF NOT EXISTS idx_research_runs_handle_started ON research_runs(handle, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_runs_status ON research_runs(status);

-- Comment explaining the table
COMMENT ON TABLE research_runs IS 'Tracks when Linkup research was run for each user to enforce 1-day cooldown and prevent duplicate runs';
COMMENT ON COLUMN research_runs.handle IS 'User handle (Twitter username)';
COMMENT ON COLUMN research_runs.started_at IS 'When the research was initiated';
COMMENT ON COLUMN research_runs.completed_at IS 'When the research completed (NULL if still running or failed)';
COMMENT ON COLUMN research_runs.status IS 'Current status: running, completed, or failed';
COMMENT ON COLUMN research_runs.error_message IS 'Error message if status is failed';
