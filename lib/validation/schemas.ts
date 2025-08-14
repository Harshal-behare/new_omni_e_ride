import { z } from 'zod'

// ============================================
// Common Validation Schemas
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()
  .max(255, 'Email must be less than 255 characters')

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
  .transform((val) => val.replace(/\D/g, ''))

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const uuidSchema = z.string().uuid('Invalid ID format')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: phoneSchema.optional(),
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

// ============================================
// User Profile Schemas
// ============================================

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  avatar_url: z.string().url().optional(),
})

// ============================================
// Vehicle Schemas
// ============================================

export const vehicleCreateSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  type: z.enum(['electric_scooter', 'electric_bike', 'electric_moped']),
  brand: z.string().min(2).max(50),
  model: z.string().min(2).max(50),
  price: z.number().positive().max(10000000),
  discounted_price: z.number().positive().max(10000000).optional(),
  description: z.string().max(5000).optional(),
  features: z.record(z.any()).optional(),
  specifications: z.record(z.any()).optional(),
  images: z.array(z.string().url()).min(1).max(10),
  colors: z.array(z.string()).min(1).max(10),
  stock_quantity: z.number().int().min(0).default(0),
  range_km: z.number().int().positive().max(1000),
  top_speed_kmph: z.number().int().positive().max(200),
  charging_time_hours: z.number().positive().max(24),
  battery_capacity: z.string().max(50).optional(),
  motor_power: z.string().max(50).optional(),
})

export const vehicleUpdateSchema = vehicleCreateSchema.partial()

export const vehicleQuerySchema = z.object({
  type: z.enum(['electric_scooter', 'electric_bike', 'electric_moped']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
}).merge(paginationSchema)

// ============================================
// Order Schemas
// ============================================

export const addressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  address: z.string().min(10).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  landmark: z.string().max(200).optional(),
})

export const orderCreateSchema = z.object({
  vehicle_id: uuidSchema,
  quantity: z.number().int().positive().max(10).default(1),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional(),
  notes: z.string().max(1000).optional(),
  coupon_code: z.string().max(50).optional(),
})

export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']).optional(),
  tracking_number: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

export const orderQuerySchema = z.object({
  status: z.array(z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])).optional(),
  payment_status: z.array(z.enum(['pending', 'processing', 'completed', 'failed', 'refunded'])).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  user_id: uuidSchema.optional(),
  dealer_id: uuidSchema.optional(),
}).merge(paginationSchema)

// ============================================
// Payment Schemas
// ============================================

export const paymentCreateOrderSchema = z.object({
  amount: z.number().positive().max(10000000),
  currency: z.enum(['INR', 'USD']).default('INR'),
  order_id: uuidSchema,
  notes: z.record(z.string()).optional(),
})

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  order_id: uuidSchema,
})

// ============================================
// Dealer Schemas
// ============================================

export const dealerApplicationSchema = z.object({
  business_name: z.string().min(3).max(200),
  business_type: z.enum(['individual', 'partnership', 'company']),
  business_address: z.string().min(10).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  business_phone: phoneSchema,
  business_email: emailSchema,
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional(),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number').optional(),
  aadhar_number: z.string().regex(/^\d{12}$/, 'Invalid Aadhar number').optional(),
  current_business: z.string().max(500).optional(),
  experience_years: z.number().int().min(0).max(100).optional(),
  investment_capacity: z.enum(['below_5_lakh', '5_10_lakh', '10_25_lakh', 'above_25_lakh']).optional(),
  preferred_areas: z.array(z.string()).max(10).optional(),
  why_partner: z.string().max(1000).optional(),
})

export const dealerApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
})

// ============================================
// Test Ride Schemas
// ============================================

export const testRideBookingSchema = z.object({
  vehicle_id: uuidSchema,
  dealer_id: uuidSchema.optional(),
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  preferred_date: z.string().datetime(),
  preferred_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  alternate_date: z.string().datetime().optional(),
  alternate_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  city: z.string().min(2).max(100),
  address: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
})

export const testRideUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  confirmed_date: z.string().datetime().optional(),
  confirmed_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  dealer_notes: z.string().max(500).optional(),
  cancellation_reason: z.string().max(500).optional(),
})

// ============================================
// Lead Schemas
// ============================================

export const leadCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  vehicle_interested: uuidSchema.optional(),
  source: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

export const leadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  assigned_to: uuidSchema.optional(),
  dealer_id: uuidSchema.optional(),
  notes: z.string().max(1000).optional(),
  lost_reason: z.string().max(500).optional(),
})

// ============================================
// Contact Schemas
// ============================================

export const contactInquirySchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
})

// ============================================
// Warranty Schemas
// ============================================

export const warrantyCreateSchema = z.object({
  order_id: uuidSchema,
  vehicle_id: uuidSchema,
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  terms: z.record(z.any()).optional(),
})

export const warrantyClaimSchema = z.object({
  warranty_id: uuidSchema,
  issue_description: z.string().min(10).max(1000),
  preferred_service_date: z.string().datetime().optional(),
  images: z.array(z.string().url()).max(5).optional(),
})

// ============================================
// Sanitization Helpers
// ============================================

export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  const noHtml = input.replace(/<[^>]*>/g, '')
  
  // Remove any script tags specifically
  const noScript = noHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Escape special characters
  const escaped = noScript
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  // Trim whitespace
  return escaped.trim()
}

// ============================================
// Validation Middleware Helper
// ============================================

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown): Promise<T> => {
    try {
      return await schema.parseAsync(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
      }
      throw error
    }
  }
}

// Export all schemas as a namespace for easy access
export const schemas = {
  // Common
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  uuid: uuidSchema,
  pagination: paginationSchema,
  
  // Auth
  login: loginSchema,
  signup: signupSchema,
  resetPassword: resetPasswordSchema,
  updatePassword: updatePasswordSchema,
  
  // Profile
  profileUpdate: profileUpdateSchema,
  
  // Vehicle
  vehicleCreate: vehicleCreateSchema,
  vehicleUpdate: vehicleUpdateSchema,
  vehicleQuery: vehicleQuerySchema,
  
  // Order
  address: addressSchema,
  orderCreate: orderCreateSchema,
  orderUpdate: orderUpdateSchema,
  orderQuery: orderQuerySchema,
  
  // Payment
  paymentCreateOrder: paymentCreateOrderSchema,
  paymentVerify: paymentVerifySchema,
  
  // Dealer
  dealerApplication: dealerApplicationSchema,
  dealerApproval: dealerApprovalSchema,
  
  // Test Ride
  testRideBooking: testRideBookingSchema,
  testRideUpdate: testRideUpdateSchema,
  
  // Lead
  leadCreate: leadCreateSchema,
  leadUpdate: leadUpdateSchema,
  
  // Contact
  contactInquiry: contactInquirySchema,
  
  // Warranty
  warrantyCreate: warrantyCreateSchema,
  warrantyClaim: warrantyClaimSchema,
}
