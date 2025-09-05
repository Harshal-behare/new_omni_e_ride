# Test Ride Duplicate Prevention System

## Overview

This document describes the comprehensive duplicate prevention system implemented for test ride bookings to ensure data integrity and prevent users from accidentally creating multiple bookings.

## Problem Statement

Users were experiencing issues where clicking the "Book Test Ride" button multiple times or network issues would result in duplicate bookings for the same vehicle, date, and time slot.

## Solution Architecture

### 1. **Database-Level Protection**

#### Unique Constraint
```sql
CREATE UNIQUE INDEX idx_test_rides_unique_booking 
ON public.test_rides(user_id, vehicle_id, preferred_date, preferred_time) 
WHERE status IN ('pending', 'confirmed');
```
- Prevents duplicate active bookings at the database level
- Only applies to 'pending' and 'confirmed' bookings
- Allows rebooking after cancellation

#### Stored Procedure
```sql
CREATE FUNCTION create_test_ride_booking(...)
```
- Atomic booking creation with built-in validations
- Checks for existing bookings before insert
- Enforces daily booking limit (3 per user)
- Validates booking date is not in the past

#### Advisory Locks
```sql
PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));
```
- Prevents race conditions during concurrent requests
- Uses PostgreSQL advisory locks for user-level locking

### 2. **API-Level Protection**

#### Idempotency Keys
- Generates deterministic hash from booking details
- Stores successful responses for 24 hours
- Returns cached response for duplicate requests

#### Request Validation
```typescript
// Check for existing booking
const { data: existingBooking } = await supabase
  .from('test_rides')
  .select('id, status')
  .eq('user_id', user.id)
  .eq('vehicle_id', vehicleId)
  .eq('preferred_date', preferredDate)
  .eq('preferred_time', preferredTime)
  .in('status', ['pending', 'confirmed'])
```

#### Rate Limiting
- Maximum 3 bookings per user per day
- Returns 429 status code when limit exceeded

### 3. **Frontend Protection**

#### Request Debouncing
- Prevents multiple clicks from triggering multiple requests
- Uses refs to track booking state

#### AbortController
- Cancels in-flight requests when new request is made
- Prevents network timeout issues

#### UI State Management
```typescript
const bookingInProgressRef = useRef(false)
if (bookingInProgressRef.current) {
  return null // Ignore duplicate request
}
```

#### Visual Feedback
- Disables submit button during processing
- Shows loading spinner
- Clear error messages for different scenarios

## Implementation Details

### Database Migration

1. **Idempotency Keys Table**
   - Stores request hashes with responses
   - Auto-expires after 24 hours
   - Indexed for fast lookups

2. **Booking Audit Log**
   - Tracks all booking attempts
   - Records IP addresses and user agents
   - Useful for debugging and abuse detection

3. **Test Rides Table Updates**
   - Added booking metadata columns
   - Tracks booking source and user agent

### API Endpoint Updates

1. **Idempotency Check**
   ```typescript
   const idempotencyKey = generateIdempotencyKey(user.id, bookingData)
   const { isDuplicate, existingResponse } = await checkIdempotency(supabase, idempotencyKey)
   ```

2. **Atomic Booking Creation**
   ```typescript
   const { data: booking } = await supabase.rpc('create_test_ride_booking', params)
   ```

3. **Error Categorization**
   - 409 Conflict: Duplicate booking
   - 429 Too Many Requests: Daily limit exceeded
   - 400 Bad Request: Validation errors

### Frontend Hook

The `useTestRideBooking` hook provides:
- Automatic duplicate prevention
- Network error handling
- Request cancellation
- User-friendly error messages
- Success notifications with confirmation codes

## Usage Guidelines

### For Developers

1. **Always use the provided hook**
   ```typescript
   const { bookTestRide, isBooking, error } = useTestRideBooking()
   ```

2. **Handle errors appropriately**
   ```typescript
   if (error?.type === 'duplicate') {
     // Show specific message for duplicate bookings
   }
   ```

3. **Don't bypass the protection mechanisms**
   - Don't make direct API calls
   - Don't disable UI protections

### For Users

1. **Wait for confirmation** - Don't refresh or navigate away during booking
2. **Check confirmation code** - Note down the confirmation code shown
3. **Daily limits apply** - Maximum 3 test rides per day

## Monitoring and Maintenance

### Metrics to Track
- Duplicate booking attempts per user
- Daily booking counts
- Failed booking reasons
- API response times

### Regular Maintenance
1. Clean up expired idempotency keys (automated)
2. Monitor audit logs for abuse patterns
3. Adjust rate limits based on usage patterns

## Troubleshooting

### Common Issues

1. **"Booking already exists" error**
   - User has an active booking for the same slot
   - Solution: Choose different time or cancel existing booking

2. **"Daily limit reached" error**
   - User has booked 3 test rides today
   - Solution: Try again tomorrow

3. **"Request timeout" error**
   - Network issues or slow connection
   - Solution: Check internet connection and retry

### Debug Checklist
1. Check browser console for errors
2. Verify user authentication status
3. Check network tab for failed requests
4. Review server logs for detailed errors
5. Check database constraints

## Future Enhancements

1. **SMS/Email confirmations** - Send booking confirmations via multiple channels
2. **Intelligent slot suggestions** - Suggest alternative slots when conflicts occur
3. **Booking queue system** - Allow waitlisting for popular slots
4. **Machine learning** - Detect and prevent booking abuse patterns
5. **Real-time availability** - Show live slot availability updates
