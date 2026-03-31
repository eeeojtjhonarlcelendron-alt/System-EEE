-- Insert demo users to fix 401 errors
-- These users match the demo accounts in AuthContext

INSERT INTO users (id, email, name, role, hub_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@fuel.com', 'Admin User', 'admin', NULL, now()),
  ('550e8400-e29b-41d4-a716-446655440001', 'leader@fuel.com', 'Team Leader', 'team_leader', 1, now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'staff@fuel.com', 'Gas Station Staff', 'gasoline_staff', NULL, now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  hub_id = EXCLUDED.hub_id;

-- Verify insertion
SELECT 'Users after insert:' as info;
SELECT id, email, name, role, hub_id FROM users;
