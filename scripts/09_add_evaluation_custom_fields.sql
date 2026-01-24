-- Allow dynamic fields on evaluations/reports
ALTER TABLE evaluation_results
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;
