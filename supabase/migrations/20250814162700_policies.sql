-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    
    -- Vehicles policies
    DROP POLICY IF EXISTS "Anyone can view vehicles" ON vehicles;
    DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;
    
    -- Dealers policies
    DROP POLICY IF EXISTS "Anyone can view approved dealers" ON dealers;
    DROP POLICY IF EXISTS "Dealers can view own record" ON dealers;
    DROP POLICY IF EXISTS "Admins can manage dealers" ON dealers;
    
    -- Dealer applications policies
    DROP POLICY IF EXISTS "Anyone can submit dealer application" ON dealer_applications;
    DROP POLICY IF EXISTS "Users can view own applications" ON dealer_applications;
    DROP POLICY IF EXISTS "Admins can manage applications" ON dealer_applications;
    
    -- Orders policies
    DROP POLICY IF EXISTS "Users can create own orders" ON orders;
    DROP POLICY IF EXISTS "Users can view own orders" ON orders;
    DROP POLICY IF EXISTS "Dealers can view assigned orders" ON orders;
    DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
    
    -- Payments policies
    DROP POLICY IF EXISTS "Users can view own payments" ON payments;
    DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
    
    -- Leads policies
    DROP POLICY IF EXISTS "Anyone can create leads" ON leads;
    DROP POLICY IF EXISTS "Dealers can view assigned leads" ON leads;
    DROP POLICY IF EXISTS "Admins can manage leads" ON leads;
    
    -- Test rides policies
    DROP POLICY IF EXISTS "Anyone can book test rides" ON test_rides;
    DROP POLICY IF EXISTS "Users can view own test rides" ON test_rides;
    DROP POLICY IF EXISTS "Dealers can view assigned test rides" ON test_rides;
    DROP POLICY IF EXISTS "Admins can manage test rides" ON test_rides;
    
    -- Notifications policies
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    
    -- Warranties policies
    DROP POLICY IF EXISTS "Users can view own warranties" ON warranties;
    DROP POLICY IF EXISTS "Admins can manage warranties" ON warranties;
    
    -- Contact inquiries policies
    DROP POLICY IF EXISTS "Anyone can create inquiries" ON contact_inquiries;
    DROP POLICY IF EXISTS "Admins can manage inquiries" ON contact_inquiries;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- VEHICLES POLICIES
-- Anyone can view vehicles (public access)
CREATE POLICY "Anyone can view vehicles" ON vehicles
    FOR SELECT USING (true);

-- Only admins can manage vehicles
CREATE POLICY "Admins can manage vehicles" ON vehicles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- DEALERS POLICIES
-- Anyone can view approved dealers
CREATE POLICY "Anyone can view approved dealers" ON dealers
    FOR SELECT USING (status = 'approved');

-- Dealers can view their own record
CREATE POLICY "Dealers can view own record" ON dealers
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all dealers
CREATE POLICY "Admins can manage dealers" ON dealers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- DEALER APPLICATIONS POLICIES
-- Anyone authenticated can submit an application
CREATE POLICY "Anyone can submit dealer application" ON dealer_applications
    FOR INSERT WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON dealer_applications
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all applications
CREATE POLICY "Admins can manage applications" ON dealer_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDERS POLICIES
-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

-- Dealers can view orders assigned to them
CREATE POLICY "Dealers can view assigned orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dealers 
            WHERE dealers.id = orders.dealer_id 
            AND dealers.user_id = auth.uid()
        )
    );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PAYMENTS POLICIES
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- LEADS POLICIES
-- Anyone can create leads (for marketing forms)
CREATE POLICY "Anyone can create leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Dealers can view leads assigned to them
CREATE POLICY "Dealers can view assigned leads" ON leads
    FOR SELECT USING (
        dealer_id IN (
            SELECT id FROM dealers WHERE user_id = auth.uid()
        )
    );

-- Admins can manage all leads
CREATE POLICY "Admins can manage leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- TEST RIDES POLICIES
-- Anyone can book test rides
CREATE POLICY "Anyone can book test rides" ON test_rides
    FOR INSERT WITH CHECK (true);

-- Users can view their own test rides
CREATE POLICY "Users can view own test rides" ON test_rides
    FOR SELECT USING (user_id = auth.uid());

-- Dealers can view test rides assigned to them
CREATE POLICY "Dealers can view assigned test rides" ON test_rides
    FOR SELECT USING (
        dealer_id IN (
            SELECT id FROM dealers WHERE user_id = auth.uid()
        )
    );

-- Admins can manage all test rides
CREATE POLICY "Admins can manage test rides" ON test_rides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- NOTIFICATIONS POLICIES
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- WARRANTIES POLICIES
-- Users can view their own warranties
CREATE POLICY "Users can view own warranties" ON warranties
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all warranties
CREATE POLICY "Admins can manage warranties" ON warranties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- CONTACT INQUIRIES POLICIES
-- Anyone can create contact inquiries
CREATE POLICY "Anyone can create inquiries" ON contact_inquiries
    FOR INSERT WITH CHECK (true);

-- Only admins can view and manage inquiries
CREATE POLICY "Admins can manage inquiries" ON contact_inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
