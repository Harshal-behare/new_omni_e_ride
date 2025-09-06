-- Migration: Test Ride Duplicate Prevention
-- Description: Adds idempotency keys table and stored procedure for atomic test ride booking

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_rides_unique_booking 
ON public.test_rides(user_id, vehicle_id, preferred_date, preferred_time) 
WHERE status IN ('pending', 'confirmed');

-- Add booking_metadata column to test_rides for additional tracking
ALTER TABLE public.test_rides 
ADD COLUMN IF NOT EXISTS booking_metadata jsonb,
ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'web',
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text;

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

-- Create a scheduled job to clean up expired keys (if pg_cron is available)
-- Uncomment if pg_cron extension is enabled
-- SELECT cron.schedule('cleanup-idempotency-keys', '0 * * * *', 'SELECT cleanup_expired_idempotency_keys()');

-- Add RLS policies for idempotency_keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only the system can manage idempotency keys
CREATE POLICY "Service role can manage idempotency keys" ON public.idempotency_keys
  FOR ALL USING (auth.role() = 'service_role');

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

-- Create index for audit log
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

-- Grant necessary permissions
GRANT ALL ON public.idempotency_keys TO authenticated;
GRANT ALL ON public.booking_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_ride_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency_keys TO authenticated;
