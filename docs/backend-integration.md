# Backend Integration Guide

Author: Frontend/UI (demo)  
Scope: Map every UI feature to backend endpoints, payloads, DB tables, and side effects.  
Status: UI complete, all data mocked in local state/stores. Replace with real APIs outlined here.

Contents
- 1) Environment & Integrations
- 2) Feature → Page → Component → API mapping
- 3) Data model (SQL schema suggestions)
- 4) API design (endpoints, payloads, side effects)
- 5) Auth/session model
- 6) Payments
- 7) Email events
- 8) Maps integration
- 9) Replacing demo code: file-by-file instructions
- 10) Validation, rate limits, observability
- 11) Non-blocking backlog

--------------------------------------------------------------------

1) Environment & Integrations

Required env (server-only unless NEXT_PUBLIC is specified):
- DATABASE_URL: SQL (e.g., Neon Postgres)
- RESEND_API_KEY: Email provider (or alternative)
- JWT_SECRET: Sign/verify session tokens
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Client Maps JS (required on client for map script)
- PAYMENT_PROVIDER_KEY: Razorpay/Stripe/etc. (and webhook secret)
- UPSTASH_KV_REST_API_URL / UPSTASH_KV_REST_API_TOKEN: Optional for rate limiting (if used)

Notes:
- Only variables prefixed with NEXT_PUBLIC_* are safe on client. Others must be read server-side in Route Handlers/Server Actions.
- Avoid middleware for auth; prefer route-level gating and server components where possible.

--------------------------------------------------------------------

2) Feature → Page → Component → API mapping

Public site

A) Home
- Path: / (app/page.tsx)
- Components: 
  - Hero (components/sections/hero.tsx)
  - FeaturedModelsCarousel (components/sections/featured-models-carousel.tsx)
  - WhyChooseUs (components/sections/why-choose-us.tsx)
  - FinanceTools (components/calculators/finance-tools.tsx) → uses model data for savings/EMI
  - DealerLocations (components/sections/dealer-locations.tsx) → Map + filters
  - Testimonials (components/sections/testimonials.tsx)
- Backend:
  - GET /api/models (list minimal fields for cards and calculators)
  - Optional GET /api/dealers (name, address, services, lat/lng, rating, distance if computed)
  - Optional GET /api/testimonials

B) Models listing
- Path: /models (app/models/page.tsx)
- Features: search/filter/sort, select 2 models to compare (dialog), open model details
- Backend:
  - GET /api/models?query=&maxPrice=&sort=
  - GET /api/models/[slug] (for deep compare if needed)
- Side-effects: none (UI-only)

C) Model detail
- Path: /models/[slug] (app/models/[slug]/page.tsx)
- Features: gallery, specs, finance tools locked to model
- Backend:
  - GET /api/models/[slug]
- Side-effects: none (UI-only)

D) Dealers (Find Our Dealers)
- Path: /dealers (app/dealers/page.tsx)
- Features: map, filters, list, “Use Current Location”, CTAs to signup, dealer application, contact
- Backend:
  - GET /api/dealers?city=&service=&radiusKm=&q=
  - Optional: GET /api/geo/nearby?lat=&lng=&radiusKm= to compute distance server-side
- Future: live map markers synced with results (Google Maps Places/Geocoding)

E) About, Warranty info (public), Privacy, Terms
- Paths: /about, /warranty, /privacy, /terms
- Components: components/warranty/warranty-info.tsx
- Backend: none required for static pages
- Warranty operational flows live in Dashboards (below)

F) Contact Us
- Path: /contact (app/contact/page.tsx)
- UI: react-hook-form (UI-only)
- Backend:
  - POST /api/contact
    - Creates a contact ticket/lead, sends confirmation email, notifies admin
  - Optional: POST /api/leads for marketing pipeline

