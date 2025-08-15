import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // order, test_ride, dealer, system
    const read = searchParams.get('read') // true, false, or null for all
    const priority = searchParams.get('priority') // low, medium, high, urgent

    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        priority,
        read,
        data,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (read !== null) {
      query = query.eq('read', read === 'true')
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: notifications, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      unreadCount: unreadCount || 0
    })

  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create notification (admin/system use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (only admins can create notifications manually)
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
      user_id, 
      users, // Array of user IDs for bulk notifications
      title, 
      message, 
      type = 'system', 
      priority = 'medium',
      data = {} 
    } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message' 
      }, { status: 400 })
    }

    let notifications = []

    if (users && Array.isArray(users)) {
      // Bulk notification creation
      notifications = users.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        priority,
        data,
        read: false,
        created_at: new Date().toISOString()
      }))
    } else if (user_id) {
      // Single notification
      notifications = [{
        user_id,
        title,
        message,
        type,
        priority,
        data,
        read: false,
        created_at: new Date().toISOString()
      }]
    } else {
      return NextResponse.json({ 
        error: 'Either user_id or users array is required' 
      }, { status: 400 })
    }

    const { data: createdNotifications, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Error creating notifications:', error)
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Notifications created successfully',
      notifications: createdNotifications,
      count: createdNotifications.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
