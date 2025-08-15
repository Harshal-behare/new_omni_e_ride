# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Omni E-Ride** is a comprehensive electric vehicle e-commerce platform that connects customers, dealers, and administrators through a modern web application. The platform facilitates vehicle sales, dealer management, test ride bookings, and service appointments with role-based dashboards for each user type.

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4.1.9
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth 
- **Payment:** Razorpay integration
- **Email:** Resend
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Package Manager:** pnpm (required)

### Current Status
- **Build Status:** ✅ Successful
- **Progress:** 90% complete, ready for database setup
- **Production Ready:** Yes, pending final environment configuration

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# TypeScript type check (custom script to add if needed)
npx tsc --noEmit
```

---

## Environment Variables

### Setup
```bash
# Copy example environment file
cp .env.local.example .env.local
```

### Required Variables
```env
# Supabase (Required for production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Payment Integration (Razorpay)
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Email Service (Resend)
```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Optional
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## Architecture Overview

### Directory Structure
```
app/                    # Next.js App Router pages
├── api/               # API routes
├── dashboard/         # Customer dashboard
├── dealer/            # Dealer portal
├── admin/             # Admin interface
├── (auth)/           # Auth pages (login, signup)
└── (public)/         # Public pages (home, models, about)

components/            # Reusable UI components
├── ui/               # shadcn/ui components
├── auth/             # Authentication components
├── forms/            # Form components
└── sections/         # Page sections

lib/                  # Utility functions and configurations
├── api/              # API client functions
├── stores/           # Zustand state stores
├── supabase/         # Supabase client setup
├── razorpay/         # Payment integration
├── validation/       # Zod schemas
├── database.types.ts # TypeScript types
└── utils.ts          # Utility functions