G) Login
- Path: /login (app/login/page.tsx)
- Features: email/password form, quick demo logins (customer/dealer/admin)
- Backend:
  - POST /api/auth/login → sets HttpOnly session cookie
  - POST /api/auth/logout → clears session
  - GET /api/auth/session → returns user + role

H) Signup
- Path: /signup (app/signup/page.tsx)
- Features: Customer registration form (name, email, phone, city, PIN, password, confirm, newsletter)
- Backend:
  - POST /api/auth/signup → creates user account and sets session cookie

I) Forgot Password
- Path: /forgot-password (app/forgot-password/page.tsx)
- Features: Email field, send reset link (demo)
- Backend:
  - POST /api/auth/forgot-password → sends password reset link to user email

J) Reset Password
- Path: /reset-password (app/reset-password/page.tsx)
- Features: New password + confirm (demo)
- Backend:
  - POST /api/auth/reset-password → updates user password

Auth & Role-gated areas

K) Authentication (Demo → Real)
- Current: components/auth/demo-auth-provider.tsx (demo in-memory/localStorage)
- Target:
  - POST /api/auth/login → sets HttpOnly session cookie
  - POST /api/auth/logout → clears session
  - GET /api/auth/session → returns user + role
- Role gating: customer (/dashboard), dealer (/dealer), admin (/admin)
- Replace client demo context with server-verified session and redirect on protected pages.

Customer dashboard

L) Customer Overview
- Path: /dashboard (app/dashboard/page.tsx)
- UI shows: recent orders, upcoming test ride, quick actions
- Backend:
  - GET /api/me (profile)
  - GET /api/orders?owner=me
  - GET /api/test-rides?owner=me&status=upcoming
  - Optional: GET /api/documents?owner=me

M) Profile
- Path: /dashboard/profile (app/dashboard/profile/page.tsx)
- Backend:
  - GET /api/me
  - PATCH /api/me (update basic info)

N) Orders (list)
- Path: /dashboard/orders (app/dashboard/orders/page.tsx)
- Backend:
  - GET /api/orders?owner=me
- Optional: GET /api/orders/[id], order timeline, invoices

O) Test Rides (list + new booking)
- Paths:
  - /dashboard/test-rides (list) (app/dashboard/test-rides/page.tsx)
  - /dashboard/test-rides/new (create) (app/dashboard/test-rides/new/page.tsx)
- Backend:
  - GET /api/test-rides?owner=me
  - POST /api/test-rides (customer booking)
    - On booking: optionally create a payment intent (₹2,000) → Payment provider
  - POST /api/payments/test-ride/intent (if using payment intents)
  - Webhook: /api/webhooks/payment (to mark payment Paid)
- Side-effects: email confirmations and receipts

P) Notifications
- Path: /dashboard/notifications (app/dashboard/notifications/page.tsx)
- Backend:
  - GET /api/notifications?owner=me
  - PATCH /api/notifications/[id] (mark read)

Q) Support (ticket create)
- Path: /dashboard/support (app/dashboard/support/page.tsx)
- Backend:
  - POST /api/support/tickets
  - Optional: GET /api/support/tickets?owner=me

R) Warranty (Customer)
- Path: /dashboard/warranty (app/dashboard/warranty/page.tsx)
- Shows: user warranties, timeline, buttons (certificate download, renew, claim)
- Backend:
  - GET /api/warranties?owner=me
  - POST /api/warranties/certificate (generate PDF); or GET /api/warranties/[id]/certificate
  - POST /api/warranties/[id]/renew (start renewal flow)
  - POST /api/warranties/[id]/claims (submit a claim)
- Side-effects: email confirmations, pdf attachments where applicable
- Note: Timeline math is computed client-side now; keep server as source of truth.

Dealer dashboard

S) Dealer Overview + Analytics
- Path: /dealer (app/dealer/page.tsx)
- Backend:
  - GET /api/dealer/metrics (KPI cards)
  - GET /api/dealer/charts/sales-monthly
  - GET /api/dealer/charts/top-models
  - GET /api/dealer/orders/recent

