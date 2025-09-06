import { createClient } from '@/lib/supabase/client'

// Calculate dealer metrics from existing tables instead of using dealer_metrics table
export async function getDealerMetrics(dealerId: string, year?: number, month?: number) {
  const supabase = createClient()
  
  // Get dealer info first
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, user_id')
    .eq('user_id', dealerId)
    .single()
    
  if (!dealer) {
    return []
  }
  
  // Set date range
  const targetYear = year || new Date().getFullYear()
  const targetMonth = month || new Date().getMonth() + 1
  
  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)
  
  // Since orders are removed, set sales metrics to 0
  const monthlyRevenue = 0
  const monthlySales = 0
  
  // Calculate test ride metrics
  const { data: testRides, count: testRideCount } = await supabase
    .from('test_rides')
    .select('id', { count: 'exact' })
    .eq('dealer_id', dealer.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  // Calculate lead metrics
  const { data: leads } = await supabase
    .from('leads')
    .select('id, status')
    .eq('dealer_id', dealer.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  const totalLeads = leads?.length || 0
  const convertedLeads = leads?.filter(lead => lead.status === 'converted').length || 0
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
  
  // Mock inventory data (since we don't have inventory tracking per dealer)
  const totalInventory = Math.floor(Math.random() * 20) + 10
  const reservedUnits = Math.floor(totalInventory * 0.2)
  
  return [{
    dealer_id: dealerId,
    period_month: targetMonth,
    period_year: targetYear,
    total_sales: monthlySales,
    total_revenue: monthlyRevenue,
    monthly_sales: monthlySales,
    monthly_revenue: monthlyRevenue,
    conversion_rate: conversionRate,
    average_sale_value: monthlySales > 0 ? monthlyRevenue / monthlySales : 0,
    customer_satisfaction_score: 4.5, // Mock data
    total_inventory: totalInventory,
    reserved_units: reservedUnits,
    sold_units: monthlySales,
    test_rides_scheduled: testRideCount || 0,
    total_leads: totalLeads,
    qualified_leads: Math.floor(totalLeads * 0.6),
    converted_leads: convertedLeads,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]
}

// Get dealer stats with calculated metrics
export async function getDealerStats(dealerId: string) {
  const supabase = createClient()
  
  // Get dealer info
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, user_id')
    .eq('user_id', dealerId)
    .single()
    
  if (!dealer) {
    return {
      current: null,
      previous: null,
      inventory: { total: 0, reserved: 0, sold: 0, available: 0 },
      growth: null
    }
  }
  
  // Get current month metrics
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  const currentMetrics = await getDealerMetrics(dealerId, currentYear, currentMonth)
  
  // Get previous month metrics
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear
  
  const previousMetrics = await getDealerMetrics(dealerId, previousYear, previousMonth)
  
  const current = currentMetrics[0] || {
    total_sales: 0,
    total_revenue: 0,
    monthly_sales: 0,
    monthly_revenue: 0,
    conversion_rate: 0,
    average_sale_value: 0,
    customer_satisfaction_score: 0
  }
  
  const previous = previousMetrics[0]
  
  const inventoryStats = {
    total: current.total_inventory || 0,
    reserved: current.reserved_units || 0,
    sold: current.sold_units || 0,
    available: (current.total_inventory || 0) - (current.reserved_units || 0)
  }
  
  return {
    current,
    previous,
    inventory: inventoryStats,
    growth: previous ? {
      sales: previous.monthly_sales ? 
        ((current.monthly_sales || 0) - previous.monthly_sales) / previous.monthly_sales * 100 : 0,
      revenue: previous.monthly_revenue ? 
        ((current.monthly_revenue || 0) - previous.monthly_revenue) / previous.monthly_revenue * 100 : 0
    } : null
  }
}

// Update dealer metrics (placeholder function since metrics are calculated dynamically)
export async function updateDealerMetrics(dealerId: string, metrics: Partial<any>) {
  // Since we calculate metrics dynamically from existing tables,
  // this function doesn't need to do anything
  // It's here for API compatibility
  return { success: true, message: 'Metrics are calculated dynamically' }
}
