import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/analytics/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d' // 7d, 30d, 90d, 1y
    const dealerId = searchParams.get('dealerId') // For dealer-specific analytics

    // Calculate date range
    const now = new Date()
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30

    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

    // Build analytics queries
    const analytics = await Promise.all([
      // Total users
      getUserMetrics(supabase, startDate, dealerId),
      
      // Orders metrics
      getOrderMetrics(supabase, startDate, dealerId),
      
      // Test rides metrics
      getTestRideMetrics(supabase, startDate, dealerId),
      
      // Vehicle metrics
      getVehicleMetrics(supabase, startDate, dealerId),
      
      // Revenue metrics
      getRevenueMetrics(supabase, startDate, dealerId),
      
      // Lead metrics
      getLeadMetrics(supabase, startDate, dealerId)
    ])

    const [
      userMetrics,
      orderMetrics,
      testRideMetrics,
      vehicleMetrics,
      revenueMetrics,
      leadMetrics
    ] = analytics

    return NextResponse.json({
      timeRange,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      metrics: {
        users: userMetrics,
        orders: orderMetrics,
        testRides: testRideMetrics,
        vehicles: vehicleMetrics,
        revenue: revenueMetrics,
        leads: leadMetrics
      }
    })

  } catch (error) {
    console.error('Error in dashboard analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase.from('profiles').select('id, created_at, role')
    
    if (dealerId) {
      // For dealer-specific metrics, get users who interacted with this dealer
      query = query.eq('dealer_id', dealerId)
    }

    const { data: allUsers } = await query
    const { data: newUsers } = await query.gte('created_at', startDate.toISOString())

    return {
      total: allUsers?.length || 0,
      new: newUsers?.length || 0,
      byRole: allUsers?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }
  } catch (error) {
    console.error('Error getting user metrics:', error)
    return { total: 0, new: 0, byRole: {} }
  }
}

async function getOrderMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase.from('orders').select('id, created_at, status, total_amount, dealer_id')
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: allOrders } = await query
    const { data: newOrders } = await query.gte('created_at', startDate.toISOString())

    const completedOrders = allOrders?.filter(o => o.status === 'completed') || []
    const pendingOrders = allOrders?.filter(o => ['pending', 'processing'].includes(o.status)) || []

    return {
      total: allOrders?.length || 0,
      new: newOrders?.length || 0,
      completed: completedOrders.length,
      pending: pendingOrders.length,
      totalValue: allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      byStatus: allOrders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }
  } catch (error) {
    console.error('Error getting order metrics:', error)
    return { total: 0, new: 0, completed: 0, pending: 0, totalValue: 0, byStatus: {} }
  }
}

async function getTestRideMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase.from('test_rides').select('id, created_at, status, dealer_id')
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: allTestRides } = await query
    const { data: newTestRides } = await query.gte('created_at', startDate.toISOString())

    const completedRides = allTestRides?.filter(r => r.status === 'completed') || []
    const scheduledRides = allTestRides?.filter(r => r.status === 'scheduled') || []

    return {
      total: allTestRides?.length || 0,
      new: newTestRides?.length || 0,
      completed: completedRides.length,
      scheduled: scheduledRides.length,
      byStatus: allTestRides?.reduce((acc, ride) => {
        acc[ride.status] = (acc[ride.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }
  } catch (error) {
    console.error('Error getting test ride metrics:', error)
    return { total: 0, new: 0, completed: 0, scheduled: 0, byStatus: {} }
  }
}

async function getVehicleMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase.from('vehicles').select('id, model, status, price')
    
    // Vehicle metrics are usually global unless dealer has specific inventory
    const { data: allVehicles } = await query

    return {
      total: allVehicles?.length || 0,
      available: allVehicles?.filter(v => v.status === 'available').length || 0,
      sold: allVehicles?.filter(v => v.status === 'sold').length || 0,
      byModel: allVehicles?.reduce((acc, vehicle) => {
        acc[vehicle.model] = (acc[vehicle.model] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      averagePrice: allVehicles?.length ? 
        allVehicles.reduce((sum, v) => sum + (v.price || 0), 0) / allVehicles.length : 0
    }
  } catch (error) {
    console.error('Error getting vehicle metrics:', error)
    return { total: 0, available: 0, sold: 0, byModel: {}, averagePrice: 0 }
  }
}

async function getRevenueMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase
      .from('orders')
      .select('total_amount, created_at, status, dealer_id')
      .eq('status', 'completed')
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: allRevenue } = await query
    const { data: periodRevenue } = await query.gte('created_at', startDate.toISOString())

    const total = allRevenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const period = periodRevenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    return {
      total,
      period,
      orders: allRevenue?.length || 0,
      averageOrderValue: allRevenue?.length ? total / allRevenue.length : 0
    }
  } catch (error) {
    console.error('Error getting revenue metrics:', error)
    return { total: 0, period: 0, orders: 0, averageOrderValue: 0 }
  }
}

async function getLeadMetrics(supabase: any, startDate: Date, dealerId?: string | null) {
  try {
    let query = supabase.from('leads').select('id, created_at, status, source, dealer_id')
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: allLeads } = await query
    const { data: newLeads } = await query.gte('created_at', startDate.toISOString())

    return {
      total: allLeads?.length || 0,
      new: newLeads?.length || 0,
      converted: allLeads?.filter(l => l.status === 'converted').length || 0,
      bySource: allLeads?.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      byStatus: allLeads?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }
  } catch (error) {
    console.error('Error getting lead metrics:', error)
    return { total: 0, new: 0, converted: 0, bySource: {}, byStatus: {} }
  }
}
