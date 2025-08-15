import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTestRideStatus, getTestRideById } from '@/lib/api/test-rides'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PUT /api/test-rides/[id]/status - Update test ride status
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    
    const resolvedParams = await params
    const testRideId = resolvedParams.id
    
    // Parse request body
    const body = await request.json()
    const { status } = body
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }
    
    // Get test ride to check permissions
    const testRide = await getTestRideById(testRideId)
    
    if (!testRide) {
      return NextResponse.json(
        { error: 'Test ride not found' },
        { status: 404 }
      )
    }
    
    // Check permissions
    // User can only cancel their own test rides
    // Admin and dealers can update any status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin'
    const isDealer = profile?.role === 'dealer'
    const isOwner = testRide.user_id === user.id
    
    if (status === 'cancelled') {
      // Only owner, admin, or dealer can cancel
      if (!isOwner && !isAdmin && !isDealer) {
        return NextResponse.json(
          { error: 'Unauthorized to cancel this test ride' },
          { status: 403 }
        )
      }
    } else {
      // Only admin or dealer can change to other statuses
      if (!isAdmin && !isDealer) {
        return NextResponse.json(
          { error: 'Unauthorized to update test ride status' },
          { status: 403 }
        )
      }
    }
    
    // Update the status
    const updatedTestRide = await updateTestRideStatus(testRideId, status)
    
    return NextResponse.json(updatedTestRide)
    
  } catch (error: any) {
    console.error('Error updating test ride status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update test ride status' },
      { status: 500 }
    )
  }
}
