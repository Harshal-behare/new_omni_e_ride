-- Create warranty registrations table for dealer warranty submissions
CREATE TABLE IF NOT EXISTS warranty_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    vehicle_model TEXT NOT NULL,
    model_id TEXT,
    vin TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    period_years INTEGER NOT NULL CHECK (period_years IN (1, 2, 3)),
    dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
    dealer_name TEXT NOT NULL,
    invoice_image_url TEXT,
    signature_data_url TEXT,
    review_status TEXT DEFAULT 'PendingReview' CHECK (review_status IN ('PendingReview', 'Approved', 'Declined')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_dealer_id ON warranty_registrations(dealer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_customer_email ON warranty_registrations(customer_email);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_review_status ON warranty_registrations(review_status);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_created_at ON warranty_registrations(created_at);

-- Add RLS policies
ALTER TABLE warranty_registrations ENABLE ROW LEVEL SECURITY;

-- Dealers can view their own warranty registrations
CREATE POLICY "Dealers can view own warranty registrations" ON warranty_registrations
    FOR SELECT
    USING (
        dealer_id IN (
            SELECT id FROM dealers WHERE user_id = auth.uid()
        )
    );

-- Dealers can create warranty registrations
CREATE POLICY "Dealers can create warranty registrations" ON warranty_registrations
    FOR INSERT
    WITH CHECK (
        dealer_id IN (
            SELECT id FROM dealers WHERE user_id = auth.uid()
        )
    );

-- Dealers can update their own warranty registrations
CREATE POLICY "Dealers can update own warranty registrations" ON warranty_registrations
    FOR UPDATE
    USING (
        dealer_id IN (
            SELECT id FROM dealers WHERE user_id = auth.uid()
        )
    );

-- Admins can do everything
CREATE POLICY "Admins have full access to warranty registrations" ON warranty_registrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_warranty_registrations_updated_at BEFORE UPDATE ON warranty_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
