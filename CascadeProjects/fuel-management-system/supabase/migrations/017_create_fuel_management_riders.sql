-- Create fuel_management_riders table for fuel-management-system
CREATE TABLE IF NOT EXISTS fuel_management_riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rider_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  fleet_type TEXT NOT NULL CHECK (fleet_type IN ('2_wheels', '3_wheels', '4_wheels', 'LH')),
  hub_id INTEGER REFERENCES hubs(id),
  is_lh_driver BOOLEAN DEFAULT false,
  credit NUMERIC(10, 2) DEFAULT 0,
  qr_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on rider_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_fuel_management_riders_rider_id ON fuel_management_riders(rider_id);

-- Create index on hub_id for filtering by hub
CREATE INDEX IF NOT EXISTS idx_fuel_management_riders_hub_id ON fuel_management_riders(hub_id);

-- Create index on fleet_type for filtering
CREATE INDEX IF NOT EXISTS idx_fuel_management_riders_fleet_type ON fuel_management_riders(fleet_type);

-- Enable Row Level Security
ALTER TABLE fuel_management_riders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all fuel_management_riders" ON fuel_management_riders;
DROP POLICY IF EXISTS "Team leaders can view hub fuel_management_riders" ON fuel_management_riders;
DROP POLICY IF EXISTS "Gas staff can view all fuel_management_riders" ON fuel_management_riders;

-- Create policy for admins to manage all fuel_management_riders
CREATE POLICY "Admins can manage all fuel_management_riders"
  ON fuel_management_riders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for team leaders to view riders in their hub
CREATE POLICY "Team leaders can view hub fuel_management_riders"
  ON fuel_management_riders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'team_leader'
      AND users.hub_id = fuel_management_riders.hub_id
    )
  );

-- Create policy for gas station staff to view all riders (for QR validation)
CREATE POLICY "Gas staff can view all fuel_management_riders"
  ON fuel_management_riders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'gasoline_staff'
    )
  );

-- Grant permissions
GRANT ALL ON fuel_management_riders TO authenticated;
GRANT ALL ON fuel_management_riders TO anon;
