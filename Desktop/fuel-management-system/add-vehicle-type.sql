-- Add vehicle_type column to fuel_requests table
ALTER TABLE fuel_requests ADD COLUMN vehicle_type TEXT;

-- Verify the column was added
SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_requests';
