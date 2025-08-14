import { createClient } from '@/lib/supabase/server'
import { TestRide, TestRideInsert, TestRideUpdate } from '@/lib/database.types'
import { getRazorpayInstance, formatAmountForRazorpay, CURRENCY, TEST_RIDE_DEPOSIT } from '@/lib/razorpay/client'

// Types for API responses
export interface TestRideWithDetails extends TestRide {
  vehicle?: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
  }
  dealer?: {
    id: string
    business_name: string
    business_address: string
    city: string
    business_phone: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface AvailableSlot {
  date: string
  time: string
  available: boolean
}

export interface CreateTestRideData {
  vehicle_id: string
  dealer_id?: string
  preferred_date: string
  preferred_time: string
  name: string
  email: string
  phone: string
  city: string
  address?: string
  notes?: string
}

// Get all test rides for a user
export async function getUserTestRides(userId: string): Promise<TestRideWithDetails[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('test_rides')
    .select(`
      *,
      vehicle:vehicles(id, name, slug, price, images),
      dealer:dealers(id, business_name, business_address, city, business_phone)
    `)
    .eq('user_id', userId)
    .order('preferred_date', { ascending: false })
    .order('preferred_time', { ascending: false })

  if (error) {
    console.error('Error fetching user test rides:', error)
    throw new Error('Failed to fetch test rides')
  }

  return data as TestRideWithDetails[]
}

// Get a single test ride by ID
export async function getTestRideById(id: string): Promise<TestRideWithDetails | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('test_rides')
    .select(`
      *,
      vehicle:vehicles(id, name, slug, price, images),
      dealer:dealers(id, business_name, business_address, city, business_phone),
      user:profiles(id, name, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching test ride:', error)
    return null
  }

  return data as TestRideWithDetails
}

// Create a new test ride booking
export async function createTestRide(userId: string, data: CreateTestRideData): Promise<TestRide> {
  const supabase = await createClient()
  
  // Create test ride record
  const testRideData: any = {
    user_id: userId,
    vehicle_id: data.vehicle_id,
    dealer_id: data.dealer_id || null,
    preferred_date: data.preferred_date,
    preferred_time: data.preferred_time,
    name: data.name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    address: data.address || null,
    status: 'pending',
    notes: data.notes || null,
  }
  
  const { data: testRide, error } = await supabase
    .from('test_rides')
    .insert(testRideData)
    .select()
    .single()

  if (error) {
    console.error('Error creating test ride:', error)
    throw new Error('Failed to create test ride booking')
  }

  return testRide
}

// Update test ride status
export async function updateTestRideStatus(
  id: string, 
  status: TestRide['status'],
  additionalData?: Partial<TestRideUpdate>
): Promise<TestRide> {
  const supabase = await createClient()
  
  const updateData: TestRideUpdate = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  }
  
  const { data, error } = await supabase
    .from('test_rides')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating test ride status:', error)
    throw new Error('Failed to update test ride status')
  }

  return data
}

// Update test ride to confirmed after verification
export async function confirmTestRide(id: string): Promise<TestRide> {
  return updateTestRideStatus(id, 'confirmed')
}

// Get available time slots for a specific date and dealer
export async function getAvailableSlots(
  date: string,
  dealerId?: string
): Promise<AvailableSlot[]> {
  const supabase = await createClient()
  
  // Define available time slots (9 AM to 6 PM, hourly slots)
  const allSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ]
  
  // Get booked slots for the date
  let query = supabase
    .from('test_rides')
    .select('preferred_time')
    .eq('preferred_date', date)
    .in('status', ['pending', 'confirmed'])
  
  if (dealerId) {
    query = query.eq('dealer_id', dealerId)
  }
  
  const { data: bookedSlots, error } = await query
  
  if (error) {
    console.error('Error fetching booked slots:', error)
    return allSlots.map(time => ({ date, time, available: true }))
  }
  
  const bookedTimes = new Set(bookedSlots?.map(slot => slot.preferred_time) || [])
  
  // Mark slots as available or unavailable
  return allSlots.map(time => ({
    date,
    time,
    available: !bookedTimes.has(time)
  }))
}

// Cancel a test ride
export async function cancelTestRide(id: string, userId: string): Promise<TestRide> {
  const supabase = await createClient()
  
  // First check if the test ride belongs to the user
  const { data: testRide, error: fetchError } = await supabase
    .from('test_rides')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  
  if (fetchError || !testRide) {
    throw new Error('Test ride not found or unauthorized')
  }
  
  // Check if cancellation is allowed (e.g., at least 24 hours before)
  const scheduledDateTime = new Date(`${testRide.preferred_date}T${testRide.preferred_time}`)
  const now = new Date()
  const hoursUntilRide = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursUntilRide < 24) {
    throw new Error('Cannot cancel test ride less than 24 hours before scheduled time')
  }
  
  // Update status to cancelled
  const { data, error } = await supabase
    .from('test_rides')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error cancelling test ride:', error)
    throw new Error('Failed to cancel test ride')
  }
  
  // TODO: Send cancellation notification email
  
  return data
}

// Get test rides for admin/dealer view
export async function getAllTestRides(
  filters?: {
    status?: TestRide['status']
    dealer_id?: string
    from_date?: string
    to_date?: string
  }
): Promise<TestRideWithDetails[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('test_rides')
    .select(`
      *,
      vehicle:vehicles(id, name, slug, price, images),
      dealer:dealers(id, business_name, business_address, city, business_phone),
      user:profiles(id, name, email)
    `)
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.dealer_id) {
    query = query.eq('dealer_id', filters.dealer_id)
  }
  
  if (filters?.from_date) {
    query = query.gte('preferred_date', filters.from_date)
  }
  
  if (filters?.to_date) {
    query = query.lte('preferred_date', filters.to_date)
  }
  
  const { data, error } = await query
    .order('preferred_date', { ascending: true })
    .order('preferred_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching all test rides:', error)
    throw new Error('Failed to fetch test rides')
  }
  
  return data as TestRideWithDetails[]
}

// Complete a test ride (mark as completed)
export async function completeTestRide(id: string): Promise<TestRide> {
  return updateTestRideStatus(id, 'completed')
}

// Reschedule a test ride
export async function rescheduleTestRide(
  id: string,
  newDate: string,
  newTime: string
): Promise<TestRide> {
  const supabase = await createClient()
  
  // Check if the new slot is available
  const slots = await getAvailableSlots(newDate)
  const slotAvailable = slots.find(s => s.time === newTime && s.available)
  
  if (!slotAvailable) {
    throw new Error('Selected time slot is not available')
  }
  
  const { data, error } = await supabase
    .from('test_rides')
    .update({
      preferred_date: newDate,
      preferred_time: newTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error rescheduling test ride:', error)
    throw new Error('Failed to reschedule test ride')
  }
  
  return data
}