T) Dealer → Test Rides (create for customer)
- Path: /dealer/test-rides (app/dealer/test-rides/page.tsx)
- Backend:
  - POST /api/test-rides (dealer-initiated; same model with createdBy=dealer, owner=customerEmail)
  - Optional: mark payment as Paid/Pending at create
- Side-effects: notify customer by email

U) Dealer → Orders (create for customer)
- Path: /dealer/orders (app/dealer/orders/page.tsx)
- Backend:
  - POST /api/orders (dealer-initiated)
  - Side-effects: customer email, internal notification

V) Dealer → Customers (CRM list)
- Path: /dealer/customers (app/dealer/customers/page.tsx)
- Backend:
  - GET /api/dealer/customers
  - Optional: filters/pagination

W) Dealer → Warranty (Registration)
- Path: /dealer/warranty (app/dealer/warranty/page.tsx)
- Component: WarrantyRegistrationForm (components/warranty/warranty-registration-form.tsx)
- Backend:
  - POST /api/warranties (register new; payload includes images/signature)
    - Store invoice image (Vercel Blob or object storage)
    - Store signature image (dataURL → upload)
  - GET /api/warranties?dealerName=... (for “Recent Submissions” table)
- Side-effects: notify admin for review, notify customer receipt

Admin dashboard

X) Admin Overview + Analytics
- Path: /admin (app/admin/page.tsx)
- Backend:
  - GET /api/admin/metrics
  - GET /api/admin/charts/sales-monthly
  - GET /api/admin/charts/top-models
  - GET /api/admin/orders/recent

Y) Admin → Users (roles)
- Path: /admin/users (app/admin/users/page.tsx)
- Backend:
  - GET /api/admin/users
  - PATCH /api/admin/users/[id]/role (promote/demote)
  - Side-effects: If role changes, require session revalidation for current session

Z) Admin → Warranties (approval queue)
- Path: /admin/warranties (app/admin/warranties/page.tsx)
- Backend:
  - GET /api/warranties (all or status=PendingReview)
  - POST /api/warranties/[id]/approve
  - POST /api/warranties/[id]/decline
- Side-effects: notify dealer + customer

AA) Admin → Dealer Applications (review)
- Path: /admin/dealer-applications (app/admin/dealer-applications/page.tsx)
- Backend:
  - GET /api/dealer-applications
  - POST /api/dealer-applications/[id]/approve (also PATCH /api/admin/users to set role=dealer)
  - POST /api/dealer-applications/[id]/decline
- Side-effects: notify applicant by email

AB) Admin → Dealers (placeholder)
- Path: /admin/dealers (app/admin/dealers/page.tsx)
- Backend: none required for static pages

AC) Admin → Products (placeholder)
- Path: /admin/products (app/admin/products/page.tsx)
- Backend: none required for static pages

AD) Admin → Orders (placeholder)
- Path: /admin/orders (app/admin/orders/page.tsx)
- Backend: none required for static pages

Global/shared

AE) Site Header and Role Gate
- Paths: global header (components/site-header.tsx), role-gate component
- Backend:
  - GET /api/auth/session (hydrate header menu state)
  - Replace client-only role checks with server session checks per route group

AF) Finance Tools (Savings & EMI)
- Read-only calculators. No backend required.
- Optional: GET /api/pricing/energy?region=... for per-state petrol/electricity baselines.

AG) Dealers Map
- Optional: GET /api/dealers + client-side Google Maps JS integration
- Optional: compute distance server-side or using Places API client-side

--------------------------------------------------------------------

3) Data model (SQL schema suggestions)

Users
- users(id PK, name, email unique, role enum(customer|dealer|admin), phone, created_at)
- sessions(id PK, user_id FK, token hash, expires_at, created_at)
- profiles(user_id FK, city, pincode, ...)

