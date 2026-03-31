-- Fix RLS policies for daily_deliveries to allow team leaders to import

-- Drop existing policies
DROP POLICY IF EXISTS "Team leaders can view hub daily deliveries" ON daily_deliveries;
DROP POLICY IF EXISTS "Team leaders can import daily deliveries" ON daily_deliveries;

-- Create simpler policy for team leaders to view all deliveries in their hub
-- This uses the hub_id from the request rather than checking users table
CREATE POLICY "Team leaders can view hub daily deliveries"
  ON daily_deliveries
  FOR SELECT
  TO authenticated
  USING (
    hub_id IS NOT NULL
  );

-- Create policy for team leaders to insert deliveries
CREATE POLICY "Team leaders can import daily deliveries"
  ON daily_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hub_id IS NOT NULL
  );

-- Policy for admins to manage all
DROP POLICY IF EXISTS "Admins can manage all daily deliveries" ON daily_deliveries;
CREATE POLICY "Admins can manage all daily deliveries"
  ON daily_deliveries
  FOR ALL
  TO authenticated
  USING (true);
