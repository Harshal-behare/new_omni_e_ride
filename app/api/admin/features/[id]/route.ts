import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/features/[id] - Get feature flag by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: feature, error } = await supabase
      .from('feature_flags')
      .select(`
        id,
        name,
        key,
        description,
        enabled,
        environment,
        rollout_percentage,
        user_groups,
        config,
        created_at,
        updated_at,
        updated_by
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching feature flag:', error)
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    return NextResponse.json({ feature })

  } catch (error) {
    console.error('Error in get feature flag API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/features/[id] - Update feature flag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      enabled, 
      rollout_percentage,
      user_groups,
      config 
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (enabled !== undefined) updateData.enabled = enabled
    if (rollout_percentage !== undefined) updateData.rollout_percentage = rollout_percentage
    if (user_groups !== undefined) updateData.user_groups = user_groups
    if (config !== undefined) updateData.config = config

    const { data: updatedFeature, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating feature flag:', error)
      return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Feature flag updated successfully',
      feature: updatedFeature 
    })

  } catch (error) {
    console.error('Error in update feature flag API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/features/[id] - Delete feature flag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feature flag:', error)
      return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Feature flag deleted successfully' })

  } catch (error) {
    console.error('Error in delete feature flag API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
