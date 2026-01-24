-- Create quiz intro settings table
CREATE TABLE IF NOT EXISTS quiz_intro_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Fitness Evaluation Survey',
  description TEXT NOT NULL DEFAULT 'Help us understand your fitness background and goals so we can provide personalized recommendations.',
  estimated_time TEXT NOT NULL DEFAULT '8-10 minutes',
  button_text TEXT NOT NULL DEFAULT 'Start Assessment',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('radio', 'checkbox')),
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz answer options table
CREATE TABLE IF NOT EXISTS quiz_answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_value TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz submissions table (replacing the old survey_submissions structure)
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  age_group TEXT,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz responses table (stores answers to individual questions)
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_values TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_options_question_id ON quiz_answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_email ON quiz_submissions(patient_email);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_submission_id ON quiz_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question_id ON quiz_responses(question_id);

-- Enable RLS
ALTER TABLE quiz_intro_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz intro settings (public can read, admins can update)
CREATE POLICY "Allow public to read intro settings" 
ON quiz_intro_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow admins to update intro settings" 
ON quiz_intro_settings FOR UPDATE 
USING (true);

-- RLS Policies for quiz questions (public can read)
CREATE POLICY "Allow public to read questions" 
ON quiz_questions FOR SELECT 
USING (true);

-- RLS Policies for quiz answer options (public can read)
CREATE POLICY "Allow public to read answer options" 
ON quiz_answer_options FOR SELECT 
USING (true);

-- RLS Policies for quiz submissions (public can insert)
CREATE POLICY "Allow public to submit quiz" 
ON quiz_submissions FOR INSERT 
WITH CHECK (true);

-- RLS Policies for quiz responses (public can insert)
CREATE POLICY "Allow public to save responses" 
ON quiz_responses FOR INSERT 
WITH CHECK (true);

-- Insert default intro settings
INSERT INTO quiz_intro_settings (id, title, description, estimated_time, button_text)
VALUES (
  gen_random_uuid(),
  'Fitness Evaluation Survey',
  'Help us understand your fitness background and goals so we can provide personalized recommendations.',
  '8-10 minutes',
  'Start Assessment'
)
ON CONFLICT DO NOTHING;
