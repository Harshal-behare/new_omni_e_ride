# Supabase Authentication Setup Guide

## Overview

This application now supports both demo authentication and real Supabase authentication. The demo mode allows testing without setting up Supabase, while the Supabase integration provides production-ready authentication.

## Features

- ✅ User registration with role assignment (customer, dealer, admin)
- ✅ Email/password authentication
- ✅ Session management
- ✅ Password recovery
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with middleware
- ✅ Demo mode for testing

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials from the project dashboard:
   - Go to Settings > API
   - Copy the `URL` and `anon public` key

3. Update `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 3. Set Up Database Tables

1. Go to the SQL Editor in your Supabase dashboard
2. Run the migration script from `supabase/migrations/001_create_profiles_table.sql`
3. This will create:
   - `profiles` table for storing user roles and additional data
   - Row Level Security (RLS) policies
   - Automatic profile creation trigger

### 4. Configure Authentication Settings

1. In Supabase Dashboard, go to Authentication > Settings
2. Configure email settings:
   - Enable email confirmations (optional for development)
   - Set up SMTP if you want real emails
   - Configure redirect URLs

3. Add your app URLs to allowed redirect URLs:
   - `http://localhost:3000/**`
   - `https://your-production-domain.com/**`

## API Endpoints

All authentication endpoints are available at:

- **POST /api/auth/signup** - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "customer" // optional: customer|dealer|admin
  }
  ```

- **POST /api/auth/login** - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **POST /api/auth/logout** - Logout current user

- **GET /api/auth/session** - Get current session

- **POST /api/auth/reset-password** - Request password reset
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **PUT /api/auth/reset-password** - Update password with token
  ```json
  {
    "password": "newpassword123"
  }
  ```

## Using Authentication in Components

### 1. Auth Provider

The app uses `DemoAuthProvider` which supports both demo and Supabase auth:

```tsx
// In app/layout.tsx
import { DemoAuthProvider } from '@/components/auth/demo-auth-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DemoAuthProvider>
          {children}
        </DemoAuthProvider>
      </body>
    </html>
  )
}
```

### 2. Using the Auth Hook

```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, login, logout, signup } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) {
    return <div>Not logged in</div>
  }
  
  return (
    <div>
      Welcome {user.name} ({user.role})
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### 3. Protecting Routes with RoleGate

```tsx
import { RoleGate } from '@/components/auth/role-gate'

function AdminPage() {
  return (
    <RoleGate allow={['admin']}>
      <div>Admin only content</div>
    </RoleGate>
  )
}

// With custom fallback
function DealerPage() {
  return (
    <RoleGate 
      allow={['dealer', 'admin']}
      fallback={<div>You need dealer access</div>}
    >
      <div>Dealer content</div>
    </RoleGate>
  )
}
```

## Demo Mode

The application supports demo logins for testing:

- **Customer**: customer@demo.com / demo123
- **Dealer**: dealer@demo.com / demo123
- **Admin**: admin@demo.com / demo123

Demo mode works without Supabase configuration and stores session in localStorage.

## Role-Based Access Control

### Roles

- **customer**: Regular users, can access dashboard
- **dealer**: Dealers, can access dealer portal
- **admin**: Administrators, full access

### Protected Routes (via middleware)

- `/dashboard/*` - Requires authentication (any role)
- `/dealer/*` - Requires dealer or admin role
- `/admin/*` - Requires admin role

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check if email is confirmed (if email confirmation is enabled)
   - Verify password meets requirements (min 6 characters)

2. **Profile not created**
   - Ensure the database trigger is created
   - Check RLS policies are properly set

3. **Session not persisting**
   - Check cookie settings in middleware
   - Ensure environment variables are set correctly

4. **Role-based redirects not working**
   - Verify profile table has correct role
   - Check middleware configuration

## Security Best Practices

1. **Never expose service role key** - Only use in server-side code
2. **Use RLS policies** - Always enable Row Level Security
3. **Validate roles server-side** - Don't trust client-side role checks
4. **Use HTTPS in production** - Required for secure cookies
5. **Configure CORS properly** - Set allowed origins in Supabase

## Testing

### Manual Testing

1. Test user registration with different roles
2. Test login/logout flow
3. Test password reset flow
4. Test role-based access to protected routes
5. Test session persistence across page refreshes

### API Testing with cURL

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get session
curl http://localhost:3000/api/auth/session

# Logout
curl -X POST http://localhost:3000/api/auth/logout
```

## Migration from Demo to Production

1. Set up Supabase project and database
2. Configure environment variables
3. Test authentication flow
4. Migrate existing users if needed
5. Disable demo logins in production (optional)

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review error logs in Supabase Dashboard
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
