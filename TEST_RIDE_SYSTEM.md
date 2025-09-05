# Test Ride Booking System Documentation

## Overview
The test ride booking system allows customers to book test rides for vehicles and dealers to manage these bookings.

## System Components

### 1. Customer Features
- **Browse Vehicles** - View available vehicles at `/dashboard/vehicles`
- **Book Test Ride** - Book a test ride at `/dashboard/test-rides/new`
- **View Bookings** - See all test ride bookings at `/dashboard/test-rides`
- **Cancel Bookings** - Cancel pending or confirmed bookings

### 2. Dealer Features
- **View Bookings** - Manage test ride requests at `/dealer/test-rides`
- **Approve/Reject** - Process pending bookings
- **Add Notes** - Add dealer notes to bookings
- **Availability Settings** - Configure working hours and slots

### 3. API Endpoints

#### Public APIs (No Authentication Required)
- `GET /api/public/dealers` - Get list of all dealers
- `GET /api/test-rides/slots?date=YYYY-MM-DD` - Get available time slots

#### Customer APIs
- `GET /api/test-rides` - Get user's test ride bookings
- `POST /api/test-rides/book-simple` - Create a test ride booking
- `PUT /api/test-rides/[id]/status` - Cancel a test ride

#### Dealer APIs
- `GET /api/dealer/test-rides` - Get dealer's test ride bookings
- `PUT /api/dealer/test-rides` - Update test ride status
- `GET /api/dealer/availability` - Get availability settings
- `PUT /api/dealer/availability` - Update availability settings
- `POST /api/dealer/availability/check` - Check slots for a specific date

## Database Schema

### Key Tables
1. **test_rides** - Main table for test ride bookings
   - `id` (UUID) - Primary key
   - `user_id` (UUID) - Customer reference
   - `vehicle_id` (UUID) - Vehicle reference
   - `dealer_id` (UUID) - Dealer reference (optional)
   - `preferred_date` (date) - Requested date
   - `preferred_time` (time) - Requested time
   - `status` (enum) - pending, confirmed, completed, cancelled
   - `confirmation_code` (text) - Unique booking code

2. **dealers** - Dealer information
   - `id` (UUID) - Primary key
   - `business_name` (text) - Dealer name
   - `business_address` (text) - Location
   - `city`, `state`, `pincode` - Address details
   - `status` (enum) - approved, pending, rejected

3. **vehicles** - Vehicle catalog
   - `id` (UUID) - Primary key
   - `name` (text) - Vehicle name
   - `price` (numeric) - Vehicle price
   - `images` (array) - Vehicle images
   - `specifications` - Vehicle specs

## Sample Data

### Vehicles
- OMNI Urban Pro (ID: v1b2c3d4-e5f6-7890-abcd-ef1234567890)
- OMNI City Rider (ID: v2c3d4e5-f6a7-8901-bcde-f23456789012)
- OMNI Smart Series (ID: v3d4e5f6-a7b8-9012-cdef-345678901234)

### Dealers
- Omni E-Ride Delhi Hub (ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
- Omni E-Ride Mumbai Center (ID: b2c3d4e5-f6a7-8901-bcde-f23456789012)
- Omni E-Ride Bangalore Store (ID: c3d4e5f6-a7b8-9012-cdef-345678901234)

## Testing the System

### 1. Test API Endpoints
Visit `/test-api` to test various API endpoints:
- Public Dealers API
- Available Slots API
- Simple Booking API

### 2. Customer Flow
1. Login as a customer
2. Browse vehicles at `/dashboard/vehicles`
3. Click "Test Ride" on any vehicle
4. Select date, time, and optionally a dealer
5. Submit the booking form
6. View your bookings at `/dashboard/test-rides`

### 3. Dealer Flow
1. Login as a dealer
2. Go to `/dealer/test-rides`
3. View pending bookings
4. Approve or reject bookings with notes
5. Manage availability settings

## Troubleshooting

### Common Issues
1. **"invalid input syntax for type uuid"** - Ensure dealer IDs are proper UUIDs
2. **No vehicles showing** - Check if vehicles exist in the database
3. **No dealers available** - Verify dealers are in 'approved' status
4. **Booking fails** - Ensure user is authenticated

### Database Migrations
Run migrations using:
```bash
npx supabase db push
```

### Seed Sample Data
If you need sample data, run:
```bash
npx tsx scripts/seed-sample-data.ts
```

## Environment Variables
Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for seeding data)

## Future Enhancements
- Payment integration with Razorpay
- Email/SMS notifications
- Real-time updates using Supabase subscriptions
- Advanced dealer availability management
- Multi-language support
