-- Align foreign keys to quiz_submissions (current app flow)
-- This project previously used survey_submissions; the app now uses quiz_submissions.
-- Safe to run multiple times.

-- 1) evaluation_results.submission_id should reference quiz_submissions(id)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE contype = 'f'
    AND conrelid = 'evaluation_results'::regclass
    AND pg_get_constraintdef(oid) LIKE '%(submission_id)%survey_submissions%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE evaluation_results DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE evaluation_results
  ADD CONSTRAINT IF NOT EXISTS evaluation_results_submission_id_fkey
  FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE;

-- 2) admin_logs.submission_id should reference quiz_submissions(id)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE contype = 'f'
    AND conrelid = 'admin_logs'::regclass
    AND pg_get_constraintdef(oid) LIKE '%(submission_id)%survey_submissions%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE admin_logs DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE admin_logs
  ADD CONSTRAINT IF NOT EXISTS admin_logs_submission_id_fkey
  FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id) ON DELETE SET NULL;
