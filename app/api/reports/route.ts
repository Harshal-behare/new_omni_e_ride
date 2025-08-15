import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reports - Generate and export reports
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to reports
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') // sales, users, inventory, test_rides, dealers
    const format = searchParams.get('format') || 'json' // json, csv, xlsx
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const dealerId = searchParams.get('dealerId')

    if (!reportType) {
      return NextResponse.json({ 
        error: 'Report type is required' 
      }, { status: 400 })
    }

    // Set default date range if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    let reportData: any
    let fileName: string

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(supabase, start, end, dealerId, profile?.role)
        fileName = `sales_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`
        break

      case 'users':
        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required for user reports' }, { status: 403 })
        }
        reportData = await generateUsersReport(supabase, start, end)
        fileName = `users_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`
        break

      case 'inventory':
        reportData = await generateInventoryReport(supabase, dealerId, profile?.role, user.id)
        fileName = `inventory_report_${new Date().toISOString().split('T')[0]}`
        break

      case 'test_rides':
        reportData = await generateTestRidesReport(supabase, start, end, dealerId, profile?.role)
        fileName = `test_rides_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`
        break

      case 'dealers':
        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required for dealer reports' }, { status: 403 })
        }
        reportData = await generateDealersReport(supabase, start, end)
        fileName = `dealers_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid report type. Supported: sales, users, inventory, test_rides, dealers' 
        }, { status: 400 })
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData.data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`
        }
      })
    }

    if (format === 'xlsx') {
      // For Excel export, you would typically use a library like xlsx
      // For now, return JSON with a note about Excel export
      return NextResponse.json({
        ...reportData,
        note: 'Excel export requires additional library implementation'
      })
    }

    // Default JSON format
    return NextResponse.json({
      reportType,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      generated_at: new Date().toISOString(),
      ...reportData
    })

  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateSalesReport(supabase: any, startDate: Date, endDate: Date, dealerId?: string | null, userRole?: string) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        customer_id,
        dealer_id,
        vehicle_id,
        profiles!customer_id(full_name, email, city, state),
        vehicles(make, model, variant, price),
        dealers(business_name, city, state)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: sales } = await query.order('created_at', { ascending: false })

    const summary = {
      totalOrders: sales?.length || 0,
      totalRevenue: sales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      averageOrderValue: sales?.length ? (sales.reduce((sum, order) => sum + (order.total_amount || 0), 0) / sales.length) : 0,
      topVehicles: getTopItems(sales || [], 'vehicles', 'model'),
      topDealers: getTopItems(sales || [], 'dealers', 'business_name'),
      salesByDate: groupByDate(sales || [])
    }

    return {
      summary,
      data: sales || []
    }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return { summary: {}, data: [] }
  }
}

async function generateUsersReport(supabase: any, startDate: Date, endDate: Date) {
  try {
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        city,
        state,
        created_at,
        last_sign_in_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    const summary = {
      totalUsers: users?.length || 0,
      usersByRole: groupByField(users || [], 'role'),
      usersByStatus: groupByField(users || [], 'status'),
      usersByState: groupByField(users || [], 'state'),
      signupsByDate: groupByDate(users || [])
    }

    return {
      summary,
      data: users || []
    }
  } catch (error) {
    console.error('Error generating users report:', error)
    return { summary: {}, data: [] }
  }
}

async function generateInventoryReport(supabase: any, dealerId?: string | null, userRole?: string, userId?: string) {
  try {
    let query = supabase
      .from('inventory')
      .select(`
        id,
        vehicle_id,
        dealer_id,
        quantity,
        reserved_quantity,
        status,
        last_updated,
        vehicles(make, model, variant, price),
        dealers(business_name, city, state)
      `)

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    } else if (userRole === 'dealer') {
      // Get dealer's inventory only
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (dealerProfile) {
        query = query.eq('dealer_id', dealerProfile.id)
      }
    }

    const { data: inventory } = await query.order('last_updated', { ascending: false })

    const summary = {
      totalItems: inventory?.length || 0,
      totalQuantity: inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      totalReserved: inventory?.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0) || 0,
      lowStockItems: inventory?.filter(item => (item.quantity || 0) < 10).length || 0,
      inventoryByStatus: groupByField(inventory || [], 'status'),
      inventoryByDealer: groupByField(inventory || [], 'dealers.business_name'),
      totalValue: inventory?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.vehicles?.price || 0)), 0) || 0
    }

    return {
      summary,
      data: inventory || []
    }
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return { summary: {}, data: [] }
  }
}

async function generateTestRidesReport(supabase: any, startDate: Date, endDate: Date, dealerId?: string | null, userRole?: string) {
  try {
    let query = supabase
      .from('test_rides')
      .select(`
        id,
        created_at,
        scheduled_date,
        status,
        customer_id,
        dealer_id,
        vehicle_id,
        profiles!customer_id(full_name, email, phone),
        vehicles(make, model, variant),
        dealers(business_name, city, state)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }

    const { data: testRides } = await query.order('created_at', { ascending: false })

    const summary = {
      totalTestRides: testRides?.length || 0,
      completedTestRides: testRides?.filter(ride => ride.status === 'completed').length || 0,
      scheduledTestRides: testRides?.filter(ride => ride.status === 'scheduled').length || 0,
      cancelledTestRides: testRides?.filter(ride => ride.status === 'cancelled').length || 0,
      testRidesByStatus: groupByField(testRides || [], 'status'),
      testRidesByDealer: groupByField(testRides || [], 'dealers.business_name'),
      testRidesByDate: groupByDate(testRides || [])
    }

    return {
      summary,
      data: testRides || []
    }
  } catch (error) {
    console.error('Error generating test rides report:', error)
    return { summary: {}, data: [] }
  }
}

async function generateDealersReport(supabase: any, startDate: Date, endDate: Date) {
  try {
    const { data: dealers } = await supabase
      .from('dealers')
      .select(`
        id,
        business_name,
        business_address,
        city,
        state,
        status,
        commission_rate,
        created_at,
        approved_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    const summary = {
      totalDealers: dealers?.length || 0,
      activeDealers: dealers?.filter(dealer => dealer.status === 'active').length || 0,
      pendingDealers: dealers?.filter(dealer => dealer.status === 'pending').length || 0,
      dealersByState: groupByField(dealers || [], 'state'),
      dealersByStatus: groupByField(dealers || [], 'status'),
      averageCommissionRate: dealers?.length ? 
        dealers.reduce((sum, dealer) => sum + (dealer.commission_rate || 0), 0) / dealers.length : 0
    }

    return {
      summary,
      data: dealers || []
    }
  } catch (error) {
    console.error('Error generating dealers report:', error)
    return { summary: {}, data: [] }
  }
}

function getTopItems(data: any[], objectKey: string, valueKey: string, limit = 5) {
  const counts = data.reduce((acc, item) => {
    const value = item[objectKey]?.[valueKey] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

function groupByField(data: any[], field: string) {
  return data.reduce((acc, item) => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], item) : 
      item[field]
    const key = value || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function groupByDate(data: any[], dateField = 'created_at') {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField]).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        return `"${String(value || '').replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  return csvContent
}