Models & Catalog
- models(id PK, slug unique, name, tagline, price, images jsonb, colors jsonb, badges jsonb, rating, reviews, specs jsonb, created_at)
  specs = { rangeKm, topSpeed, chargeHours, motorPowerW, batteryWh, evUnitsPer100Km, petrolKmPerL }

Dealers
- dealers(id PK, name, owner, phone, email, address, city, state, pincode, lat, lng, rating, services text[], website, created_at)

Test Rides
- test_rides(id PK, customer_id FK users, customer_email, customer_name, model_id FK models, model_name, dealer_id FK dealers nullable, dealer_name, date, time, status enum(Pending|Confirmed|Completed|Cancelled), payment_amount, payment_currency default 'INR', payment_status enum(Pending|Paid), payment_ref, created_by enum(customer|dealer), created_at)

Orders
- orders(id PK, customer_id FK users, customer_email, customer_name, model_name, value, status enum(Confirmed|In Production|Shipped|Delivered), created_at)

Warranties
- warranties(id PK, customer_id FK users, customer_email, customer_name, phone, model_id FK models, model_name, vin, purchase_date date, period_years smallint, dealer_id FK dealers nullable, dealer_name, invoice_url, signature_url, review_status enum(PendingReview|Approved|Declined), reviewer_id FK users nullable, reviewed_at, created_at)

Dealer Applications
- dealer_applications(id PK, applicant_id FK users nullable, applicant_email, applicant_name, phone, city, business_name, years_experience int, gst, message, status enum(Pending|Approved|Declined), reviewer_id FK users nullable, reviewed_at, created_at)

Leads/Contacts
- leads(id PK, name, email, phone, subject, message, source enum(contact|model|other), priority enum(normal|urgent), status enum(open|closed), created_at)

Notifications
- notifications(id PK, user_id FK users, title, body, read boolean default false, created_at)

Analytics (optional)
- Precompute materialized views or store aggregates per month

--------------------------------------------------------------------

4) API design (endpoints, payloads, side effects)

Auth
- POST /api/auth/login
  - Input: { email, password }
  - Output: { user: { id, name, email, role } }
  - Side: set HttpOnly cookie session
- POST /api/auth/logout
- GET /api/auth/session
  - Output: { user | null }
- POST /api/auth/signup
  - Input: { name, email, phone, city, pincode, password, confirm, newsletter }
  - Output: { user: { id, name, email, role } }
  - Side: set HttpOnly cookie session
- POST /api/auth/forgot-password
  - Input: { email }
  - Side: send password reset link to user email
- POST /api/auth/reset-password
  - Input: { token, newPassword, confirmPassword }
  - Side: update user password

Models
- GET /api/models?query=&maxPrice=&sort=
  - Output: { items: Model[] }
- GET /api/models/[slug]
  - Output: Model

Dealers
- GET /api/dealers?city=&service=&radiusKm=&q=&lat=&lng=
  - Output: { items: Dealer[] }

Contact & Leads
- POST /api/contact
  - Input: { name, email, phone, subject, message, priority }
  - Side: insert into leads, send mail to support + auto-ack to user

Test Rides
- GET /api/test-rides?owner=me
- POST /api/test-rides
  - Input (customer): { modelId, dealerName, date, time }
  - Input (dealer): { customerEmail, customerName?, modelId, dealerName, date, time, paid?: boolean }
  - Side: if paid=false, create payment intent / require subsequent payment
- POST /api/test-rides/[id]/pay (optional if not using external checkout redirection)
- Webhook: POST /api/webhooks/payment
  - Validates signature, sets payment_status='Paid', payment_ref

Orders
- GET /api/orders?owner=me
- POST /api/orders (dealer)
  - Input: { customerEmail, customerName?, modelName, value, status }

