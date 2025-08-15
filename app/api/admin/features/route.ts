import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/features - Get feature flags
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled') // true, false, or null for all
    const environment = searchParams.get('environment') || 'production'

    let query = supabase
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
      .eq('environment', environment)

    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true')
    }

    const { data: features, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 })
    }

    // Get usage statistics if available
    const usage = await getFeatureUsageStats(supabase, features?.map(f => f.key) || [])

    return NextResponse.json({
      features: features?.map(feature => ({
        ...feature,
        usage: usage[feature.key] || { total_requests: 0, unique_users: 0 }
      })) || [],
      environment
    })

  } catch (error) {
    console.error('Error in feature flags API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/features - Create new feature flag
export async function POST(request: NextRequest) {
  try {
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
      key, 
      description, 
      enabled = false, 
      environment = 'production',
      rollout_percentage = 0,
      user_groups = [],
      config = {}
    } = body

    // Validate required fields
    if (!name || !key) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, key' 
      }, { status: 400 })
    }

    // Check if feature flag already exists
    const { data: existingFeature } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('key', key)
      .eq('environment', environment)
      .single()

    if (existingFeature) {
      return NextResponse.json({ 
        error: 'Feature flag with this key already exists in this environment' 
      }, { status: 409 })
    }

    const { data: newFeature, error } = await supabase
      .from('feature_flags')
      .insert({
        name,
        key,
        description,
        enabled,
        environment,
        rollout_percentage,
        user_groups,
        config,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feature flag:', error)
      return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Feature flag created successfully',
      feature: newFeature 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create feature flag API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getFeatureUsageStats(supabase: any, featureKeys: string[]) {
  if (featureKeys.length === 0) return {}

  try {
    // This would typically come from analytics/telemetry data
    // For now, return mock data structure
    const usage: Record<string, any> = {}
    
    featureKeys.forEach(key => {
      usage[key] = {
        total_requests: Math.floor(Math.random() * 1000),
        unique_users: Math.floor(Math.random() * 100),
        last_used: new Date().toISOString()
      }
    })

    return usage
  } catch (error) {
    console.error('Error fetching feature usage stats:', error)
    return {}
  }
}
