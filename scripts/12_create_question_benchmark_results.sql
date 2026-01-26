-- Create table for storing per-question benchmark validation results
CREATE TABLE IF NOT EXISTS question_benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  benchmark_score INTEGER NOT NULL,
  achieved_score INTEGER NOT NULL,
  deviation INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

CREATE INDEX idx_question_benchmark_submission ON question_benchmark_results(submission_id);
CREATE INDEX idx_question_benchmark_question ON question_benchmark_results(question_id);

-- Enable RLS
ALTER TABLE question_benchmark_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to view question benchmark results" 
  ON question_benchmark_results FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage question benchmark results" 
  ON question_benchmark_results FOR ALL USING (true);

-- Update evaluation_results_cache to include detailed breakdown
ALTER TABLE evaluation_results_cache 
  ADD COLUMN IF NOT EXISTS total_benchmark_score INTEGER;
ALTER TABLE evaluation_results_cache 
  ADD COLUMN IF NOT EXISTS total_achieved_score INTEGER;
ALTER TABLE evaluation_results_cache 
  ADD COLUMN IF NOT EXISTS overall_deviation INTEGER;
ALTER TABLE evaluation_results_cache 
  ADD COLUMN IF NOT EXISTS question_breakdown JSONB;
