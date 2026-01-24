-- Create benchmarks table for scoring configuration
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  benchmark_name TEXT NOT NULL,
  description TEXT,
  answer_value TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_question_id ON benchmarks(question_id);
CREATE INDEX idx_benchmarks_answer_value ON benchmarks(answer_value);

-- Create email audit log table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('partial', 'full', 'confirmation')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  sender_email TEXT DEFAULT 'aschwanden@kmu-beratungen.ch',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  admin_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_audit_submission ON email_audit_logs(submission_id);
CREATE INDEX idx_email_audit_email_type ON email_audit_logs(email_type);
CREATE INDEX idx_email_audit_created ON email_audit_logs(created_at);

-- Update quiz_submissions to include email and partial evaluation status
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS participant_email TEXT;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS partial_evaluation_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS full_evaluation_pending BOOLEAN DEFAULT TRUE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS full_evaluation_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS approved_by_admin TEXT;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

CREATE INDEX idx_submissions_email ON quiz_submissions(participant_email);
CREATE INDEX idx_submissions_status ON quiz_submissions(full_evaluation_pending);

-- Create evaluation_results_cache for storing calculated scores
CREATE TABLE IF NOT EXISTS evaluation_results_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  section_scores JSONB,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evaluation_cache_submission ON evaluation_results_cache(submission_id);

-- RLS Policies
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read benchmarks" ON benchmarks FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage benchmarks" ON benchmarks FOR ALL USING (true);

CREATE POLICY "Allow public to view email logs" ON email_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage email logs" ON email_audit_logs FOR ALL USING (true);

CREATE POLICY "Allow public to view evaluation cache" ON evaluation_results_cache FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage evaluation cache" ON evaluation_results_cache FOR ALL USING (true);
