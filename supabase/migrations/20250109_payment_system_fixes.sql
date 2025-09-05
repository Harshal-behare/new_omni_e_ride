-- Migration: Payment System Fixes
-- Description: Adds missing payment tables and fixes schema issues identified in audit

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
ALTER TABLE public.test_rides 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 2000,
ADD COLUMN IF NOT EXISTS razorpay_order_id text,
ADD COLUMN IF NOT EXISTS refund_id text,
ADD COLUMN IF NOT EXISTS refund_amount numeric,
ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Add commission fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS dealer_commission_rate numeric DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS dealer_commission_amount numeric,
ADD COLUMN IF NOT EXISTS commission_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS payout_id uuid REFERENCES public.dealer_payouts(id);

-- Add razorpay_order_id to orders table if not exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS razorpay_order_id text;

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

-- Add RLS policies for new tables
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_orders
CREATE POLICY "Users can view their own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for dealer_payouts
CREATE POLICY "Dealers can view their own payouts" ON public.dealer_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dealers 
      WHERE dealers.id = dealer_payouts.dealer_id 
      AND dealers.user_id = auth.uid()
    )
  );

-- Admin policies (add more specific admin role checks as needed)
CREATE POLICY "Admins can manage all payment data" ON public.payment_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all payouts" ON public.dealer_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT ALL ON public.dealer_payouts TO authenticated;
GRANT ALL ON public.payment_refunds TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;
GRANT ALL ON public.stock_reservations TO authenticated;
GRANT SELECT ON dealer_payment_summary TO authenticated;
