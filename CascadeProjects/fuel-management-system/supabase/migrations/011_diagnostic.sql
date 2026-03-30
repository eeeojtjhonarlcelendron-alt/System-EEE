-- DIAGNOSTIC: Check what's actually in your database
-- Run this to see the actual table structure

-- Check if tables exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('riders', 'daily_deliveries', 'hubs', 'users')
ORDER BY table_name, ordinal_position;

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('riders', 'daily_deliveries', 'hubs', 'users');
