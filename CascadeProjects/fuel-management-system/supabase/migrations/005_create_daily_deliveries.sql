-- Create daily_deliveries table for rider delivery data
CREATE TABLE IF NOT EXISTS daily_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL,
  rider_id TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  fleet_type TEXT NOT NULL CHECK (fleet_type IN ('2_wheels', '3_wheels', '4_wheels', 'line_haul')),
  hub_id INTEGER REFERENCES hubs(id),
  hub_name TEXT NOT NULL,
  imported_by UUID REFERENCES auth.users(id),
  import_batch_id UUID DEFAULT gen_random_uuid()
);

-- Create index on date for filtering
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_date ON daily_deliveries(date);

-- Create index on rider_id for lookups
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_rider_id ON daily_deliveries(rider_id);

-- Create index on hub_id for Team Leader filtering
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_hub_id ON daily_deliveries(hub_id);

-- Create index on import_batch_id for grouping imports
CREATE INDEX IF NOT EXISTS idx_daily_deliveries_batch ON daily_deliveries(import_batch_id);

-- Enable Row Level Security
ALTER TABLE daily_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all deliveries
CREATE POLICY "Admins can manage all daily deliveries"
  ON daily_deliveries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for team leaders to view deliveries in their hub
CREATE POLICY "Team leaders can view hub daily deliveries"
  ON daily_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'team_leader'
      AND users.hub_id = daily_deliveries.hub_id
    )
  );

-- Create policy for team leaders to import deliveries for their hub
CREATE POLICY "Team leaders can import daily deliveries"
  ON daily_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'team_leader'
      AND users.hub_id = daily_deliveries.hub_id
    )
  );
