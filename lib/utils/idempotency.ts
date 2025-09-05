import crypto from 'crypto'

// Generate idempotency key from request data
export function generateIdempotencyKey(userId: string, data: any): string {
  const payload = {
    userId,
    ...data,
    // Remove timestamp fields that would make each request unique
    timestamp: undefined,
    created_at: undefined,
    updated_at: undefined
  }
  
  // Create a deterministic hash
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return hash
}

// Check if a request with this key was recently processed
export async function checkIdempotency(
  supabase: any,
  key: string,
  tableName: string = 'idempotency_keys'
): Promise<{ isDuplicate: boolean; existingResponse?: any }> {
  try {
    // Check if this key exists and was created recently (within 24 hours)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('key', key)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking idempotency:', error)
      return { isDuplicate: false }
    }
    
    if (data) {
      return {
        isDuplicate: true,
        existingResponse: data.response
      }
    }
    
    return { isDuplicate: false }
  } catch (error) {
    console.error('Idempotency check failed:', error)
    return { isDuplicate: false }
  }
}

// Store idempotency key with response
export async function storeIdempotencyKey(
  supabase: any,
  key: string,
  response: any,
  tableName: string = 'idempotency_keys'
): Promise<void> {
  try {
    const { error } = await supabase
      .from(tableName)
      .insert({
        key,
        response,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error storing idempotency key:', error)
    }
  } catch (error) {
    console.error('Failed to store idempotency key:', error)
  }
}

// Clean up old idempotency keys (run periodically)
export async function cleanupOldKeys(
  supabase: any,
  daysToKeep: number = 7,
  tableName: string = 'idempotency_keys'
): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .lt('created_at', cutoffDate)
    
    if (error) {
      console.error('Error cleaning up old keys:', error)
    }
  } catch (error) {
    console.error('Failed to cleanup old keys:', error)
  }
}
