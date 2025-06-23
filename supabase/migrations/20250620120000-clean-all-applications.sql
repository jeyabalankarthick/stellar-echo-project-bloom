
-- Clean all applications and related data
DELETE FROM approval_tokens;
DELETE FROM applications;

-- Reset the sequence to start from 1
ALTER SEQUENCE applications_id_seq RESTART WITH 1;

-- Also reset approval_tokens sequence if it exists
ALTER SEQUENCE IF EXISTS approval_tokens_id_seq RESTART WITH 1;
