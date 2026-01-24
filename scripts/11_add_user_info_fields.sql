-- Migration: Add first_name, last_name, and title fields to quiz_submissions
-- This allows proper personalization in emails (Sehr geehrte(r) [Title] [Last Name])

ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS title TEXT CHECK (title IN ('Herr', 'Frau', NULL));

ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE quiz_submissions
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_name ON quiz_submissions(first_name, last_name);
