-- Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_method VARCHAR(50),
  payment_details JSONB,
  description TEXT,
  notes JSONB,
  failure_reason TEXT,
  amount_paid DECIMAL(10, 2),
  amount_due DECIMAL(10, 2),
  captured_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  method VARCHAR(50),
  captured BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  refund_status VARCHAR(50),
  refund_amount DECIMAL(10, 2),
  refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_ride_bookings table
CREATE TABLE IF NOT EXISTS test_ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  dealership_id UUID,
  contact_number VARCHAR(15) NOT NULL,
  alternate_contact_number VARCHAR(15),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  special_requests TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id TEXT,
  razorpay_order_id TEXT,
  deposit_amount DECIMAL(10, 2) DEFAULT 2000,
  cancellation_reason TEXT,
  admin_notes TEXT,
  confirmed_date DATE,
  confirmed_time TIME,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_orders table
CREATE TABLE IF NOT EXISTS vehicle_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  vehicle_slug TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  color VARCHAR(50) NOT NULL,
  dealership_id UUID,
  base_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  promo_code VARCHAR(50),
  promo_code_data JSONB,
  subtotal DECIMAL(10, 2) NOT NULL,
  taxes DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(20) DEFAULT 'full',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id TEXT,
  razorpay_order_id TEXT,
  payment_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2),
  order_status VARCHAR(50) DEFAULT 'pending',
  delivery_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  alternate_contact_number VARCHAR(15),
  special_instructions TEXT,
  cancellation_reason TEXT,
  admin_notes TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_reservations table
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES vehicle_orders(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  reserved_until TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(10, 2),
  min_order_value DECIMAL(10, 2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_vehicles UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id TEXT UNIQUE NOT NULL,
  payment_id TEXT NOT NULL,
  order_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  reason TEXT,
  notes JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_events table for audit
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT TRUE,
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);

CREATE INDEX idx_test_ride_bookings_user_id ON test_ride_bookings(user_id);
CREATE INDEX idx_test_ride_bookings_vehicle_id ON test_ride_bookings(vehicle_id);
CREATE INDEX idx_test_ride_bookings_status ON test_ride_bookings(status);
CREATE INDEX idx_test_ride_bookings_preferred_date ON test_ride_bookings(preferred_date);

CREATE INDEX idx_vehicle_orders_user_id ON vehicle_orders(user_id);
CREATE INDEX idx_vehicle_orders_vehicle_id ON vehicle_orders(vehicle_id);
CREATE INDEX idx_vehicle_orders_order_status ON vehicle_orders(order_status);
CREATE INDEX idx_vehicle_orders_payment_status ON vehicle_orders(payment_status);

CREATE INDEX idx_stock_reservations_order_id ON stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_vehicle_id ON stock_reservations(vehicle_id);
CREATE INDEX idx_stock_reservations_reserved_until ON stock_reservations(reserved_until);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);

CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_ride_bookings_updated_at BEFORE UPDATE ON test_ride_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_orders_updated_at BEFORE UPDATE ON vehicle_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_ride_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Policies for payment_orders
CREATE POLICY "Users can view their own payment orders" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment orders" ON payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for test_ride_bookings
CREATE POLICY "Users can view their own test ride bookings" ON test_ride_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test ride bookings" ON test_ride_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending test ride bookings" ON test_ride_bookings
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Policies for vehicle_orders
CREATE POLICY "Users can view their own orders" ON vehicle_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON vehicle_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (assuming admin role check function exists)
-- You may need to create an is_admin() function based on your auth setup
