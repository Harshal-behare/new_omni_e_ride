import { createClient } from '@/lib/supabase/client'
import type { 
  Order, 
  OrderInsert, 
  OrderUpdate, 
  OrderFilters,
  OrderAnalytics,
  Address,
  Vehicle
} from '@/lib/database.types'
import { getRazorpayInstance, formatAmountForRazorpay, verifyPaymentSignature } from '@/lib/razorpay/client'

// Create a new order
export async function createOrder(orderData: {
  vehicle_id: string
  quantity: number
  shipping_address: Address
  billing_address: Address
  dealer_id?: string
  notes?: string
}) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get vehicle details
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', orderData.vehicle_id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found')
  }

  // Check stock availability
  if (vehicle.stock_quantity < orderData.quantity) {
    throw new Error('Insufficient stock available')
  }

  // Calculate total amount
  const totalAmount = vehicle.price * orderData.quantity

  // Create order in database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      vehicle_id: orderData.vehicle_id,
      dealer_id: orderData.dealer_id,
      quantity: orderData.quantity,
      unit_price: vehicle.price,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      shipping_address: orderData.shipping_address,
      billing_address: orderData.billing_address,
      notes: orderData.notes
    })
    .select()
    .single()

  if (orderError) {
    throw new Error('Failed to create order')
  }

  return order
}

// Initialize Razorpay payment for order
export async function initializeOrderPayment(orderId: string) {
  const supabase = createClient()
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, vehicles(*)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Order not found')
  }

  // Create Razorpay order (Note: This should be called from server-side)
  // For client-side, you'll need to call an API endpoint
  return {
    orderId: order.id,
    amount: order.total_amount,
    currency: 'INR',
    notes: {
      order_id: order.id,
      vehicle_name: order.vehicles?.name
    }
  }
}

// Confirm order payment
export async function confirmOrderPayment(
  orderId: string,
  paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
    payment_method: 'card' | 'upi' | 'netbanking' | 'wallet'
  }
) {
  const supabase = createClient()
  
  // Update order with payment details
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      payment_method: paymentData.payment_method,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_signature: paymentData.razorpay_signature
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to confirm payment')
  }

  // Update vehicle stock
  const { error: stockError } = await supabase.rpc('decrement_vehicle_stock', {
    vehicle_id: order.vehicle_id,
    quantity: order.quantity
  })

  if (stockError) {
    console.error('Failed to update stock:', stockError)
  }

  return order
}

// Get user orders
export async function getUserOrders(filters?: OrderFilters) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('orders')
    .select(`
      *,
      vehicles (
        id,
        name,
        slug,
        images,
        price
      ),
      dealers (
        id,
        name,
        city
      )
    `)
    .eq('user_id', user.id)

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters?.payment_status && filters.payment_status.length > 0) {
    query = query.in('payment_status', filters.payment_status)
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at'
  const sortOrder = filters?.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Failed to fetch orders')
  }

  return data
}

// Get single order by ID
export async function getOrderById(orderId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      vehicles (
        id,
        name,
        slug,
        images,
        price,
        colors,
        badges
      ),
      dealers (
        id,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode
      ),
      profiles (
        id,
        name,
        email
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    throw new Error('Order not found')
  }

  return data
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  trackingNumber?: string
) {
  const supabase = createClient()
  
  const updateData: OrderUpdate = {
    status,
    updated_at: new Date().toISOString()
  }

  if (trackingNumber) {
    updateData.tracking_number = trackingNumber
  }

  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update order status')
  }

  return data
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string) {
  const supabase = createClient()
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Order not found')
  }

  // Check if order can be cancelled
  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new Error('Order cannot be cancelled')
  }

  // Update order status
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to cancel order')
  }

  // Restore vehicle stock if payment was made
  if (order.payment_status === 'paid') {
    await supabase.rpc('increment_vehicle_stock', {
      vehicle_id: order.vehicle_id,
      quantity: order.quantity
    })
  }

  return data
}

// Get orders for dealer
export async function getDealerOrders(dealerId: string, filters?: OrderFilters) {
  const supabase = createClient()
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      vehicles (
        id,
        name,
        slug,
        images,
        price
      ),
      profiles (
        id,
        name,
        email
      )
    `)
    .eq('dealer_id', dealerId)

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters?.payment_status && filters.payment_status.length > 0) {
    query = query.in('payment_status', filters.payment_status)
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at'
  const sortOrder = filters?.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Failed to fetch dealer orders')
  }

  return data
}

// Get order analytics (admin only)
export async function getOrderAnalytics(
  filters?: {
    from_date?: string
    to_date?: string
    dealer_id?: string
  }
): Promise<OrderAnalytics> {
  const supabase = createClient()
  
  // Build base query
  let query = supabase.from('orders').select('*')
  
  // Apply filters
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }
  if (filters?.dealer_id) {
    query = query.eq('dealer_id', filters.dealer_id)
  }

  const { data: orders, error } = await query

  if (error) {
    throw new Error('Failed to fetch analytics data')
  }

  // Calculate analytics
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
    return analytics
  }

  // Calculate total revenue (only paid orders)
  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  analytics.total_revenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0)
  analytics.average_order_value = analytics.total_revenue / paidOrders.length || 0

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

  return analytics
}

// Track order by ID (public)
export async function trackOrder(orderId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      payment_status,
      tracking_number,
      created_at,
      updated_at,
      delivered_at,
      vehicles (
        name,
        images
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    throw new Error('Order not found')
  }

  return data
}

// Check if user has purchased a vehicle
export async function hasUserPurchasedVehicle(vehicleId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return false
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('vehicle_id', vehicleId)
    .eq('payment_status', 'paid')
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
    .limit(1)

  return !error && data && data.length > 0
}
