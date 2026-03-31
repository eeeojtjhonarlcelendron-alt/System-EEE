-- Create users table first (required by RLS policies)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_leader', 'gasoline_staff')),
  hub_id INTEGER,
  station_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on users role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policy for admins to manage users
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

-- Create hubs table (referenced by team_leaders)
CREATE TABLE IF NOT EXISTS hubs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Insert sample hubs
INSERT INTO hubs (name, location) VALUES
  ('North Hub', 'North District'),
  ('South Hub', 'South District'),
  ('East Hub', 'East District'),
  ('West Hub', 'West District')
ON CONFLICT DO NOTHING;

-- Create index on hub name
CREATE INDEX IF NOT EXISTS idx_hubs_name ON hubs(name);

-- Enable Row Level Security on hubs
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view hubs
CREATE POLICY "Anyone can view hubs"
  ON hubs
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create policy for admins to manage hubs
CREATE POLICY "Admins can manage hubs"
  ON hubs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create team_leaders table
CREATE TABLE IF NOT EXISTS team_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  hub_id INTEGER REFERENCES hubs(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_leaders_email ON team_leaders(email);

-- Create index on hub_id for filtering
CREATE INDEX IF NOT EXISTS idx_team_leaders_hub_id ON team_leaders(hub_id);

-- Enable Row Level Security
ALTER TABLE team_leaders ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all team leaders
CREATE POLICY "Admins can manage all team leaders"
  ON team_leaders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for team leaders to view their own record
CREATE POLICY "Team leaders can view own record"
  ON team_leaders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = team_leaders.email
    )
  );

-- Create gas_stations table
CREATE TABLE IF NOT EXISTS gas_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  partner_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on partner_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_gas_stations_partner_code ON gas_stations(partner_code);

-- Enable Row Level Security
ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all gas stations
CREATE POLICY "Admins can manage all gas stations"
  ON gas_stations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policy for anyone to view gas stations
CREATE POLICY "Anyone can view gas stations"
  ON gas_stations
  FOR SELECT
  TO authenticated, anon
  USING (true);
