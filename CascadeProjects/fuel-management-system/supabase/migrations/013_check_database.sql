-- DIAGNOSTIC SCRIPT - Run this to see what's wrong
-- This will show table structures and RLS status

-- 1. Check if tables exist
SELECT 'TABLES EXIST:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('riders', 'daily_deliveries', 'hubs', 'users', 'fuel_transactions', 'team_leaders', 'gas_stations', 'purchase_orders')
ORDER BY table_name;

-- 2. Check riders table columns
SELECT 'RIDERS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'riders'
ORDER BY ordinal_position;

-- 3. Check daily_deliveries columns
SELECT 'DAILY_DELIVERIES COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_deliveries'
ORDER BY ordinal_position;

-- 4. Check RLS status
SELECT 'RLS STATUS:' as info;
SELECT relname as table_name, relrowsecurity as rls_enabled
FROM pg_class
WHERE relname IN ('riders', 'daily_deliveries', 'hubs', 'users')
AND relkind = 'r';

-- 5. Check for any data
SELECT 'DATA COUNT:' as info;
SELECT 'riders' as table_name, COUNT(*) as row_count FROM riders
UNION ALL
SELECT 'daily_deliveries', COUNT(*) FROM daily_deliveries
UNION ALL
SELECT 'hubs', COUNT(*) FROM hubs
UNION ALL
SELECT 'users', COUNT(*) FROM users;
