-- First, let's identify all duplicate test ride bookings
WITH duplicate_bookings AS (
    SELECT 
        user_id, 
        vehicle_id, 
        preferred_date, 
        preferred_time,
        COUNT(*) as booking_count,
        array_agg(id ORDER BY created_at DESC) as booking_ids,
        array_agg(status ORDER BY created_at DESC) as statuses,
        array_agg(created_at ORDER BY created_at DESC) as created_dates
    FROM test_rides
    WHERE status IN ('pending', 'confirmed')
    GROUP BY user_id, vehicle_id, preferred_date, preferred_time
    HAVING COUNT(*) > 1
)
SELECT 
    user_id,
    vehicle_id, 
    preferred_date,
    preferred_time,
    booking_count,
    booking_ids,
    statuses,
    created_dates
FROM duplicate_bookings
ORDER BY booking_count DESC;

-- Once you review the above results, you can use this query to keep only the most recent booking
-- and cancel the older duplicates:

/*
-- IMPORTANT: Review the duplicates above first before running this cleanup!
-- This will keep the most recent booking and mark older ones as 'cancelled'

WITH duplicates_to_cancel AS (
    SELECT 
        user_id, 
        vehicle_id, 
        preferred_date, 
        preferred_time,
        array_agg(id ORDER BY created_at DESC) as booking_ids
    FROM test_rides
    WHERE status IN ('pending', 'confirmed')
    GROUP BY user_id, vehicle_id, preferred_date, preferred_time
    HAVING COUNT(*) > 1
),
bookings_to_cancel AS (
    SELECT 
        unnest(booking_ids[2:]) as booking_id  -- Keep first (most recent), cancel the rest
    FROM duplicates_to_cancel
)
UPDATE test_rides
SET 
    status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT booking_id FROM bookings_to_cancel)
RETURNING id, user_id, vehicle_id, preferred_date, preferred_time, status;
*/

-- Alternative: If you want to DELETE the duplicates instead of cancelling them:
/*
WITH duplicates_to_delete AS (
    SELECT 
        user_id, 
        vehicle_id, 
        preferred_date, 
        preferred_time,
        array_agg(id ORDER BY created_at DESC) as booking_ids
    FROM test_rides
    WHERE status IN ('pending', 'confirmed')
    GROUP BY user_id, vehicle_id, preferred_date, preferred_time
    HAVING COUNT(*) > 1
),
bookings_to_delete AS (
    SELECT 
        unnest(booking_ids[2:]) as booking_id  -- Keep first (most recent), delete the rest
    FROM duplicates_to_delete
)
DELETE FROM test_rides
WHERE id IN (SELECT booking_id FROM bookings_to_delete)
RETURNING id, user_id, vehicle_id, preferred_date, preferred_time;
*/

-- After cleaning up duplicates, you can then apply the unique constraint:
/*
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_rides_unique_booking 
ON public.test_rides(user_id, vehicle_id, preferred_date, preferred_time) 
WHERE status IN ('pending', 'confirmed');
*/
