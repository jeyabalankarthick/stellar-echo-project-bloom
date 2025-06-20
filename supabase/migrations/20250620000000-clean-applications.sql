
-- Clean all applications to start fresh
DELETE FROM approval_tokens;
DELETE FROM applications;

-- Reset the sequence if needed
ALTER SEQUENCE applications_id_seq RESTART WITH 1;
