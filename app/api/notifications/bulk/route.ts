import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/notifications/bulk - Bulk actions on notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notification_ids } = body

    if (!action || !notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, notification_ids (array)' 
      }, { status: 400 })
    }

    let result
    switch (action) {
      case 'mark_read':
        result = await supabase
          .from('notifications')
          .update({ 
            read: true,
            updated_at: new Date().toISOString()
          })
          .in('id', notification_ids)
          .eq('user_id', user.id)
        break

      case 'mark_unread':
        result = await supabase
          .from('notifications')
          .update({ 
            read: false,
            updated_at: new Date().toISOString()
          })
          .in('id', notification_ids)
          .eq('user_id', user.id)
        break

      case 'delete':
        result = await supabase
          .from('notifications')
          .delete()
          .in('id', notification_ids)
          .eq('user_id', user.id)
        break

      case 'mark_all_read':
        // Mark all notifications as read for the user
        result = await supabase
          .from('notifications')
          .update({ 
            read: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('read', false)
        break

      case 'delete_all_read':
        // Delete all read notifications for the user
        result = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .eq('read', true)
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported: mark_read, mark_unread, delete, mark_all_read, delete_all_read' 
        }, { status: 400 })
    }

    if (result.error) {
      console.error('Error performing bulk action:', result.error)
      return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Bulk action '${action}' completed successfully`,
      affected: result.count || 0
    })

  } catch (error) {
    console.error('Error in bulk notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
