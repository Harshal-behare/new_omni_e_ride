-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'upi', 'netbanking', 'wallet')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  tracking_number TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_vehicle_id ON public.orders(vehicle_id);
CREATE INDEX idx_orders_dealer_id ON public.orders(dealer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own orders
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending orders (for cancellation)
CREATE POLICY "Users can update own pending orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Policy: Dealers can view orders assigned to them
CREATE POLICY "Dealers can view assigned orders" ON public.orders
  FOR SELECT
  USING (
    dealer_id IN (
      SELECT id FROM public.dealers 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Dealers can update orders assigned to them
CREATE POLICY "Dealers can update assigned orders" ON public.orders
  FOR UPDATE
  USING (
    dealer_id IN (
      SELECT id FROM public.dealers 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all orders
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to decrement vehicle stock (called after successful payment)
CREATE OR REPLACE FUNCTION decrement_vehicle_stock(
  p_vehicle_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.vehicles
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_vehicle_id
    AND stock_quantity >= p_quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for vehicle %', p_vehicle_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment vehicle stock (called on order cancellation)
CREATE OR REPLACE FUNCTION increment_vehicle_stock(
  p_vehicle_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.vehicles
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for order analytics (admin only)
CREATE OR REPLACE VIEW order_analytics AS
SELECT 
  COUNT(*) AS total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_orders,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) AS total_revenue,
  AVG(CASE WHEN payment_status = 'paid' THEN total_amount END) AS average_order_value,
  DATE_TRUNC('month', created_at) AS month
FROM public.orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Grant access to the analytics view for admins
GRANT SELECT ON order_analytics TO authenticated;

-- Add comment to table
COMMENT ON TABLE public.orders IS 'Stores vehicle purchase orders with payment and delivery tracking';
