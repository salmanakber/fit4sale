-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create survey submissions table
CREATE TABLE IF NOT EXISTS survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  age_group TEXT,
  gender TEXT,
  current_activity_level TEXT,
  health_goals TEXT,
  injuries_conditions TEXT,
  equipment_access TEXT,
  time_available TEXT,
  fitness_experience TEXT,
  motivation TEXT,
  challenges TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create evaluation results table
CREATE TABLE IF NOT EXISTS evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES survey_submissions(id) ON DELETE CASCADE,
  fitness_level_score INTEGER,
  readiness_score INTEGER,
  recommended_program TEXT,
  safety_concerns TEXT,
  personalized_recommendations TEXT,
  program_duration TEXT,
  intensity_level TEXT,
  special_modifications TEXT,
  follow_up_date DATE,
  evaluation_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  submission_id UUID REFERENCES survey_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_survey_submissions_email ON survey_submissions(patient_email);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_created_at ON survey_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_submission_id ON evaluation_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- Enable Row Level Security
ALTER TABLE survey_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public survey submissions (anyone can insert)
CREATE POLICY "Allow public survey submission" 
ON survey_submissions FOR INSERT 
WITH CHECK (true);

-- RLS Policies for evaluation results (anyone can view/edit for now, will be restricted later)
CREATE POLICY "Allow viewing evaluation results" 
ON evaluation_results FOR SELECT 
USING (true);

CREATE POLICY "Allow creating evaluation results" 
ON evaluation_results FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow updating evaluation results" 
ON evaluation_results FOR UPDATE 
USING (true);

-- RLS Policies for admin logs
CREATE POLICY "Allow viewing admin logs" 
ON admin_logs FOR SELECT 
USING (true);

CREATE POLICY "Allow creating admin logs" 
ON admin_logs FOR INSERT 
WITH CHECK (true);
