import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/analytics/sales - Get sales analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
    const timeRange = searchParams.get('timeRange') || '30d'
    const dealerId = searchParams.get('dealerId')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

    // Calculate date range
    const now = new Date()
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30

    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

    // Get sales data
    let query = supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        dealer_id,
        vehicle_id,
        customer_id,
        vehicles(model, variant, price),
        profiles!customer_id(full_name, city, state)
      `)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: salesData, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching sales data:', error)
      return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
    }

    // Group sales by time period
    const groupedSales = groupSalesByPeriod(salesData || [], groupBy)
    
    // Calculate metrics
    const metrics = calculateSalesMetrics(salesData || [])
    
    // Get top performing data
    const topPerformers = getTopPerformers(salesData || [])

    return NextResponse.json({
      timeRange,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      metrics,
      timeSeries: groupedSales,
      topPerformers
    })

  } catch (error) {
    console.error('Error in sales analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function groupSalesByPeriod(sales: any[], groupBy: string) {
  const grouped = sales.reduce((acc, sale) => {
    const date = new Date(sale.created_at)
    let key: string

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = {
        period: key,
        sales: 0,
        revenue: 0,
        orders: 0
      }
    }

    acc[key].sales += 1
    acc[key].revenue += sale.total_amount || 0
    acc[key].orders += 1

    return acc
  }, {} as Record<string, any>)

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period))
}

function calculateSalesMetrics(sales: any[]) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
  const totalOrders = sales.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate conversion metrics (assuming we have lead data)
  const uniqueCustomers = new Set(sales.map(sale => sale.customer_id)).size

  // Group by status for funnel analysis
  const salesByStatus = sales.reduce((acc, sale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Revenue trends (comparing periods)
  const currentPeriodRevenue = totalRevenue
  const averageDailyRevenue = sales.length > 0 ? totalRevenue / getDaysBetweenDates(sales) : 0

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    uniqueCustomers,
    averageDailyRevenue,
    salesByStatus,
    growth: {
      revenue: 0, // Would need previous period data to calculate
      orders: 0
    }
  }
}

function getTopPerformers(sales: any[]) {
  // Top vehicles by sales
  const vehicleSales = sales.reduce((acc, sale) => {
    const model = sale.vehicles?.model || 'Unknown'
    if (!acc[model]) {
      acc[model] = { model, sales: 0, revenue: 0 }
    }
    acc[model].sales += 1
    acc[model].revenue += sale.total_amount || 0
    return acc
  }, {} as Record<string, any>)

  const topVehicles = Object.values(vehicleSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  // Top regions by sales
  const regionSales = sales.reduce((acc, sale) => {
    const region = sale.profiles?.state || 'Unknown'
    if (!acc[region]) {
      acc[region] = { region, sales: 0, revenue: 0 }
    }
    acc[region].sales += 1
    acc[region].revenue += sale.total_amount || 0
    return acc
  }, {} as Record<string, any>)

  const topRegions = Object.values(regionSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  // Top dealers by sales (if admin viewing)
  const dealerSales = sales.reduce((acc, sale) => {
    const dealerId = sale.dealer_id || 'Direct'
    if (!acc[dealerId]) {
      acc[dealerId] = { dealerId, sales: 0, revenue: 0 }
    }
    acc[dealerId].sales += 1
    acc[dealerId].revenue += sale.total_amount || 0
    return acc
  }, {} as Record<string, any>)

  const topDealers = Object.values(dealerSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    vehicles: topVehicles,
    regions: topRegions,
    dealers: topDealers
  }
}

function getDaysBetweenDates(sales: any[]) {
  if (sales.length === 0) return 1
  
  const dates = sales.map(sale => new Date(sale.created_at))
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  
  const diffTime = Math.abs(maxDate.getTime() - minDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays || 1
}
