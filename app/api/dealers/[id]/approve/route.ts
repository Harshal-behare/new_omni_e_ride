import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveDealerApplication } from '@/lib/api/dealers'

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
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve dealer applications' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { approved, reason } = body
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approval status is required' },
        { status: 400 }
      )
    }
    
    if (!approved && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an application' },
        { status: 400 }
      )
    }
    
    // Approve or reject the application
    const application = await approveDealerApplication(id, approved, reason)
    
    return NextResponse.json(
      {
        message: approved ? 'Application approved successfully' : 'Application rejected',
        application
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error processing dealer application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process application' },
      { status: 500 }
    )
  }
}
