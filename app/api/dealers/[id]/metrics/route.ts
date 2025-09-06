import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDealerMetrics, updateDealerMetrics } from '@/lib/api/dealers-metrics'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permissions (dealer can view own metrics, admin can view all)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    if (profile.role === 'dealer' && id !== user.id) {
      return NextResponse.json(
        { error: 'You can only view your own metrics' },
        { status: 403 }
      )
    }
    
    if (profile.role !== 'dealer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    
    // Get metrics
    const metrics = await getDealerMetrics(id, year, month)
    
    return NextResponse.json(
      { data: metrics },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error fetching dealer metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only admins can update metrics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update metrics' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    // Update metrics
    const metrics = await updateDealerMetrics(id, body)
    
    return NextResponse.json(
      {
        message: 'Metrics updated successfully',
        data: metrics
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error updating dealer metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update metrics' },
      { status: 500 }
    )
  }
}
