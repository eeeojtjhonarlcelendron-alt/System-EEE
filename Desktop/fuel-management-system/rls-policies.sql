-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For Fuel Management System
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Admin can do everything on users
CREATE POLICY "Admin full access on users" ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Users can view their own profile
CREATE POLICY "Users view own profile" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- VEHICLES TABLE POLICIES
-- ============================================

-- Admin can do everything
CREATE POLICY "Admin full access on vehicles" ON vehicles
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- All authenticated users can view vehicles
CREATE POLICY "All users view vehicles" ON vehicles
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- FUEL REQUESTS TABLE POLICIES
-- ============================================

-- Admin can do everything
CREATE POLICY "Admin full access on fuel_requests" ON fuel_requests
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Team Leaders can view and create their own requests
CREATE POLICY "Team Leaders own requests" ON fuel_requests
    FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid() 
        AND auth.uid() IN (
            SELECT id FROM users WHERE role = 'team_leader'
        )
    );

-- Gas Staff can view all pending requests (for scanning)
CREATE POLICY "Gas Staff view pending requests" ON fuel_requests
    FOR SELECT
    TO authenticated
    USING (
        status = 'unused'
        AND auth.uid() IN (
            SELECT id FROM users WHERE role = 'gas_staff'
        )
    );

-- Gas Staff can update status (verify fuel)
CREATE POLICY "Gas Staff update requests" ON fuel_requests
    FOR UPDATE
    TO authenticated
    USING (
        status = 'unused'
        AND auth.uid() IN (
            SELECT id FROM users WHERE role = 'gas_staff'
        )
    )
    WITH CHECK (
        status = 'used'
        AND verified_by = auth.uid()
    );

-- ============================================
-- FUEL TRANSACTIONS TABLE POLICIES
-- ============================================

-- Admin can do everything
CREATE POLICY "Admin full access on fuel_transactions" ON fuel_transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Gas Staff can view and create their own transactions
CREATE POLICY "Gas Staff own transactions" ON fuel_transactions
    FOR ALL
    TO authenticated
    USING (
        gas_staff_id = auth.uid()
        AND auth.uid() IN (
            SELECT id FROM users WHERE role = 'gas_staff'
        )
    );

-- All authenticated users can view transactions
CREATE POLICY "All users view transactions" ON fuel_transactions
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- ENABLE REALTIME (Optional)
-- ============================================

-- Enable realtime for fuel_requests
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_requests;

-- ============================================
-- FUNCTIONS FOR QR VALIDATION
-- ============================================

-- Function to verify QR code
CREATE OR REPLACE FUNCTION verify_fuel_request(
    p_request_id UUID,
    p_gas_staff_id UUID,
    p_fuel_given NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_result JSONB;
BEGIN
    -- Get the request
    SELECT * INTO v_request
    FROM fuel_requests
    WHERE id = p_request_id
    AND status = 'unused'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired QR code'
        );
    END IF;
    
    -- Update request status
    UPDATE fuel_requests
    SET status = 'used',
        date_used = NOW(),
        verified_by = p_gas_staff_id
    WHERE id = p_request_id;
    
    -- Create transaction record
    INSERT INTO fuel_transactions (
        request_id,
        fuel_given,
        gas_staff_id,
        transaction_date
    ) VALUES (
        p_request_id,
        p_fuel_given,
        p_gas_staff_id,
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fuel dispensed successfully'
    );
END;
$$;

-- ============================================
-- VIEWS FOR REPORTS
-- ============================================

-- View for fuel consumption summary
CREATE OR REPLACE VIEW fuel_consumption_summary AS
SELECT 
    v.plate_number,
    v.driver_name,
    v.department,
    fr.fuel_type,
    SUM(fr.liters) as total_liters,
    COUNT(fr.id) as total_requests,
    SUM(CASE WHEN fr.status = 'used' THEN 1 ELSE 0 END) as used_requests
FROM vehicles v
LEFT JOIN fuel_requests fr ON v.id = fr.vehicle_id
GROUP BY v.id, v.plate_number, v.driver_name, v.department, fr.fuel_type;

-- View for daily transactions
CREATE OR REPLACE VIEW daily_transactions AS
SELECT 
    DATE(ft.transaction_date) as date,
    u.name as gas_staff_name,
    v.plate_number,
    fr.fuel_type,
    ft.fuel_given,
    fr.qr_code
FROM fuel_transactions ft
JOIN users u ON ft.gas_staff_id = u.id
JOIN fuel_requests fr ON ft.request_id = fr.id
JOIN vehicles v ON fr.vehicle_id = v.id
ORDER BY ft.transaction_date DESC;

-- ============================================
-- TRIGGERS FOR AUDIT LOG
-- ============================================

-- Function to log changes
CREATE OR REPLACE FUNCTION log_fuel_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            RAISE NOTICE 'Fuel request % status changed from % to %', 
                NEW.id, OLD.status, NEW.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER fuel_request_audit
    AFTER UPDATE ON fuel_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_fuel_request_changes();

-- ============================================
-- ENABLE STORAGE FOR QR IMAGES (Optional)
-- ============================================

-- Create bucket for QR codes (run this in Storage section of Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('qr-codes', 'qr-codes', true);

-- Policy for QR code storage
-- CREATE POLICY "Public QR code access" ON storage.objects
--     FOR SELECT
--     TO public
--     USING (bucket_id = 'qr-codes');
