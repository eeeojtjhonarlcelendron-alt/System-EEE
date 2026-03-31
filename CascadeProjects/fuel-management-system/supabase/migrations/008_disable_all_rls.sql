-- DEBUG: Completely disable RLS on all tables for testing
-- Run this to eliminate RLS as the cause of 401 errors

-- Disable RLS on riders
ALTER TABLE riders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on daily_deliveries
ALTER TABLE daily_deliveries DISABLE ROW LEVEL SECURITY;

-- Disable RLS on fuel_transactions
ALTER TABLE fuel_transactions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on hubs
ALTER TABLE hubs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on team_leaders
ALTER TABLE team_leaders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on gas_stations
ALTER TABLE gas_stations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on purchase_orders
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
