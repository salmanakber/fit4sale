-- Add score column to quiz_answer_options table for point-based scoring
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_answer_options' AND column_name = 'score') THEN
    ALTER TABLE quiz_answer_options 
    ADD COLUMN score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100);
  END IF;
END $$;

-- Add category column to quiz_questions for categorizing questions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'category') THEN
    ALTER TABLE quiz_questions 
    ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_answer_options_score ON quiz_answer_options(score);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
