import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  
  // Google Maps (Optional)
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Analytics (Optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_TEST_RIDES: z
    .string()
    .transform(s => s === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_DEALER_PORTAL: z
    .string()
    .transform(s => s === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_LIVE_CHAT: z
    .string()
    .transform(s => s === 'true')
    .default('false'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
  
  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  
  // Development Tools
  NEXT_PUBLIC_ENABLE_DEBUG: z
    .string()
    .transform(s => s === 'true')
    .default('false'),
  NEXT_PUBLIC_SHOW_EMAIL_PREVIEW: z
    .string()
    .transform(s => s === 'true')
    .default('true'),
})

// Type for environment variables
export type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      if (!env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY is not set in production')
      }
      if (!env.RAZORPAY_KEY_SECRET) {
        console.warn('⚠️  RAZORPAY_KEY_SECRET is not set in production')
      }
      if (env.NEXT_PUBLIC_ENABLE_DEBUG === true) {
        console.warn('⚠️  Debug mode is enabled in production')
      }
    }
    
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`)
      })
      
      // In development, show detailed error
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Environment validation failed:\n${JSON.stringify(error.errors, null, 2)}`)
      }
      
      // In production, exit the process
      process.exit(1)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Feature flags
export const features = {
  testRides: env.NEXT_PUBLIC_ENABLE_TEST_RIDES,
  dealerPortal: env.NEXT_PUBLIC_ENABLE_DEALER_PORTAL,
  liveChat: env.NEXT_PUBLIC_ENABLE_LIVE_CHAT,
  debug: env.NEXT_PUBLIC_ENABLE_DEBUG,
  emailPreview: env.NEXT_PUBLIC_SHOW_EMAIL_PREVIEW,
} as const

// Rate limiting configuration
export const rateLimiting = {
  window: env.RATE_LIMIT_WINDOW,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
} as const

// API URLs
export const apiUrls = {
  app: env.NEXT_PUBLIC_APP_URL,
  supabase: env.NEXT_PUBLIC_SUPABASE_URL,
} as const
