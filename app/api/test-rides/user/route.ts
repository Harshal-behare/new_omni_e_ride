import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTestRides } from '@/lib/api/test-rides'

// GET /api/test-rides/user - Get authenticated user's test ride history
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
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    
    // Get user's test rides
    let testRides = await getUserTestRides(user.id)
    
    // Apply filters if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
      if (validStatuses.includes(status)) {
        testRides = testRides.filter(ride => ride.status === status)
      }
    }
    
    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum) && limitNum > 0) {
        testRides = testRides.slice(0, limitNum)
      }
    }
    
    // Add summary statistics
    const statistics = {
      total: testRides.length,
      pending: testRides.filter(r => r.status === 'pending').length,
      confirmed: testRides.filter(r => r.status === 'confirmed').length,
      completed: testRides.filter(r => r.status === 'completed').length,
      cancelled: testRides.filter(r => r.status === 'cancelled').length,
    }
    
    return NextResponse.json({
      testRides,
      statistics
    })
    
  } catch (error: any) {
    console.error('Error fetching user test rides:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch test ride history' },
      { status: 500 }
    )
  }
}
