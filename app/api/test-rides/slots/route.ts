import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/api/test-rides'

// GET /api/test-rides/slots - Get available time slots for a specific date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const dealerId = searchParams.get('dealer_id')
    
    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    
    // Check if date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return NextResponse.json(
        { error: 'Cannot book test rides for past dates' },
        { status: 400 }
      )
    }
    
    // Get available slots
    const slots = await getAvailableSlots(date, dealerId || undefined)
    
    return NextResponse.json(slots)
    
  } catch (error: any) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}
