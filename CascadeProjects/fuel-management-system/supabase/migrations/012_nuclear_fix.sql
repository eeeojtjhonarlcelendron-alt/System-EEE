-- NUCLEAR OPTION: Drop and recreate all tables fresh
-- WARNING: This deletes all data!

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS daily_deliveries CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hubs CASCADE;

-- Recreate hubs table
CREATE TABLE hubs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Insert default hubs
INSERT INTO hubs (name, location) VALUES 
  ('North Hub', 'North District'),
  ('South Hub', 'South District'),
  ('East Hub', 'East District'),
  ('West Hub', 'West District');

-- Recreate users table (simplified - no auth dependency)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_leader', 'gasoline_staff')),
  hub_id INTEGER REFERENCES hubs(id),
  station_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recreate riders table
CREATE TABLE riders (
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
  created_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_riders_hub_id ON riders(hub_id);
CREATE INDEX idx_riders_rider_id ON riders(rider_id);

-- Recreate daily_deliveries table
CREATE TABLE daily_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL,
  rider_id TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  fleet_type TEXT NOT NULL CHECK (fleet_type IN ('2_wheels', '3_wheels', '4_wheels', 'line_haul')),
  hub_id INTEGER REFERENCES hubs(id),
  hub_name TEXT NOT NULL,
  imported_by UUID REFERENCES users(id),
  import_batch_id UUID DEFAULT gen_random_uuid()
);

-- Create indexes
CREATE INDEX idx_daily_deliveries_hub_id ON daily_deliveries(hub_id);
CREATE INDEX idx_daily_deliveries_date ON daily_deliveries(date);

-- Disable RLS completely on all tables
ALTER TABLE hubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE riders DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deliveries DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
