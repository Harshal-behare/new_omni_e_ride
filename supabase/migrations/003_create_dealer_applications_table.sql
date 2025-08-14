-- Create dealer_applications table
CREATE TABLE IF NOT EXISTS public.dealer_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Company Information
    company_name TEXT NOT NULL,
    business_registration_number TEXT NOT NULL,
    tax_id TEXT,
    
    -- Contact Information
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    
    -- Address
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    
    -- Business Details
    years_in_business INTEGER,
    annual_revenue TEXT,
    existing_brands TEXT[],
    showroom_size_sqft INTEGER,
    number_of_employees INTEGER,
    website_url TEXT,
    
    -- Documents (stored in Supabase Storage)
    business_license_url TEXT,
    tax_certificate_url TEXT,
    bank_statement_url TEXT,
    additional_documents TEXT[],
    
    -- Application Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Agreement
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT, -- Admin only notes
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create dealer_metrics table for tracking dealer performance
CREATE TABLE IF NOT EXISTS public.dealer_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dealer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Sales Metrics
    total_sales INTEGER DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    monthly_sales INTEGER DEFAULT 0,
    monthly_revenue NUMERIC(12,2) DEFAULT 0,
    
    -- Inventory Metrics
    total_inventory INTEGER DEFAULT 0,
    reserved_units INTEGER DEFAULT 0,
    sold_units INTEGER DEFAULT 0,
    
    -- Performance Metrics
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    average_sale_value NUMERIC(10,2) DEFAULT 0,
    customer_satisfaction_score NUMERIC(3,2) DEFAULT 0,
    
    -- Period
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(dealer_id, period_month, period_year)
);

-- Create dealer_inventory table
CREATE TABLE IF NOT EXISTS public.dealer_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dealer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    
    -- Stock Information
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    
    -- Pricing
    dealer_price NUMERIC(10,2),
    minimum_price NUMERIC(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(dealer_id, vehicle_id)
);

-- Enable Row Level Security
ALTER TABLE public.dealer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for dealer_applications table

-- Users can view their own applications
CREATE POLICY "Users can view own dealer applications" ON public.dealer_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create dealer applications" ON public.dealer_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications" ON public.dealer_applications
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all dealer applications" ON public.dealer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all applications
CREATE POLICY "Admins can update all dealer applications" ON public.dealer_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for dealer_metrics table

-- Dealers can view their own metrics
CREATE POLICY "Dealers can view own metrics" ON public.dealer_metrics
    FOR SELECT USING (auth.uid() = dealer_id);

-- Admins can view all metrics
CREATE POLICY "Admins can view all dealer metrics" ON public.dealer_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only system/admins can update metrics
CREATE POLICY "Admins can manage dealer metrics" ON public.dealer_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for dealer_inventory table

-- Dealers can view their own inventory
CREATE POLICY "Dealers can view own inventory" ON public.dealer_inventory
    FOR SELECT USING (auth.uid() = dealer_id);

-- Dealers can update their own inventory
CREATE POLICY "Dealers can update own inventory" ON public.dealer_inventory
    FOR UPDATE USING (auth.uid() = dealer_id);

-- Admins can manage all inventory
CREATE POLICY "Admins can manage all dealer inventory" ON public.dealer_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Triggers to update updated_at
DROP TRIGGER IF EXISTS handle_dealer_applications_updated_at ON public.dealer_applications;
CREATE TRIGGER handle_dealer_applications_updated_at
    BEFORE UPDATE ON public.dealer_applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_dealer_metrics_updated_at ON public.dealer_metrics;
CREATE TRIGGER handle_dealer_metrics_updated_at
    BEFORE UPDATE ON public.dealer_metrics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_dealer_inventory_updated_at ON public.dealer_inventory;
CREATE TRIGGER handle_dealer_inventory_updated_at
    BEFORE UPDATE ON public.dealer_inventory
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS dealer_applications_user_id_idx ON public.dealer_applications(user_id);
CREATE INDEX IF NOT EXISTS dealer_applications_status_idx ON public.dealer_applications(status);
CREATE INDEX IF NOT EXISTS dealer_applications_created_at_idx ON public.dealer_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS dealer_metrics_dealer_id_idx ON public.dealer_metrics(dealer_id);
CREATE INDEX IF NOT EXISTS dealer_metrics_period_idx ON public.dealer_metrics(period_year, period_month);

CREATE INDEX IF NOT EXISTS dealer_inventory_dealer_id_idx ON public.dealer_inventory(dealer_id);
CREATE INDEX IF NOT EXISTS dealer_inventory_vehicle_id_idx ON public.dealer_inventory(vehicle_id);

-- Create storage bucket for dealer documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer-documents', 'dealer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dealer documents
CREATE POLICY "Users can upload their own dealer documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'dealer-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own dealer documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'dealer-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all dealer documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'dealer-documents' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can delete their own dealer documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'dealer-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
