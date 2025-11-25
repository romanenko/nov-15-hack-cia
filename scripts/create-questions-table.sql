-- Create questions table to define the fixed set of profile questions
-- These questions are associated with features via slug

CREATE TABLE IF NOT EXISTS questions (
  id SMALLSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with predefined questions (fixed set of 6)
INSERT INTO questions (slug, question_text, display_order) VALUES
  ('beliefs', 'What do they believe in?', 1),
  ('expertise', 'What is their expertise?', 2),
  ('voting_preferences', 'What are their political views?', 3),
  ('relationship_with_risk', 'How do they approach risk?', 4),
  ('unspoken_worldview', 'What is their worldview?', 5),
  ('projected_socioeconomic_class', 'What is their socioeconomic background?', 6)
ON CONFLICT (slug) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE questions IS 'Predefined questions for profile intelligence features';
COMMENT ON COLUMN questions.slug IS 'Unique identifier matching Linkup research field names';
COMMENT ON COLUMN questions.question_text IS 'Human-readable question displayed in UI';
COMMENT ON COLUMN questions.display_order IS 'Order in which questions appear in the UI';
