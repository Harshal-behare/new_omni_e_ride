# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

OMNI E-RIDE is a comprehensive electric mobility platform built with Next.js 15 and TypeScript. The platform manages customer interactions, dealer networks, vehicle sales, test ride bookings, and detailed analytics across three distinct user roles: customers, dealers, and administrators.

### Technology Stack

- **Frontend**: Next.js 15.2.4 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4 with Radix UI components via shadcn/ui
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with role-based access control
- **Payment**: Razorpay integration for order processing
- **Email**: React Email templates with Resend API
- **State Management**: Zustand for client-side state
- **Forms**: React Hook Form with Zod validation

## Common Development Commands

### Development & Build
```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run ESLint
pnpm run lint
```

### Database Operations
```bash
# Push database schema to Supabase
npx supabase db push

# Create new migration
npx supabase migration new <migration_name>

# Run database seeds (if available)
npx tsx scripts/seed-sample-data.ts
```

### Email Development
```bash
# Start email preview server (port 3001)
pnpm run email:dev
```

### Environment Setup
```bash
# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase and service credentials
```

## Architecture Overview

### Authentication Flow

The application uses Supabase Auth with middleware-based role checking:

1. **Middleware** (`middleware.ts`) intercepts all requests and validates authentication
2. **Role-based routing** enforces access control:
   - `/dashboard/*` - Customer portal (role: customer)
   - `/dealer/*` - Dealer management (role: dealer)
   - `/admin/*` - Admin interface (role: admin)
3. **Profile sync** - User profiles in `public.profiles` table sync with auth.users

### Database Structure

Key tables and their relationships:

```
profiles (users) ← one-to-many → orders
    ↓                              ↓
  dealers ← one-to-many → test_rides
    ↓                              ↓
  leads                        vehicles
    ↓
dealer_applications → warranties → payments
```

Primary entities:
- `profiles` - User accounts with role designation
- `vehicles` - Product catalog with specifications
- `test_rides` - Booking system with dealer assignment
- `orders` - Purchase records with payment tracking
- `dealers` - Approved dealer accounts and metadata
- `dealer_applications` - Pending dealer registrations

### API Route Patterns

The application follows Next.js 15 App Router conventions:

```
/app/api/
  ├── public/        # Unauthenticated endpoints
  ├── admin/         # Admin-only operations
  ├── dealer/        # Dealer-specific endpoints
  └── [resource]/    # Resource-based CRUD operations
```

Example patterns:
- `GET /api/test-rides` - List user's test rides
- `POST /api/test-rides/book-simple` - Create booking
- `PUT /api/dealer/test-rides` - Update booking status
- `GET /api/public/dealers` - Public dealer list

### Real-time Subscriptions

The platform uses Supabase Realtime for live updates:

```typescript
// Pattern used in hooks/useRealtime.ts
supabase
  .channel('custom-channel')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'orders' 
  }, handleUpdate)
  .subscribe()
```

## Directory Structure

### `/app` - Application Routes
Organized by user role and feature:
- `/app/(auth)` - Login/signup pages
- `/app/dashboard` - Customer portal pages
- `/app/dealer` - Dealer management interface
- `/app/admin` - Administrative controls
- `/app/api` - API endpoints and server actions

### `/components` - UI Components
- `/components/ui` - shadcn/ui primitives
- `/components/sections` - Page sections (hero, testimonials)
- `/components/dashboard` - Dashboard-specific components
- `/components/realtime` - Live update components

### `/lib` - Core Utilities
- `/lib/supabase` - Database client configuration
- `/lib/api` - API utility functions
- `/lib/validation` - Zod schemas
- `/lib/email` - Email sending utilities
- `/lib/stores` - Zustand state stores

### `/emails` - Email Templates
React Email components for notifications:
- Welcome emails
- Order confirmations
- Test ride confirmations
- Dealer application updates

### `/hooks` - Custom React Hooks
- `use-razorpay` - Payment processing
- `use-realtime` - Live subscriptions
- `use-simple-booking` - Test ride booking

## Key Workflows

### Test Ride Booking Flow
1. Customer browses vehicles at `/dashboard/vehicles`
2. Clicks "Book Test Ride" → `/dashboard/test-rides/new`
3. Selects date, time, and optional dealer preference
4. System creates booking with status: `pending`
5. Dealer receives notification and approves/rejects
6. Customer receives email confirmation
7. Status updates: `pending` → `confirmed` → `completed`

### Order Management Flow
1. Customer selects vehicle and proceeds to checkout
2. Razorpay order created via `/api/orders/checkout`
3. Payment processed through Razorpay SDK
4. Webhook `/api/webhooks/razorpay` verifies payment
5. Order status updates and email sent
6. Dealer notified of new order

### Dealer Application Process
1. User submits application at `/dashboard/dealer-application`
2. Admin reviews at `/admin/dealer-applications`
3. Admin can request documents or additional info
4. Upon approval, dealer account created
5. User role updated to `dealer`
6. Access granted to dealer dashboard

## Development Guidelines

### Environment Variables

Required variables in `.env.local`:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Email Service (Required for notifications)
RESEND_API_KEY=
EMAIL_FROM=

# Payment Gateway (Required for orders)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

### Database Migrations

When modifying database schema:
1. Create migration: `npx supabase migration new descriptive_name`
2. Edit the generated SQL file in `/supabase/migrations`
3. Test locally: `npx supabase db push`
4. Deploy to production via Supabase Dashboard

### Component Development Patterns

The project uses composition patterns with shadcn/ui:

```tsx
// Example component structure
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function MyComponent() {
  const { toast } = useToast()
  
  // Component logic with proper error handling
  const handleAction = async () => {
    try {
      // Action logic
      toast({ title: "Success" })
    } catch (error) {
      toast({ 
        title: "Error",
        variant: "destructive" 
      })
    }
  }
}
```

### State Management

- **Server State**: Managed through API routes and React Server Components
- **Client State**: Zustand stores in `/lib/stores` for complex state
- **Form State**: React Hook Form for all forms
- **UI State**: Local component state for simple interactions

### Error Handling

Consistent error handling across the application:

```typescript
// API Routes
try {
  // Operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  )
}
```

## Troubleshooting

### Common Issues

1. **"Invalid input syntax for type uuid"**
   - Ensure all ID parameters are valid UUIDs
   - Check dealer/vehicle IDs in test ride bookings

2. **Supabase Auth Errors**
   - Verify environment variables are set correctly
   - Check Supabase project is active and not paused

3. **Email Not Sending**
   - Confirm RESEND_API_KEY is valid
   - Verify sender domain in Resend dashboard

4. **Payment Integration Issues**
   - Test with Razorpay test keys first
   - Ensure webhook secret matches dashboard configuration

### Development Tips

- Use the `/test-api` page to debug API endpoints
- Check Supabase logs for database query issues
- Monitor browser console for client-side errors
- Review Next.js terminal output for server errors

## Related Documentation

- `TEST_RIDE_SYSTEM.md` - Detailed test ride implementation
- `emails/README.md` - Email system documentation
- `docs/` - Additional technical documentation
- `.env.example` - Complete environment variable reference

## Production Considerations

- Enable Supabase Row Level Security (RLS) policies
- Configure proper CORS settings for production domain
- Set up monitoring and error tracking (Sentry, etc.)
- Implement rate limiting for public APIs
- Enable Supabase database backups
- Configure CDN for static assets
