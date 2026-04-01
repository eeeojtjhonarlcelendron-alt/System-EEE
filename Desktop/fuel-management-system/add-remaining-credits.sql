-- Add remaining_credits column to fuel_requests table to track partial usage
ALTER TABLE fuel_requests ADD COLUMN IF NOT EXISTS remaining_credits DECIMAL(10,2) DEFAULT NULL;

-- Add last_verified_at timestamp column
ALTER TABLE fuel_requests ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add last_verified_by column (foreign key to users table)
ALTER TABLE fuel_requests ADD COLUMN IF NOT EXISTS last_verified_by UUID DEFAULT NULL;

-- Update existing records to set remaining_credits = liters if not used
UPDATE fuel_requests 
SET remaining_credits = liters 
WHERE status = 'unused' AND remaining_credits IS NULL;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fuel_requests' 
ORDER BY ordinal_position;