Warranties
- GET /api/warranties?owner=me
- GET /api/warranties?dealerName=... (dealer view)
- GET /api/warranties (admin)
- POST /api/warranties
  - Input: multipart/form-data
    - customerEmail, customerName, phone, modelId, modelName, vin, purchaseDate, periodYears, dealerName
    - invoice (file), signature (file or dataURL)
  - Side: upload invoice and signature, set review_status='PendingReview', email admin
- POST /api/warranties/[id]/approve
- POST /api/warranties/[id]/decline
- GET /api/warranties/[id]/certificate (returns a PDF or URL)
- POST /api/warranties/[id]/renew
- POST /api/warranties/[id]/claims

Dealer Applications
- GET /api/dealer-applications (admin)
- POST /api/dealer-applications (customer self-apply; or dealer page if authenticated customer)
  - Input: { applicantEmail, applicantName, phone, city, businessName, yearsExperience?, gst?, message? }
- POST /api/dealer-applications/[id]/approve → also PATCH user role → dealer
- POST /api/dealer-applications/[id]/decline

Users (Admin)
- GET /api/admin/users
- PATCH /api/admin/users/[id]/role { role }

Notifications
- GET /api/notifications?owner=me
- PATCH /api/notifications/[id] { read: true }

Analytics (Dealer/Admin)
- GET /api/dealer/metrics, /api/dealer/charts/*
- GET /api/admin/metrics, /api/admin/charts/*

--------------------------------------------------------------------

5) Auth/session model

- Use email/password or provider-based login.
- On POST /api/auth/login, verify credentials, issue session (JWT or DB-session token):
  - Set HttpOnly, Secure cookie (SameSite=Lax or Strict).
- GET /api/auth/session returns user + role.
- Replace client RoleGate-only checks with:
  - Route handlers that confirm session role and return 401/403 if unauthorized.
  - In RSC pages, read session server-side and redirect if needed.
- Do not use Next middleware for auth. Gate at route level.

--------------------------------------------------------------------

6) Payments

Use Razorpay/Stripe (example flow for test rides):
- Client (customer or dealer) initiates booking → POST /api/test-rides
  - If require payment: create payment intent (amount: ₹2,000) and return payment session for client to complete.
- Webhook handler /api/webhooks/payment
  - Verify signature, locate test_ride by metadata/ref, set payment_status='Paid', set payment_ref, email receipt.

Optional: Use provider’s hosted checkout to simplify PCI scope.

--------------------------------------------------------------------

7) Email events (Resend or similar)

Templates to send:
- Contact acknowledgement (to user) + Forward to support
- Test ride: booking confirmation, payment receipt, reminder (24h prior)
- Order: created/updated statuses
- Warranty: submission receipt (to dealer+customer), approved/declined notification
- Dealer Application: receipt, approved (with next steps), declined
- Admin alerts: new warranty submission, new dealer application

--------------------------------------------------------------------

8) Maps integration (Google Maps)

- Load Maps JS on /dealers with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
- Replace placeholder image in components/sections/dealer-locations.tsx with a live map:
  - Render markers for dealers from GET /api/dealers.
  - Geolocation (“Use Current Location”): use navigator.geolocation to center and call backend to compute nearby dealers (or compute client-side with Haversine).
- Optional: server-side geocoding of dealer addresses to lat/lng if not stored.

--------------------------------------------------------------------

9) Replacing demo code: file-by-file

Auth
- components/auth/demo-auth-provider.tsx
  - Replace login() with fetch('/api/auth/login') and use HttpOnly cookie for session.
  - Replace persisted localStorage user with GET /api/auth/session on mount.
  - loginAs(role) is demo-only; remove in production, or keep behind DEV flag.

Contact & Leads
- app/contact/page.tsx onSubmit()
  - Replace alert with await fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) }).

Models
- lib/models-data.ts currently hardcoded.
  - Swap to GET /api/models and GET /api/models/[slug] in:
    - app/models/page.tsx (listing/filtering)
    - app/models/[slug]/page.tsx (detail + calculators)

Dealers
- components/sections/dealer-locations.tsx
  - Replace static dealersData with GET /api/dealers.
  - If geolocation granted, call GET /api/geo/nearby or compute Haversine client-side.
  - Replace placeholder markers with Google Maps markers and InfoWindows.

Customer Dashboard
- app/dashboard/page.tsx, app/dashboard/orders/page.tsx, app/dashboard/test-rides/page.tsx
  - Replace lib/demo.ts and local stores with:
    - GET /api/orders?owner=me
    - GET /api/test-rides?owner=me
  - app/dashboard/test-rides/new/page.tsx → POST /api/test-rides (and payment if required)

Support
- app/dashboard/support/page.tsx → POST /api/support/tickets

Warranty Flows
- app/dealer/warranty/page.tsx → components/warranty/warranty-registration-form.tsx
  - Replace submitWarranty() (local store) with POST /api/warranties (multipart: invoice, signature)
- app/admin/warranties/page.tsx
  - Replace listWarranties(), setWarrantyReview() with:
    - GET /api/warranties
    - POST /api/warranties/[id]/approve / decline
- app/dashboard/warranty/page.tsx
  - Replace listWarrantiesByEmail() with GET /api/warranties?owner=me
  - Implement certificate/renew/claim endpoints as noted

Dealer Applications
- app/dashboard/dealer-application/page.tsx
  - Replace submitApplication(), getUserApplication() with:
    - POST /api/dealer-applications
    - GET /api/dealer-applications?owner=me
- app/admin/dealer-applications/page.tsx
  - Replace getApplications(), setApplicationStatus() with:
    - GET /api/dealer-applications
    - POST /api/dealer-applications/[id]/approve / decline
    - PATCH user role if approved

Users (Admin)
- app/admin/users/page.tsx
  - Replace getUsers(), setUserRole() with:
    - GET /api/admin/users
    - PATCH /api/admin/users/[id]/role

Analytics
- app/dealer/page.tsx, app/admin/page.tsx
  - Replace lib/demo.ts with:
    - GET /api/dealer/metrics, /api/dealer/charts/*
    - GET /api/admin/metrics, /api/admin/charts/*

--------------------------------------------------------------------

10) Validation, rate limits, observability

- Validate request payloads (zod or similar) in Route Handlers.
- Rate limit public endpoints (e.g., contact, leads) with Upstash or per-IP counters.
- Logging: log request IDs, actor (user_id), and key business events (order created, test ride booked, warranty approved).
- Error model: return { error: { code, message, fields? } } with appropriate HTTP status.

--------------------------------------------------------------------

11) Non-blocking backlog

- Persist “compare” selections and calculator inputs in localStorage for continuity (frontend only).
- Add loading.tsx and error.tsx for key routes.
- Add pagination for large lists (dealers, orders, warranties).
- Add notifications bell feed connected to /api/notifications.
- Add service center directory and downloadable brochures endpoints.
- Add role-based SSG/ISR caching strategy for public pages.

--------------------------------------------------------------------

Appendix: Sample payloads

POST /api/test-rides (customer)
{
  "modelId": "urban-pro",
  "dealerName": "Green Wheels Bengaluru",
  "date": "2025-09-12",
  "time": "11:00"
}

POST /api/warranties (multipart)
Fields:
- customerEmail, customerName, phone, modelId, modelName, vin, purchaseDate, periodYears, dealerName
Files:
- invoice (image)
- signature (image)

POST /api/contact
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "9876512345",
  "subject": "Service Support",
  "message": "Need help with charger port.",
  "priority": "urgent"
}

POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "city": "Bangalore",
  "pincode": "560001",
  "password": "securepassword",
  "confirm": "securepassword",
  "newsletter": true
}

POST /api/auth/forgot-password
{
  "email": "john@example.com"
}

POST /api/auth/reset-password
{
  "token": "reset_token_here",
  "newPassword": "new_securepassword",
  "confirmPassword": "new_securepassword"
}
