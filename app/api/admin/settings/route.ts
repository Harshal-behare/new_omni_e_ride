import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/settings - Get system settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // general, payment, email, features, etc.

    let query = supabase
      .from('system_settings')
      .select(`
        id,
        key,
        value,
        category,
        type,
        description,
        is_public,
        updated_at,
        updated_by
      `)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: settings, error } = await query.order('category', { ascending: true })

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Group settings by category
    const groupedSettings = settings?.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, any[]>) || {}

    return NextResponse.json({
      settings: groupedSettings,
      categories: Object.keys(groupedSettings)
    })

  } catch (error) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ 
        error: 'Settings array is required' 
      }, { status: 400 })
    }

    // Update settings one by one
    const updatePromises = settings.map(async (setting: any) => {
      const { key, value } = setting
      
      if (!key || value === undefined) {
        throw new Error(`Invalid setting: key and value are required`)
      }

      return supabase
        .from('system_settings')
        .update({
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('key', key)
        .select()
        .single()
    })

    const results = await Promise.allSettled(updatePromises)
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected')

    if (failed.length > 0) {
      console.error('Some settings failed to update:', failed)
      return NextResponse.json({ 
        error: 'Some settings failed to update',
        successful,
        failed: failed.length
      }, { status: 207 }) // Multi-status
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      updated: successful
    })

  } catch (error) {
    console.error('Error in update settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings - Create new setting
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
    const { key, value, category, type = 'string', description, is_public = false } = body

    // Validate required fields
    if (!key || value === undefined || !category) {
      return NextResponse.json({ 
        error: 'Missing required fields: key, value, category' 
      }, { status: 400 })
    }

    // Check if setting already exists
    const { data: existingSetting } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', key)
      .single()

    if (existingSetting) {
      return NextResponse.json({ 
        error: 'Setting with this key already exists' 
      }, { status: 409 })
    }

    const { data: newSetting, error } = await supabase
      .from('system_settings')
      .insert({
        key,
        value: JSON.stringify(value),
        category,
        type,
        description,
        is_public,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating setting:', error)
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Setting created successfully',
      setting: newSetting 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create setting API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
