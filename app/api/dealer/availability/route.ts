import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// For storing dealer availability, we'll need to create a new table
// For now, we'll use a simple in-memory approach or store in dealer metadata

interface DealerAvailability {
  workingHours: {
    [day: string]: {
      isOpen: boolean
      openTime: string
      closeTime: string
      slots: number // Number of test rides per slot
    }
  }
  holidays: string[] // Array of dates in YYYY-MM-DD format
  slotDuration: number // Duration in minutes
}

// GET /api/dealer/availability - Get dealer availability settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get dealer record
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id, metadata')
      .eq('user_id', user.id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Default availability settings
    const defaultAvailability: DealerAvailability = {
      workingHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00', slots: 2 },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00', slots: 0 }
      },
      holidays: [],
      slotDuration: 30
    }
    
    // Get availability from dealer metadata or use default
    const availability = dealer.metadata?.availability || defaultAvailability
    
    return NextResponse.json(availability)
    
  } catch (error: any) {
    console.error('Error fetching dealer availability:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// PUT /api/dealer/availability - Update dealer availability settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get dealer record
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id, metadata')
      .eq('user_id', user.id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { workingHours, holidays, slotDuration } = body
    
    // Validate input
    if (!workingHours || typeof slotDuration !== 'number') {
      return NextResponse.json(
        { error: 'Invalid availability data' },
        { status: 400 }
      )
    }
    
    // Update dealer metadata with availability
    const updatedMetadata = {
      ...(dealer.metadata || {}),
      availability: {
        workingHours,
        holidays: holidays || [],
        slotDuration
      }
    }
    
    const { data: updatedDealer, error: updateError } = await supabase
      .from('dealers')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealer.id)
      .select()
      .single()
    
    if (updateError) {
      throw updateError
    }
    
    return NextResponse.json({
      message: 'Availability updated successfully',
      availability: updatedMetadata.availability
    })
    
  } catch (error: any) {
    console.error('Error updating dealer availability:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update availability' },
      { status: 500 }
    )
  }
}

// POST /api/dealer/availability/check - Check available slots for a specific date
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    const { dealerId, date } = body
    
    if (!dealerId || !date) {
      return NextResponse.json(
        { error: 'Dealer ID and date are required' },
        { status: 400 }
      )
    }
    
    // Get dealer availability settings
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id, metadata')
      .eq('id', dealerId)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    const availability = dealer.metadata?.availability || {
      workingHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00', slots: 2 },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00', slots: 0 }
      },
      holidays: [],
      slotDuration: 30
    }
    
    // Check if date is a holiday
    if (availability.holidays.includes(date)) {
      return NextResponse.json({
        available: false,
        reason: 'Holiday',
        slots: []
      })
    }
    
    // Get day of week
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const daySettings = availability.workingHours[dayOfWeek]
    
    if (!daySettings?.isOpen) {
      return NextResponse.json({
        available: false,
        reason: 'Closed',
        slots: []
      })
    }
    
    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('test_rides')
      .select('confirmed_time, preferred_time')
      .eq('dealer_id', dealerId)
      .eq('preferred_date', date)
      .in('status', ['pending', 'confirmed'])
    
    // Generate available time slots
    const slots = []
    const openTime = new Date(`${date}T${daySettings.openTime}`)
    const closeTime = new Date(`${date}T${daySettings.closeTime}`)
    const slotDuration = availability.slotDuration || 30
    
    for (let time = new Date(openTime); time < closeTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const timeString = time.toTimeString().slice(0, 5)
      
      // Count bookings for this time slot
      const bookingsAtTime = existingBookings?.filter(booking => 
        booking.confirmed_time === timeString || booking.preferred_time === timeString
      ).length || 0
      
      if (bookingsAtTime < daySettings.slots) {
        slots.push({
          time: timeString,
          available: daySettings.slots - bookingsAtTime,
          total: daySettings.slots
        })
      }
    }
    
    return NextResponse.json({
      available: slots.length > 0,
      date,
      dayOfWeek,
      slots
    })
    
  } catch (error: any) {
    console.error('Error checking dealer availability:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check availability' },
      { status: 500 }
    )
  }
}
