-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'test_ride', 'system')),
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can insert notifications (for backend triggers)
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notification if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, title, message, type, data)
        VALUES (
            NEW.user_id,
            'Order Status Update',
            'Your order #' || SUBSTRING(NEW.id::text, 1, 8) || ' status has been updated to: ' || NEW.status,
            'order',
            jsonb_build_object(
                'order_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'vehicle_id', NEW.vehicle_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order status changes
CREATE TRIGGER notify_on_order_status_change
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_order_status_change();

-- Create function to send notification on test ride status change
CREATE OR REPLACE FUNCTION public.notify_test_ride_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notification if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, title, message, type, data)
        VALUES (
            NEW.user_id,
            'Test Ride Status Update',
            'Your test ride scheduled for ' || NEW.scheduled_date || ' has been ' || NEW.status,
            'test_ride',
            jsonb_build_object(
                'test_ride_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'vehicle_id', NEW.vehicle_id,
                'scheduled_date', NEW.scheduled_date,
                'scheduled_time', NEW.scheduled_time
            )
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for test ride status changes
CREATE TRIGGER notify_on_test_ride_status_change
    AFTER UPDATE OF status ON public.test_rides
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_test_ride_status_change();

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
