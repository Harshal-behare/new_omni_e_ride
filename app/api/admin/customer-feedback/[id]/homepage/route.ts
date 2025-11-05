import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PUT toggle homepage display (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role using admin client
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { display_on_homepage } = body

    if (typeof display_on_homepage !== 'boolean') {
      return NextResponse.json({ error: 'Invalid display_on_homepage value' }, { status: 400 })
    }

    // Update homepage display setting using admin client
    const { data: updatedFeedback, error } = await adminClient
      .from('customer_feedback')
      .update({ display_on_homepage })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating homepage display:', error)
      return NextResponse.json({ error: 'Failed to update homepage display', details: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedFeedback)
  } catch (error: any) {
    console.error('Error in PUT /api/admin/customer-feedback/[id]/homepage:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
