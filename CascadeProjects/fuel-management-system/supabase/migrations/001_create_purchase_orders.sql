-- Create users table for storing user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_leader', 'gasoline_staff')),
  hub_id INTEGER,
  station_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on users role for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policy for admins to manage all users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  po_number TEXT NOT NULL UNIQUE,
  rider_id TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  fleet_type TEXT NOT NULL CHECK (fleet_type IN ('2_wheels', '3_wheels', '4_wheels', 'LH')),
  operator_hub TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Used')),
  receipt_url TEXT,
  qr_code TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on po_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Create index on rider_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rider_id ON purchase_orders(rider_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Enable Row Level Security
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all records
CREATE POLICY "Admins can manage all purchase orders"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for team leaders to view and manage riders in their hub
CREATE POLICY "Team leaders can view their hub purchase orders"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'team_leader'
    )
  );

-- Create function to generate PO number automatically
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.po_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('po_sequence')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for PO numbers
CREATE SEQUENCE IF NOT EXISTS po_sequence START 1;

-- Create trigger to auto-generate PO number
CREATE TRIGGER set_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_po_number();
