-- Fix column types and constraints for proper API queries

-- Check if riders table has correct columns
DO $$
BEGIN
  -- Ensure hub_id is INTEGER type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'riders' AND column_name = 'hub_id' 
             AND data_type != 'integer') THEN
    ALTER TABLE riders ALTER COLUMN hub_id TYPE INTEGER USING hub_id::INTEGER;
  END IF;
  
  -- Ensure hub_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'riders' AND column_name = 'hub_id') THEN
    ALTER TABLE riders ADD COLUMN hub_id INTEGER;
  END IF;
END $$;

-- Check daily_deliveries columns
DO $$
BEGIN
  -- Ensure hub_id is INTEGER type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'daily_deliveries' AND column_name = 'hub_id' 
             AND data_type != 'integer') THEN
    ALTER TABLE daily_deliveries ALTER COLUMN hub_id TYPE INTEGER USING hub_id::INTEGER;
  END IF;
END $$;

-- Grant all permissions to authenticated users
GRANT ALL ON TABLE riders TO authenticated;
GRANT ALL ON TABLE daily_deliveries TO authenticated;
GRANT ALL ON TABLE fuel_transactions TO authenticated;
GRANT ALL ON TABLE hubs TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE team_leaders TO authenticated;
GRANT ALL ON TABLE gas_stations TO authenticated;
GRANT ALL ON TABLE purchase_orders TO authenticated;

-- Also grant to anon for debugging
GRANT ALL ON TABLE riders TO anon;
GRANT ALL ON TABLE daily_deliveries TO anon;
GRANT ALL ON TABLE fuel_transactions TO anon;
GRANT ALL ON TABLE hubs TO anon;
GRANT ALL ON TABLE gas_stations TO anon;
GRANT ALL ON TABLE purchase_orders TO anon;
