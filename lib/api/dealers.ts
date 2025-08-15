import { createClient } from '@/lib/supabase/client'

// Types
export interface DealerApplication {
  id?: string
  user_id?: string
  
  // Company Information
  company_name: string
  business_registration_number: string
  tax_id?: string
  
  // Contact Information
  contact_name: string
  contact_email: string
  contact_phone: string
  
  // Address
  address_line1: string
  address_line2?: string
  city: string
  state_province: string
  postal_code: string
  country?: string
  
  // Business Details
  years_in_business?: number
  annual_revenue?: string
  existing_brands?: string[]
  showroom_size_sqft?: number
  number_of_employees?: number
  website_url?: string
  
  // Documents
  business_license_url?: string
  tax_certificate_url?: string
  bank_statement_url?: string
  additional_documents?: string[]
  
  // Application Status
  status?: 'pending' | 'under_review' | 'approved' | 'rejected'
  rejection_reason?: string
  approved_by?: string
  approved_at?: string
  
  // Agreement
  terms_accepted: boolean
  terms_accepted_at?: string
  
  // Metadata
  notes?: string
  internal_notes?: string
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface DealerMetrics {
  id?: string
  dealer_id: string
  
  // Sales Metrics
  total_sales: number
  total_revenue: number
  monthly_sales: number
  monthly_revenue: number
  
  // Inventory Metrics
  total_inventory: number
  reserved_units: number
  sold_units: number
  
  // Performance Metrics
  conversion_rate: number
  average_sale_value: number
  customer_satisfaction_score: number
  
  // Period
  period_month: number
  period_year: number
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface DealerInventory {
  id?: string
  dealer_id: string
  vehicle_id: string
  
  // Stock Information
  quantity: number
  reserved_quantity?: number
  sold_quantity?: number
  
  // Pricing
  dealer_price?: number
  minimum_price?: number
  
  // Status
  is_active?: boolean
  
  // Relationships
  vehicle?: any
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface DealerFilters {
  status?: 'pending' | 'under_review' | 'approved' | 'rejected'
  search?: string
  city?: string
  state_province?: string
  country?: string
  sortBy?: 'created_at' | 'company_name' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Dealer Application CRUD Operations
export async function createDealerApplication(data: DealerApplication) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  // Set user_id and timestamps
  const applicationData = {
    ...data,
    user_id: user.id,
    terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null
  }
  
  const { data: application, error } = await supabase
    .from('dealer_applications')
    .insert([applicationData])
    .select()
    .single()
    
  if (error) throw error
  return application
}

export async function getDealerApplications(filters: DealerFilters = {}) {
  const supabase = createClient()
  
  let query = supabase
    .from('dealer_applications')
    .select(`
      *,
      user:profiles!dealer_applications_user_id_fkey(
        id,
        email,
        name
      )
    `)
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters.search) {
    query = query.or(`company_name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`)
  }
  
  if (filters.city) {
    query = query.eq('city', filters.city)
  }
  
  if (filters.state_province) {
    query = query.eq('state_province', filters.state_province)
  }
  
  if (filters.country) {
    query = query.eq('country', filters.country)
  }
  
  // Apply sorting
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  
  // Apply pagination
  if (filters.page && filters.limit) {
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)
  }
  
  const { data, error, count } = await query
  
  if (error) throw error
  return { data, count }
}

export async function getDealerApplication(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dealer_applications')
    .select(`
      *,
      user:profiles!dealer_applications_user_id_fkey(
        id,
        email,
        name,
        role
      ),
      approver:profiles!dealer_applications_approved_by_fkey(
        id,
        email,
        name
      )
    `)
    .eq('id', id)
    .single()
    
  if (error) throw error
  return data
}

export async function updateDealerApplication(id: string, data: Partial<DealerApplication>) {
  const supabase = createClient()
  
  const { data: application, error } = await supabase
    .from('dealer_applications')
    .update(data)
    .eq('id', id)
    .select()
    .single()
    
  if (error) throw error
  return application
}

export async function approveDealerApplication(id: string, approved: boolean, reason?: string) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  // Get the application
  const { data: application, error: fetchError } = await supabase
    .from('dealer_applications')
    .select('user_id')
    .eq('id', id)
    .single()
    
  if (fetchError) throw fetchError
  
  // Update application status
  const updateData: Partial<DealerApplication> = {
    status: approved ? 'approved' : 'rejected',
    approved_by: user.id,
    approved_at: new Date().toISOString()
  }
  
  if (!approved && reason) {
    updateData.rejection_reason = reason
  }
  
  const { data: updatedApplication, error: updateError } = await supabase
    .from('dealer_applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
    
  if (updateError) throw updateError
  
  // If approved, update user role to dealer
  if (approved && application.user_id) {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'dealer' })
      .eq('id', application.user_id)
      
