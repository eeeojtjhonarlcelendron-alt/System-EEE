import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'fuel-management-auth',
    storage: localStorage
  }
})

// Database Schema Setup (to be run in Supabase SQL Editor)
export const setupDatabase = async () => {
  // This should be run in Supabase SQL Editor
  const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'team_leader', 'gas_staff')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  fuel_limit DECIMAL(10,2) DEFAULT 100.00,
  fuel_limit_period VARCHAR(20) DEFAULT 'weekly',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fuel Requests table
CREATE TABLE IF NOT EXISTS fuel_requests (
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

-- Fuel Transactions table
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES fuel_requests(id),
  fuel_given DECIMAL(10,2) NOT NULL,
  gas_staff_id UUID REFERENCES users(id),
  transaction_date TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_requests_status ON fuel_requests(status);
CREATE INDEX IF NOT EXISTS idx_fuel_requests_qr ON fuel_requests(qr_code);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(transaction_date);
  `
  console.log('Run this schema in Supabase SQL Editor:', schema)
}
