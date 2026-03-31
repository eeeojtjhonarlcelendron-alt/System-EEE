-- Fix the users_role_check constraint
-- First, drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add a new constraint with all valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'team_leader', 'gas_staff'));

-- Verify the constraint
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name = 'users_role_check';
