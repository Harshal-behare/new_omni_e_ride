import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DELETE customer feedback by ID (admin only)
export async function DELETE(
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

    // Delete feedback using admin client
    const { error } = await adminClient
      .from('customer_feedback')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feedback:', error)
      return NextResponse.json({ error: 'Failed to delete feedback', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/customer-feedback/[id]:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
