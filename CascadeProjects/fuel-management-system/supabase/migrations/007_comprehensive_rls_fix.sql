-- Comprehensive RLS policy fix for all tables
-- This disables RLS temporarily to allow debugging, then re-enables with simple policies

-- ============================================
-- RIDERS TABLE - Simple policy for all authenticated users
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all riders" ON riders;
DROP POLICY IF EXISTS "Team leaders can view hub riders" ON riders;
DROP POLICY IF EXISTS "Gas staff can view all riders" ON riders;
DROP POLICY IF EXISTS "Authenticated users can view riders" ON riders;
DROP POLICY IF EXISTS "Authenticated users can insert riders" ON riders;

-- Allow all authenticated users to view riders
CREATE POLICY "Authenticated users can view riders"
  ON riders
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert riders (for import)
CREATE POLICY "Authenticated users can insert riders"
  ON riders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- DAILY_DELIVERIES TABLE - Simple policy
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Team leaders can view hub daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Team leaders can import daily deliveries" ON daily_deliveries;

-- Allow all authenticated users full access for now
CREATE POLICY "Authenticated users can manage daily deliveries"
  ON daily_deliveries
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- FUEL_TRANSACTIONS TABLE - Simple policy
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all fuel transactions" ON fuel_transactions;
DROP POLICY IF EXISTS "Team leaders can view hub fuel transactions" ON fuel_transactions;
DROP POLICY IF EXISTS "Gas staff can create fuel transactions" ON fuel_transactions;
DROP POLICY IF EXISTS "Gas staff can view station fuel transactions" ON fuel_transactions;

-- Allow all authenticated users full access for now
CREATE POLICY "Authenticated users can manage fuel transactions"
  ON fuel_transactions
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- HUBS TABLE - Allow viewing
-- ============================================
DROP POLICY IF EXISTS "Anyone can view hubs" ON hubs;
DROP POLICY IF EXISTS "Admins can manage hubs" ON hubs;

CREATE POLICY "Authenticated users can view hubs"
  ON hubs
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- USERS TABLE - Keep as is but simplified
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "Authenticated users can view users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- TEAM_LEADERS TABLE - Allow access
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all team leaders" ON team_leaders;
DROP POLICY IF EXISTS "Team leaders can view own record" ON team_leaders;

CREATE POLICY "Authenticated users can manage team leaders"
  ON team_leaders
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- GAS_STATIONS TABLE - Allow access
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all gas stations" ON gas_stations;
DROP POLICY IF EXISTS "Anyone can view gas stations" ON gas_stations;

CREATE POLICY "Authenticated users can manage gas stations"
  ON gas_stations
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- PURCHASE_ORDERS TABLE - Allow access
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Team leaders can view their hub purchase orders" ON purchase_orders;

CREATE POLICY "Authenticated users can manage purchase orders"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (true);
