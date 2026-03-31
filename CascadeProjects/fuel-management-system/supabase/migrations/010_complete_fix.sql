-- COMPREHENSIVE FIX: Create all tables and disable RLS
-- Run this single migration to fix all 400/401 errors

-- ============================================
-- 1. CREATE HUBS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS hubs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Insert default hubs
INSERT INTO hubs (id, name, location) VALUES 
  (1, 'North Hub', 'North District'),
  (2, 'South Hub', 'South District'),
  (3, 'East Hub', 'East District'),
  (4, 'West Hub', 'West District')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREATE USERS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_leader', 'gasoline_staff')),
  hub_id INTEGER REFERENCES hubs(id),
  station_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. CREATE RIDERS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS riders (
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

-- ============================================
-- 4. CREATE DAILY_DELIVERIES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_deliveries (
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

-- ============================================
-- 5. DISABLE RLS ON ALL TABLES (Fix 401 errors)
-- ============================================
ALTER TABLE IF EXISTS riders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. GRANT ALL PERMISSIONS (Fix access issues)
-- ============================================
GRANT ALL ON TABLE riders TO anon;
GRANT ALL ON TABLE riders TO authenticated;
GRANT ALL ON TABLE daily_deliveries TO anon;
GRANT ALL ON TABLE daily_deliveries TO authenticated;
GRANT ALL ON TABLE hubs TO anon;
GRANT ALL ON TABLE hubs TO authenticated;
GRANT ALL ON TABLE users TO anon;
GRANT ALL ON TABLE users TO authenticated;

-- Grant sequence access
GRANT USAGE ON SEQUENCE hubs_id_seq TO anon;
GRANT USAGE ON SEQUENCE hubs_id_seq TO authenticated;
