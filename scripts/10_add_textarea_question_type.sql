-- Migration: Add 'textarea' as a valid question_type
-- This fixes the check constraint violation when creating textarea questions

-- Drop the old constraint
ALTER TABLE quiz_questions
DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;

-- Add the new constraint that includes 'textarea'
ALTER TABLE quiz_questions
ADD CONSTRAINT quiz_questions_question_type_check
CHECK (question_type IN ('radio', 'checkbox', 'textarea'));
