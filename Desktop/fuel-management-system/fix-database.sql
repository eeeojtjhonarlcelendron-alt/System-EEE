-- FORCE RECREATE: Drop everything and start fresh
-- WARNING: This will delete all transaction data!

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS fuel_transactions CASCADE;
DROP TABLE IF EXISTS fuel_requests CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now recreate everything fresh

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'team_leader', 'gas_staff')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. VEHICLES TABLE
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  fuel_limit DECIMAL(10,2) DEFAULT 100.00,
  fuel_limit_period VARCHAR(20) DEFAULT 'weekly',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. FUEL REQUESTS TABLE
CREATE TABLE fuel_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  fuel_type VARCHAR(50) NOT NULL,
  liters DECIMAL(10,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  qr_code TEXT UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  expires_at TIMESTAMP,
  date_created TIMESTAMP DEFAULT NOW(),
  date_used TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  notes TEXT
);

-- 4. FUEL TRANSACTIONS TABLE (WITH transaction_date!)
CREATE TABLE fuel_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES fuel_requests(id),
  fuel_given DECIMAL(10,2) NOT NULL,
  gas_staff_id UUID REFERENCES users(id),
  transaction_date TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX idx_fuel_requests_status ON fuel_requests(status);
CREATE INDEX idx_fuel_requests_qr ON fuel_requests(qr_code);
CREATE INDEX idx_fuel_transactions_date ON fuel_transactions(transaction_date);

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fuel_transactions';
