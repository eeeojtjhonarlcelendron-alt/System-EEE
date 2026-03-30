-- Create fuel_transactions table for Team Leader dashboard
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  rider_id TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  station_id UUID REFERENCES gas_stations(id),
  station_name TEXT NOT NULL,
  hub_id INTEGER REFERENCES hubs(id),
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full_tank', 'credit')),
  po_number TEXT REFERENCES purchase_orders(po_number),
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create index on date for filtering
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(date);

-- Create index on rider_id for filtering
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_rider_id ON fuel_transactions(rider_id);

-- Create index on hub_id for Team Leader filtering
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_hub_id ON fuel_transactions(hub_id);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_type ON fuel_transactions(type);

-- Enable Row Level Security
ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all transactions
CREATE POLICY "Admins can manage all fuel transactions"
  ON fuel_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for team leaders to view transactions in their hub
CREATE POLICY "Team leaders can view hub fuel transactions"
  ON fuel_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'team_leader'
      AND users.hub_id = fuel_transactions.hub_id
    )
  );

-- Create policy for gas station staff to create transactions
CREATE POLICY "Gas staff can create fuel transactions"
  ON fuel_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'gasoline_staff'
    )
  );

-- Create policy for gas station staff to view their station transactions
CREATE POLICY "Gas staff can view station fuel transactions"
  ON fuel_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'gasoline_staff'
    )
  );
