-- Combined Migration File for OMNI E-RIDE
-- Execute this in Supabase SQL Editor
-- Created: 2025-09-05

-- =========================================
-- PART 1: Payment System Fixes Migration
-- =========================================

-- Create payment_orders table
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'created' CHECK (status IN ('created', 'processing', 'completed', 'failed', 'cancelled')),
  razorpay_order_id text UNIQUE,
  description text,
  notes jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id text,
  payment_id text UNIQUE,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text CHECK (status IN ('pending', 'processing', 'captured', 'failed', 'refunded')),
  method text,
  captured boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create dealer_payouts table
CREATE TABLE IF NOT EXISTS public.dealer_payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  commission_rate numeric DEFAULT 10.0,
  orders_included jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date date,
  razorpay_payout_id text,
  bank_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id text NOT NULL,
  refund_id text UNIQUE,
  amount numeric NOT NULL,
  status text CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  reason text,
  notes text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create webhook_events table for audit
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Create stock_reservations table
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  reserved_until timestamptz NOT NULL,
  released boolean DEFAULT false,
  released_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add payment fields to test_rides table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'payment_status') THEN
    ALTER TABLE public.test_rides ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'payment_id') THEN
    ALTER TABLE public.test_rides ADD COLUMN payment_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'deposit_amount') THEN
    ALTER TABLE public.test_rides ADD COLUMN deposit_amount numeric DEFAULT 2000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE public.test_rides ADD COLUMN razorpay_order_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'refund_id') THEN
    ALTER TABLE public.test_rides ADD COLUMN refund_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'refund_amount') THEN
    ALTER TABLE public.test_rides ADD COLUMN refund_amount numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'refunded_at') THEN
    ALTER TABLE public.test_rides ADD COLUMN refunded_at timestamptz;
  END IF;
END $$;

-- Add commission fields to orders table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dealer_commission_rate') THEN
    ALTER TABLE public.orders ADD COLUMN dealer_commission_rate numeric DEFAULT 10.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dealer_commission_amount') THEN
    ALTER TABLE public.orders ADD COLUMN dealer_commission_amount numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_paid') THEN
    ALTER TABLE public.orders ADD COLUMN commission_paid boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_paid_at') THEN
    ALTER TABLE public.orders ADD COLUMN commission_paid_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_order_id text;
  END IF;
END $$;

-- Add payout_id reference after dealer_payouts table is created
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payout_id') THEN
    ALTER TABLE public.orders ADD COLUMN payout_id uuid REFERENCES public.dealer_payouts(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON public.payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_dealer_payouts_dealer_id ON public.dealer_payouts(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_payouts_status ON public.dealer_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON public.payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type ON public.webhook_events(source, event_type);
CREATE INDEX IF NOT EXISTS idx_test_rides_payment_status ON public.test_rides(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Create function to calculate dealer commission
CREATE OR REPLACE FUNCTION calculate_dealer_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dealer_id IS NOT NULL AND NEW.final_amount IS NOT NULL THEN
    NEW.dealer_commission_amount = NEW.final_amount * (NEW.dealer_commission_rate / 100);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate commission on order insert/update
DROP TRIGGER IF EXISTS trigger_calculate_dealer_commission ON public.orders;
CREATE TRIGGER trigger_calculate_dealer_commission
BEFORE INSERT OR UPDATE OF final_amount, dealer_commission_rate ON public.orders
FOR EACH ROW
EXECUTE FUNCTION calculate_dealer_commission();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp triggers to new tables
DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON public.payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealer_payouts_updated_at ON public.dealer_payouts;
CREATE TRIGGER update_dealer_payouts_updated_at
BEFORE UPDATE ON public.dealer_payouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create view for dealer payment summary
CREATE OR REPLACE VIEW dealer_payment_summary AS
SELECT 
  d.id as dealer_id,
  d.business_name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.final_amount) as total_revenue,
  SUM(o.dealer_commission_amount) as total_commission,
  SUM(CASE WHEN o.commission_paid = true THEN o.dealer_commission_amount ELSE 0 END) as paid_commission,
  SUM(CASE WHEN o.commission_paid = false THEN o.dealer_commission_amount ELSE 0 END) as pending_commission,
  MAX(o.created_at) as last_order_date
FROM public.dealers d
LEFT JOIN public.orders o ON o.dealer_id = d.id AND o.payment_status = 'completed'
GROUP BY d.id, d.business_name;

-- Enable RLS for new tables
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PART 2: Test Ride Duplicate Prevention
-- =========================================

-- Create idempotency keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + INTERVAL '24 hours'
);

-- Create index for efficient key lookup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);

-- Create unique constraint to prevent duplicate bookings
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_test_rides_unique_booking'
  ) THEN
    CREATE UNIQUE INDEX idx_test_rides_unique_booking 
    ON public.test_rides(user_id, vehicle_id, preferred_date, preferred_time) 
    WHERE status IN ('pending', 'confirmed');
  END IF;
END $$;

