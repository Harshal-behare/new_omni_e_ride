import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderAnalytics } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check user role - only admins can access analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Get filter parameters
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const dealerId = searchParams.get('dealer_id')
    
    // Build base query
    let query = supabase.from('orders').select('*')
    
    // Apply filters
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      query = query.lte('created_at', toDate)
    }
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }
    
    const { data: orders, error } = await query
    
    if (error) {
      console.error('Error fetching orders for analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }
    
    // Initialize analytics object
    const analytics: OrderAnalytics = {
      total_orders: orders?.length || 0,
      total_revenue: 0,
      average_order_value: 0,
      orders_by_status: {},
      orders_by_month: [],
      top_selling_vehicles: [],
      revenue_by_dealer: []
    }
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(analytics)
    }
    
    // Calculate total revenue (only paid orders)
    const paidOrders = orders.filter(o => o.payment_status === 'paid')
    analytics.total_revenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0)
    analytics.average_order_value = paidOrders.length > 0 
      ? analytics.total_revenue / paidOrders.length 
      : 0
    
    // Orders by status
    orders.forEach(order => {
      analytics.orders_by_status[order.status] = (analytics.orders_by_status[order.status] || 0) + 1
    })
    
    // Orders by month
    const monthlyData: Record<string, { count: number; revenue: number }> = {}
    orders.forEach(order => {
      const month = new Date(order.created_at).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, revenue: 0 }
      }
      monthlyData[month].count++
      if (order.payment_status === 'paid') {
        monthlyData[month].revenue += order.total_amount
      }
    })
    
    analytics.orders_by_month = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // Top selling vehicles
    const vehicleSales: Record<string, { count: number; revenue: number }> = {}
    for (const order of paidOrders) {
      if (!vehicleSales[order.vehicle_id]) {
        vehicleSales[order.vehicle_id] = { count: 0, revenue: 0 }
      }
      vehicleSales[order.vehicle_id].count += order.quantity
      vehicleSales[order.vehicle_id].revenue += order.total_amount
    }
    
    // Get vehicle names
    const vehicleIds = Object.keys(vehicleSales)
    if (vehicleIds.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, name')
        .in('id', vehicleIds)
      
      const vehicleMap = new Map(vehicles?.map(v => [v.id, v.name]) || [])
      
      analytics.top_selling_vehicles = Object.entries(vehicleSales)
        .map(([vehicle_id, data]) => ({
          vehicle_id,
          name: vehicleMap.get(vehicle_id) || 'Unknown',
          ...data
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10
    }
    
    // Revenue by dealer
    const dealerRevenue: Record<string, number> = {}
    paidOrders.forEach(order => {
      if (order.dealer_id) {
        dealerRevenue[order.dealer_id] = (dealerRevenue[order.dealer_id] || 0) + order.total_amount
      }
    })
    
    const dealerIds = Object.keys(dealerRevenue)
    if (dealerIds.length > 0) {
      const { data: dealers } = await supabase
        .from('dealers')
        .select('id, name')
        .in('id', dealerIds)
      
      const dealerMap = new Map(dealers?.map(d => [d.id, d.name]) || [])
      
      analytics.revenue_by_dealer = Object.entries(dealerRevenue)
        .map(([dealer_id, revenue]) => ({
          dealer_id,
          name: dealerMap.get(dealer_id) || 'Unknown',
          revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
    }
    
    // Add summary statistics
    const summary = {
      conversion_rate: analytics.total_orders > 0 
        ? (paidOrders.length / analytics.total_orders) * 100 
        : 0,
      cancellation_rate: analytics.total_orders > 0
        ? ((analytics.orders_by_status['cancelled'] || 0) / analytics.total_orders) * 100
        : 0,
      pending_orders: analytics.orders_by_status['pending'] || 0,
      processing_orders: (analytics.orders_by_status['confirmed'] || 0) + 
                        (analytics.orders_by_status['processing'] || 0) +
                        (analytics.orders_by_status['shipped'] || 0),
      completed_orders: analytics.orders_by_status['delivered'] || 0,
      total_vehicles_sold: paidOrders.reduce((sum, order) => sum + order.quantity, 0)
    }
    
    return NextResponse.json({
      analytics,
      summary,
      filters: {
        from_date: fromDate,
        to_date: toDate,
        dealer_id: dealerId
      }
    })
  } catch (error) {
    console.error('Error in GET /api/orders/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
