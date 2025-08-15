import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/notifications/[id] - Mark notification as read/unread
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

    const body = await request.json()
    const { read } = body

    if (typeof read !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid read value. Must be boolean.' 
      }, { status: 400 })
    }

    // Update notification (only if it belongs to the user)
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ 
        read,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Notification updated successfully',
      notification 
    })

  } catch (error) {
    console.error('Error in update notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete notification
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

    // Delete notification (only if it belongs to the user)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own notifications

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Notification deleted successfully' })

  } catch (error) {
    console.error('Error in delete notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
