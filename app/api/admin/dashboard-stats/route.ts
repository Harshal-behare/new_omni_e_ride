import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/dashboard-stats - Get admin dashboard statistics
export async function GET() {
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

    // Fetch statistics in parallel
    const [
      { count: totalUsers },
      { count: activeDealers },
      { count: totalVehicles }
    ] = await Promise.all([
      // Total users count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      
      // Active dealers count (approved dealers)
      supabase
        .from('dealers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),
      
      // Total vehicles/models count
      supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeDealers: activeDealers || 0,
      totalVehicles: totalVehicles || 0
    })

  } catch (error) {
    console.error('Error in dashboard stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