-- Add booking_metadata columns to test_rides
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'booking_metadata') THEN
    ALTER TABLE public.test_rides ADD COLUMN booking_metadata jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'booking_source') THEN
    ALTER TABLE public.test_rides ADD COLUMN booking_source text DEFAULT 'web';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'ip_address') THEN
    ALTER TABLE public.test_rides ADD COLUMN ip_address inet;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_rides' AND column_name = 'user_agent') THEN
    ALTER TABLE public.test_rides ADD COLUMN user_agent text;
  END IF;
END $$;

-- Create stored procedure for atomic test ride booking
CREATE OR REPLACE FUNCTION create_test_ride_booking(
  p_user_id uuid,
  p_vehicle_id uuid,
  p_dealer_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_preferred_date date,
  p_preferred_time time,
  p_city text,
  p_address text,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  confirmation_code text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_booking_id uuid;
  v_daily_booking_count int;
  v_new_booking_id uuid;
  v_confirmation_code text;
BEGIN
  -- Check for existing booking with same details
  SELECT tr.id INTO v_existing_booking_id
  FROM test_rides tr
  WHERE tr.user_id = p_user_id
    AND tr.vehicle_id = p_vehicle_id
    AND tr.preferred_date = p_preferred_date
    AND tr.preferred_time = p_preferred_time
    AND tr.status IN ('pending', 'confirmed')
  LIMIT 1;
  
  IF v_existing_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_booking: A booking already exists for this vehicle, date and time';
  END IF;
  
  -- Check daily booking limit
  SELECT COUNT(*) INTO v_daily_booking_count
  FROM test_rides
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  IF v_daily_booking_count >= 3 THEN
    RAISE EXCEPTION 'booking_limit_exceeded: Daily booking limit (3) reached';
  END IF;
  
  -- Check if booking date/time is in the past
  IF (p_preferred_date + p_preferred_time) < CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'invalid_date: Cannot book test rides for past dates';
  END IF;
  
  -- Generate confirmation code
  v_confirmation_code := 'TR-' || UPPER(SUBSTR(md5(random()::text), 1, 8));
  
  -- Insert new booking
  INSERT INTO test_rides (
    user_id,
    vehicle_id,
    dealer_id,
    name,
    email,
    phone,
    preferred_date,
    preferred_time,
    city,
    address,
    status,
    confirmation_code,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_vehicle_id,
    p_dealer_id,
    p_name,
    p_email,
    p_phone,
    p_preferred_date,
    p_preferred_time,
    p_city,
    p_address,
    'pending',
    v_confirmation_code,
    p_notes,
    now(),
    now()
  )
  RETURNING test_rides.id INTO v_new_booking_id;
  
  -- Return the created booking
  RETURN QUERY
  SELECT 
    v_new_booking_id as id,
    v_confirmation_code as confirmation_code,
    'pending'::text as status,
    now() as created_at;
    
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_booking: A booking with these details already exists';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create function to clean up expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < now();
END;
$$;

-- Create audit log table for tracking booking attempts
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_user_id ON public.booking_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_created_at ON public.booking_audit_log(created_at);

-- Add trigger to prevent concurrent bookings
CREATE OR REPLACE FUNCTION prevent_concurrent_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- Lock the user's bookings to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));
  
  -- Check again for existing booking (double-check pattern)
  IF EXISTS (
    SELECT 1 FROM test_rides
    WHERE user_id = NEW.user_id
      AND vehicle_id = NEW.vehicle_id
      AND preferred_date = NEW.preferred_date
      AND preferred_time = NEW.preferred_time
      AND status IN ('pending', 'confirmed')
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'duplicate_booking: Concurrent booking detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS prevent_concurrent_bookings_trigger ON public.test_rides;
CREATE TRIGGER prevent_concurrent_bookings_trigger
BEFORE INSERT ON public.test_rides
FOR EACH ROW
EXECUTE FUNCTION prevent_concurrent_bookings();

-- Enable RLS for idempotency_keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT ALL ON public.dealer_payouts TO authenticated;
GRANT ALL ON public.payment_refunds TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;
GRANT ALL ON public.stock_reservations TO authenticated;
GRANT SELECT ON dealer_payment_summary TO authenticated;
GRANT ALL ON public.idempotency_keys TO authenticated;
GRANT ALL ON public.booking_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_ride_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency_keys TO authenticated;

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Run these queries to verify the migration was successful:

-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'payment_orders',
  'payment_transactions', 
  'dealer_payouts',
  'payment_refunds',
  'webhook_events',
  'stock_reservations',
  'idempotency_keys',
  'booking_audit_log'
);

-- Check if test_rides has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_rides' 
AND column_name IN ('payment_status', 'payment_id', 'deposit_amount', 'booking_metadata');

-- Check if orders has commission columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('dealer_commission_rate', 'dealer_commission_amount', 'commission_paid');

-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_test_ride_booking', 'calculate_dealer_commission', 'prevent_concurrent_bookings');

-- =========================================
-- END OF MIGRATION
-- =========================================
