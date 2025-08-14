-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    price INTEGER NOT NULL,
    images TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    
    -- Specifications
    range_km INTEGER NOT NULL,
    top_speed INTEGER NOT NULL,
    charge_hours NUMERIC(3,1) NOT NULL,
    motor_power_w INTEGER,
    battery_wh INTEGER,
    
    -- Additional fields for calculators
    ev_units_per_100km NUMERIC(3,1),
    petrol_km_per_l INTEGER,
    
    -- Ratings and reviews
    rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0,
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    released_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles table

-- Everyone can view active vehicles
CREATE POLICY "Anyone can view active vehicles" ON public.vehicles
    FOR SELECT USING (is_active = true);

-- Admins can view all vehicles (including inactive)
CREATE POLICY "Admins can view all vehicles" ON public.vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can insert vehicles
CREATE POLICY "Admins can insert vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update vehicles
CREATE POLICY "Admins can update vehicles" ON public.vehicles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete vehicles
CREATE POLICY "Admins can delete vehicles" ON public.vehicles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger to update updated_at on vehicle update
DROP TRIGGER IF EXISTS handle_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER handle_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS vehicles_slug_idx ON public.vehicles(slug);
CREATE INDEX IF NOT EXISTS vehicles_is_active_idx ON public.vehicles(is_active);
CREATE INDEX IF NOT EXISTS vehicles_price_idx ON public.vehicles(price);
CREATE INDEX IF NOT EXISTS vehicles_created_at_idx ON public.vehicles(created_at DESC);

-- Insert initial vehicle data
INSERT INTO public.vehicles (
    slug, name, tagline, price, images, colors, badges,
    range_km, top_speed, charge_hours, motor_power_w, battery_wh,
    ev_units_per_100km, petrol_km_per_l, rating, reviews_count, is_active
) VALUES 
(
    'urban-pro',
    'OMNI Urban Pro',
    'Smart performance for city life',
    84999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#10b981', '#6b7280', '#f59e0b'],
    ARRAY['Featured'],
    120, 85, 4, 3000, 3200,
    1.7, 52, 4.8, 192, true
),
(
    'city-rider',
    'OMNI City Rider',
    'Style and efficiency for daily rides',
    74999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#e11d48', '#6b7280', '#22d3ee'],
    ARRAY['Popular'],
    110, 80, 4, 2800, 3000,
    1.8, 50, 4.6, 156, true
),
(
    'smart-series',
    'OMNI Smart Series',
    'IoT-ready. Future-proof.',
    89999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#10b981', '#6b7280'],
    ARRAY['New'],
    125, 85, 4, 3200, 3300,
    1.6, 52, 4.7, 98, true
),
(
    'tourer',
    'OMNI Tourer',
    'Long range touring companion',
    99999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#10b981', '#6b7280', '#f43f5e'],
    NULL,
    130, 90, 4, 3500, 3600,
    1.7, 48, 4.5, 64, true
),
(
    'sport',
    'OMNI Sport',
    'Responsive handling with punch',
    92999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#0ea5e9', '#10b981'],
    NULL,
    115, 88, 4, 3300, 3400,
    1.75, 48, 4.4, 71, true
),
(
    'lite',
    'OMNI Lite',
    'Compact, efficient, value-packed',
    67999,
    ARRAY['/placeholder.svg?height=700&width=1000'::TEXT],
    ARRAY['#111827', '#10b981', '#eab308'],
    NULL,
    95, 75, 3.5, 2500, 2500,
    1.9, 55, 4.2, 53, true
);
