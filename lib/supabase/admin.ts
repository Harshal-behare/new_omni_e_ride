import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role privileges
 * This bypasses Row Level Security (RLS) for admin operations
 * IMPORTANT: Only use this in secure server-side API routes
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Verify if a user has admin role
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error checking admin role:', error)
    return false
  }

  return profile?.role === 'admin'
}
