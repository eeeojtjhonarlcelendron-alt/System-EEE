-- PURE SQL - NO TEXT COMMENTS - COPY AND PASTE THIS ONLY

DROP TABLE IF EXISTS fuel_transactions CASCADE;

CREATE TABLE fuel_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES fuel_requests(id),
    fuel_given DECIMAL(10,2) NOT NULL,
    gas_staff_id UUID REFERENCES users(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX idx_fuel_transactions_date ON fuel_transactions(transaction_date);

SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_transactions';
