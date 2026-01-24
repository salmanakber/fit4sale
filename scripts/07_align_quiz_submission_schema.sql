-- Align quiz_submissions schema with the current app code (submit-survey + admin workflow)
-- Safe to run multiple times (uses IF NOT EXISTS / DROP NOT NULL)

-- quiz_submissions: allow submissions that only provide email + answers
ALTER TABLE quiz_submissions
  ALTER COLUMN patient_name DROP NOT NULL;

-- store the raw answers payload (submitted from the step-by-step quiz)
ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS answers JSONB;

-- track when the participant submitted (separate from created_at)
ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- make sure patient_email exists and is populated (admin UI relies on it)
ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS patient_email TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_patient_email ON quiz_submissions(patient_email);
