-- Create dealers table
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_rides table
CREATE TABLE IF NOT EXISTS public.test_rides (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_test_rides_user_id ON public.test_rides(user_id);
CREATE INDEX idx_test_rides_vehicle_id ON public.test_rides(vehicle_id);
CREATE INDEX idx_test_rides_dealer_id ON public.test_rides(dealer_id);
CREATE INDEX idx_test_rides_scheduled_date ON public.test_rides(scheduled_date);
CREATE INDEX idx_test_rides_status ON public.test_rides(status);
CREATE INDEX idx_test_rides_payment_status ON public.test_rides(payment_status);

-- Create index for dealers
CREATE INDEX idx_dealers_city ON public.dealers(city);
CREATE INDEX idx_dealers_state ON public.dealers(state);
CREATE INDEX idx_dealers_is_active ON public.dealers(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_rides ENABLE ROW LEVEL SECURITY;

-- Create policies for dealers table
-- Anyone can view active dealers
CREATE POLICY "View active dealers" ON public.dealers
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete dealers
CREATE POLICY "Admin manage dealers" ON public.dealers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for test_rides table
-- Users can view their own test rides
CREATE POLICY "Users view own test rides" ON public.test_rides
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own test rides
CREATE POLICY "Users create own test rides" ON public.test_rides
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own test rides (for cancellation)
CREATE POLICY "Users update own test rides" ON public.test_rides
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and dealers can view all test rides
CREATE POLICY "Admin/Dealer view all test rides" ON public.test_rides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dealer')
    )
  );

-- Admins and dealers can update any test ride
CREATE POLICY "Admin/Dealer update test rides" ON public.test_rides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dealer')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_rides_updated_at
  BEFORE UPDATE ON public.test_rides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample dealers
INSERT INTO public.dealers (name, email, phone, address, city, state, pincode) VALUES
  ('Green Wheels Bengaluru', 'bengaluru@greenwheels.com', '080-12345678', '123 MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038'),
  ('Eco Motors Mumbai', 'mumbai@ecomotors.com', '022-87654321', '456 Linking Road, Bandra West', 'Mumbai', 'Maharashtra', '400050'),
  ('E-Drive Delhi', 'delhi@edrive.com', '011-98765432', '789 Connaught Place, Block A', 'New Delhi', 'Delhi', '110001'),
  ('Future Mobility Chennai', 'chennai@futuremobility.com', '044-55667788', '321 Anna Salai, Nandanam', 'Chennai', 'Tamil Nadu', '600035'),
  ('Green Transport Pune', 'pune@greentransport.com', '020-44332211', '654 FC Road, Shivajinagar', 'Pune', 'Maharashtra', '411005')
ON CONFLICT (email) DO NOTHING;
