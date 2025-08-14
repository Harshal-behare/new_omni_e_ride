-- Create leads table for managing customer inquiries and leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    source VARCHAR(50) DEFAULT 'contact' CHECK (source IN ('contact', 'inquiry', 'warranty', 'test_ride')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'contacted', 'qualified', 'converted', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_dealer_id ON public.leads(dealer_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table

-- Policy: Anyone can create a lead (for contact forms)
CREATE POLICY "Anyone can create leads" ON public.leads
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Admins can view all leads
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Dealers can view leads assigned to them
CREATE POLICY "Dealers can view assigned leads" ON public.leads
    FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR dealer_id IN (
            SELECT id FROM public.dealers
            WHERE dealers.id = auth.uid()
        )
    );

-- Policy: Admins can update any lead
CREATE POLICY "Admins can update all leads" ON public.leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Dealers can update leads assigned to them (limited fields)
CREATE POLICY "Dealers can update assigned leads" ON public.leads
    FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR dealer_id IN (
            SELECT id FROM public.dealers
            WHERE dealers.id = auth.uid()
        )
    )
    WITH CHECK (
        assigned_to = auth.uid()
        OR dealer_id IN (
            SELECT id FROM public.dealers
            WHERE dealers.id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Create function to send email notification on new lead (placeholder)
-- This would integrate with your email service (e.g., using pg_net extension for HTTP requests)
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the new lead (you can extend this to send actual notifications)
    RAISE NOTICE 'New lead created: % - %', NEW.name, NEW.email;
    
    -- If using pg_net extension, you could make HTTP request to your notification service:
    -- PERFORM net.http_post(
    --     url := 'https://your-api.com/notifications/new-lead',
    --     body := json_build_object(
    --         'lead_id', NEW.id,
    --         'name', NEW.name,
    --         'email', NEW.email,
    --         'priority', NEW.priority
    --     )::text
    -- );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new lead notifications
CREATE TRIGGER notify_new_lead_trigger
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_lead();

-- Grant necessary permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