supabase/             # Database migrations and config
├── migrations/       # SQL migration files
└── config.toml       # Supabase configuration
```

### Key Architecture Patterns

**Client/Server Components:** Mixed usage with server components for data fetching and client components for interactivity.

**API Routes:** Follow REST patterns under `/app/api/*` with proper error handling and validation.

**State Management:** Zustand stores for auth, notifications, and form state.

**Data Flow:** Server Components → API Routes → Supabase → Database

**Note:** No RLS policies are currently set - this is intentional until project completion.

---

## Authentication & RBAC

### User Roles
1. **Customer** (default): Dashboard access, order management, test rides
2. **Dealer** (requires approval): Dealer portal, inventory management, lead handling
3. **Admin**: Full system access, user management, analytics

### Authentication Flow
The platform uses a hybrid authentication system:
- **Supabase Auth:** Primary authentication for production users with email verification
- **Demo Mode:** Quick access for testing with predefined demo accounts
- **Profile Storage:** User profiles stored in `profiles` table with extended fields (name, phone, address, city, state, pincode)
- **Session Management:** Automatic session refresh and persistence across browser reloads

### Protected Routes
- `/dashboard/*` - Requires any authenticated user
- `/dealer/*` - Requires dealer or admin role
- `/admin/*` - Requires admin role

### Implementation
```tsx
// Using RoleGate component
<RoleGate allow={['admin', 'dealer']}>
  <DealerContent />
</RoleGate>

// Using auth hook
const { user, loading } = useAuth()
if (user?.role === 'admin') {
  // Admin functionality
}
```

### Auth Providers
- **Primary:** `DemoAuthProvider` (supports both demo and Supabase)
- **Hook:** `useAuth()` for accessing user state
- **Store:** `useAuthStore` (Zustand) for auth state management

---

## Database Management

### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Copy URL and anon key to `.env.local`
3. Run database migration

### Migration Commands
```bash
# Initialize Supabase locally (optional)
supabase start

# Apply migrations 
supabase db push

# Reset database (destructive)
supabase db reset
```

### Key Tables
- **profiles** - User profiles with role information (extends auth.users)
- **vehicles** - Product catalog with specifications and images
- **orders** - Order management with auto-generated order numbers
- **payments** - Payment tracking (Razorpay integration)
- **dealers** - Dealer network information
- **dealer_applications** - Dealer application workflow (includes terms_accepted, documents JSONB)
- **test_rides** - Test ride bookings with confirmation codes
- **leads** - Lead management and tracking
- **notifications** - User notifications
- **contact_inquiries** - Contact form submissions
- **warranties** - Warranty management

### Schema Location
Complete schema: `database_schema.sql` (root directory)

### Database Features
- **Auto-generated Functions:** Order numbers, warranty codes, confirmation codes
- **ENUM Types:** user_role, order_status, payment_status, dealer_status, etc.
- **JSONB Fields:** For flexible data storage (specifications, features, metadata)
- **Foreign Key Constraints:** Proper table relationships
- **No RLS Policies:** Currently disabled until project completion

### Storage Buckets
- **scooter-images** - Vehicle/scooter images
- **documents** - All document uploads including dealer documents (business_license, tax_certificate, bank_statement). Documents are saved under `userId/{documentType}_timestamp.ext`
- **avatar** - Avatar images of profiles

---

## Key Integrations

### Supabase
- **Authentication:** Email/password with role-based access
- **Database:** PostgreSQL with real-time subscriptions
- **Storage:** File uploads for dealer documents to `documents` bucket. Documents are saved under `userId/{documentType}_timestamp.ext` and public URLs are stored in `dealer_applications.documents` for admin download.
- **Client Files:** `lib/supabase/client.ts` and `lib/supabase/server.ts`

### Razorpay Payment Gateway
- **Integration:** `lib/razorpay/client.ts`
- **Webhooks:** `/app/api/webhooks/razorpay/route.ts`
- **Test Cards:** Standard Razorpay test cards work
- **Features:** Order creation, payment verification, refunds

### Resend Email Service
- **Templates:** `emails/` directory with React Email components
- **API:** `/app/api/contact/route.ts` for contact forms
- **Features:** Welcome emails, order confirmations, notifications

---

## Component Patterns

### UI Components
Built with shadcn/ui (Radix UI primitives):
```tsx
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
```

### Form Handling
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validation/schemas'

const form = useForm({
  resolver: zodResolver(loginSchema)
})
```

### Loading States
```tsx
import { Skeleton } from '@/components/ui/skeleton'

if (loading) return <Skeleton className="h-4 w-full" />
```

### Theme Support
Dark/light mode implemented with `next-themes`:
```tsx
import { ThemeProvider } from '@/components/theme-provider'
```

---

## Development Workflow

### TypeScript Standards
- **Strict Mode:** Enabled in `tsconfig.json`
- **Types:** Database types auto-generated in `lib/database.types.ts`
- **Validation:** All API inputs validated with Zod schemas

### API Route Pattern
```tsx
// app/api/example/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Validate with Zod schema
    const validated = schema.parse(body)
    // Process request
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' }, 
      { status: 400 }
    )
  }
}
```

### State Management
Zustand stores for:
- **Auth:** `lib/stores/auth.ts`
- **Notifications:** `lib/stores/notifications.ts`
- **Theme:** Built-in with next-themes

### Data Fetching
- **Server Components:** Direct database queries using Supabase server client
- **Client Components:** API routes for mutations and client-side data
- **No Real-time Features:** Project is kept minimal without live updates

---

## Deployment

### Vercel Configuration
Project is configured for Vercel deployment with:
- **Auto-deployment:** Connected to Git repository
- **Environment Variables:** Set in Vercel dashboard
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install`

### Security Headers
Configured in `next.config.js`:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- XSS Protection
- Frame Options

### Image Optimization
Configured remote patterns for:
- Supabase storage
- Unsplash (demo images)
- Local images

### Production Checklist
- [ ] Environment variables set
- [ ] Supabase project configured
- [ ] Razorpay keys (live mode)
- [ ] Email service configured
- [ ] Domain configured in Supabase auth settings

---

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Type check
npx tsc --noEmit
```

### Supabase Connection Issues
1. Verify environment variables are set
2. Check Supabase project status
3. Ensure API keys are correct
4. Check network/firewall restrictions

### Authentication Problems
- **Demo Mode:** Set `NEXT_PUBLIC_SUPABASE_URL` to empty string to force demo mode
- **Role Issues:** Check profile creation triggers in database
- **Session Issues:** Clear browser storage and cookies

### Payment Integration
- **Test Mode:** Use Razorpay test keys and test card numbers
- **Webhook Testing:** Use ngrok for local webhook testing
- **CORS Issues:** Verify allowed origins in next.config.js

---

## Quick Reference

### Important File Locations
- **Database Types:** `lib/database.types.ts`
- **Auth Store:** `lib/stores/auth.ts`
- **API Client:** `lib/api/*.ts`
- **Validation Schemas:** `lib/validation/schemas.ts`
- **Environment Config:** `lib/env.ts`

### Key API Endpoints
- **Auth:** `/api/auth/*` (login, signup, logout)
- **Orders:** `/api/orders/*` (create, retrieve, update)
- **Payments:** `/api/payments/*` (create, verify)
- **Test Rides:** `/api/test-rides/*` (book, manage)
- **Contact:** `/api/contact` (contact form submissions)
- **Webhooks:** `/api/webhooks/razorpay` (payment confirmations)

### Database Relationships
```
profiles (extends auth.users)
├── orders (one-to-many)
├── test_rides (one-to-many) 
├── dealer_applications (one-to-one)
├── dealers (one-to-one) 
├── leads (one-to-many as assigned_to)
├── notifications (one-to-many)
└── contact_inquiries (one-to-many as assigned_to)

vehicles
├── orders (one-to-many)
├── test_rides (one-to-many)
└── leads (one-to-many as vehicle_interested)

orders
├── payments (one-to-many)
└── warranties (one-to-one)

dealers
├── orders (one-to-many)
├── test_rides (one-to-many)
└── leads (one-to-many)
```

### User Journey Flows
1. **Customer:** Signup → Browse → Test Ride → Purchase → Track Order
2. **Dealer:** Apply → Approval → Portal Access → Manage Inventory/Leads
3. **Admin:** Login → Manage Users/Dealers/Orders → Analytics

### Role Permissions Matrix
| Feature | Customer | Dealer | Admin |
|---------|----------|--------|-------|
| Browse Products | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ❌ | ✅ |
| Book Test Rides | ✅ | ❌ | ✅ |
| Manage Inventory | ❌ | ✅ | ✅ |
| Approve Dealers | ❌ | ❌ | ✅ |
| Manage Leads | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

---

*This document should be updated as the project evolves. Last updated: January 2025*