    if (roleError) throw roleError
    
    // Initialize dealer metrics for current month
    const currentDate = new Date()
    const { error: metricsError } = await supabase
      .from('dealer_metrics')
      .insert([{
        dealer_id: application.user_id,
        period_month: currentDate.getMonth() + 1,
        period_year: currentDate.getFullYear()
      }])
      
    if (metricsError && metricsError.code !== '23505') { // Ignore duplicate key error
      console.error('Error initializing dealer metrics:', metricsError)
    }
  }
  
  return updatedApplication
}

// Dealer Metrics Operations
export async function getDealerMetrics(dealerId: string, year?: number, month?: number) {
  const supabase = createClient()
  
  let query = supabase
    .from('dealer_metrics')
    .select('*')
    .eq('dealer_id', dealerId)
    
  if (year) {
    query = query.eq('period_year', year)
  }
  
  if (month) {
    query = query.eq('period_month', month)
  }
  
  query = query.order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function updateDealerMetrics(dealerId: string, metrics: Partial<DealerMetrics>) {
  const supabase = createClient()
  
  const currentDate = new Date()
  const period_month = metrics.period_month || currentDate.getMonth() + 1
  const period_year = metrics.period_year || currentDate.getFullYear()
  
  const { data, error } = await supabase
    .from('dealer_metrics')
    .upsert({
      ...metrics,
      dealer_id: dealerId,
      period_month,
      period_year
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}

// Dealer Inventory Operations
export async function getDealerInventory(dealerId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dealer_inventory')
    .select(`
      *,
      vehicle:vehicles(
        id,
        slug,
        name,
        price,
        images,
        range_km,
        top_speed
      )
    `)
    .eq('dealer_id', dealerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data
}

export async function updateDealerInventory(
  dealerId: string,
  vehicleId: string,
  inventory: Partial<DealerInventory>
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dealer_inventory')
    .upsert({
      ...inventory,
      dealer_id: dealerId,
      vehicle_id: vehicleId
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}

// Document Upload Operations
export async function uploadDealerDocument(
  file: File,
  userId: string,
  documentType: 'business_license' | 'tax_certificate' | 'bank_statement' | 'additional'
) {
  const supabase = createClient()
  
  // Generate unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`
  
  // Upload file to storage
  const { data, error } = await supabase.storage
    .from('dealer-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
    
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('dealer-documents')
    .getPublicUrl(fileName)
    
  return publicUrl
}

export async function deleteDealerDocument(filePath: string) {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from('dealer-documents')
    .remove([filePath])
    
  if (error) throw error
  return true
}

// Helper function to get dealer stats
export async function getDealerStats(dealerId: string) {
  const supabase = createClient()
  
  // Get current month metrics
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  const { data: currentMetrics } = await supabase
    .from('dealer_metrics')
    .select('*')
    .eq('dealer_id', dealerId)
    .eq('period_month', currentMonth)
    .eq('period_year', currentYear)
    .single()
    
  // Get previous month metrics for comparison
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear
  
  const { data: previousMetrics } = await supabase
    .from('dealer_metrics')
    .select('*')
    .eq('dealer_id', dealerId)
    .eq('period_month', previousMonth)
    .eq('period_year', previousYear)
    .single()
    
  // Get total inventory
  const { data: inventory } = await supabase
    .from('dealer_inventory')
    .select('quantity, reserved_quantity, sold_quantity')
    .eq('dealer_id', dealerId)
    .eq('is_active', true)
    
  const totalInventory = inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
  const reservedUnits = inventory?.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0) || 0
  const soldUnits = inventory?.reduce((sum, item) => sum + (item.sold_quantity || 0), 0) || 0
  
  return {
    current: currentMetrics || {
      total_sales: 0,
      total_revenue: 0,
      monthly_sales: 0,
      monthly_revenue: 0,
      conversion_rate: 0,
      average_sale_value: 0,
      customer_satisfaction_score: 0
    },
    previous: previousMetrics,
    inventory: {
      total: totalInventory,
      reserved: reservedUnits,
      sold: soldUnits,
      available: totalInventory - reservedUnits
    },
    growth: previousMetrics ? {
      sales: previousMetrics.monthly_sales ? 
        ((currentMetrics?.monthly_sales || 0) - previousMetrics.monthly_sales) / previousMetrics.monthly_sales * 100 : 0,
      revenue: previousMetrics.monthly_revenue ? 
        ((currentMetrics?.monthly_revenue || 0) - previousMetrics.monthly_revenue) / previousMetrics.monthly_revenue * 100 : 0
    } : null
  }
}
