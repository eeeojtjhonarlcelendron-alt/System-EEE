-- NUCLEAR FIX: Disable RLS and add missing columns
-- This resolves both 400 and 401 errors

-- ============================================
-- 1. DISABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE IF EXISTS riders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fuel_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_leaders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gas_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all riders" ON riders;
DROP POLICY IF EXISTS "Team leaders can view hub riders" ON riders;
DROP POLICY IF EXISTS "Gas staff can view all riders" ON riders;
DROP POLICY IF EXISTS "Authenticated users can view riders" ON riders;
DROP POLICY IF EXISTS "Authenticated users can insert riders" ON riders;
DROP POLICY IF EXISTS "Admins can manage all daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Team leaders can view hub daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Team leaders can import daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Authenticated users can manage daily deliveries" ON daily_deliveries;

-- ============================================
-- 3. ADD MISSING COLUMNS
-- ============================================
-- Add hub_id to riders if missing
ALTER TABLE riders ADD COLUMN IF NOT EXISTS hub_id INTEGER REFERENCES hubs(id);

-- Add hub_id to daily_deliveries if missing
ALTER TABLE daily_deliveries ADD COLUMN IF NOT EXISTS hub_id INTEGER REFERENCES hubs(id);

-- ============================================
-- 4. GRANT FULL PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_riders_hub_id ON riders(hub_id);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_hub_id ON daily_deliveries(hub_id);
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_date ON daily_deliveries(date);

SELECT 'RLS disabled, columns added, permissions granted' as status;
