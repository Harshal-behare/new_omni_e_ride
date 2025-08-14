import { Lead, LeadInsert, LeadUpdate } from '@/lib/database.types'

export interface LeadFilters {
  status?: Lead['status'][]
  priority?: Lead['priority'][]
  source?: Lead['source'][]
  assigned_to?: string
  dealer_id?: string
  from_date?: string
  to_date?: string
  sortBy?: 'created_at' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  priority?: 'normal' | 'urgent'
}

export interface InquiryFormData extends ContactFormData {
  vehicle_id?: string
  dealer_id?: string
}

// Submit a contact form (creates a lead)
export async function submitContactForm(data: ContactFormData): Promise<Lead> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to submit contact form')
  }

  return response.json()
}

// Submit an inquiry/lead
export async function submitInquiry(data: InquiryFormData): Promise<Lead> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      source: 'inquiry',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to submit inquiry')
  }

  return response.json()
}

// Get leads with filters (for dealers/admins)
export async function getLeads(filters?: LeadFilters): Promise<{
  leads: Lead[]
  total: number
  page: number
  pageSize: number
}> {
  const params = new URLSearchParams()
  
  if (filters) {
    if (filters.status?.length) params.append('status', filters.status.join(','))
    if (filters.priority?.length) params.append('priority', filters.priority.join(','))
    if (filters.source?.length) params.append('source', filters.source.join(','))
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to)
    if (filters.dealer_id) params.append('dealer_id', filters.dealer_id)
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
  }

  const response = await fetch(`/api/leads?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch leads')
  }

  return response.json()
}

// Get a single lead by ID
export async function getLead(id: string): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch lead')
  }

  return response.json()
}

// Update lead status
export async function updateLeadStatus(
  id: string,
  status: Lead['status'],
  notes?: string
): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update lead status')
  }

  return response.json()
}

// Assign lead to dealer
export async function assignLeadToDealer(
  id: string,
  dealerId: string,
  notes?: string
): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dealer_id: dealerId, notes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to assign lead')
  }

  return response.json()
}

// Update lead notes
export async function updateLeadNotes(id: string, notes: string): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}/notes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update lead notes')
  }

  return response.json()
}

// Convert lead to customer
export async function convertLeadToCustomer(
  id: string,
  orderId?: string
): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order_id: orderId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to convert lead')
  }

  return response.json()
}

// Get lead analytics
export async function getLeadAnalytics(filters?: {
  from_date?: string
  to_date?: string
  dealer_id?: string
}): Promise<{
  total_leads: number
  leads_by_status: Record<string, number>
  leads_by_source: Record<string, number>
  conversion_rate: number
  average_response_time: number
  leads_by_day: Array<{ date: string; count: number }>
  top_dealers: Array<{ dealer_id: string; name: string; count: number; conversion_rate: number }>
}> {
  const params = new URLSearchParams()
  
  if (filters) {
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)
    if (filters.dealer_id) params.append('dealer_id', filters.dealer_id)
  }

  const response = await fetch(`/api/leads/analytics?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch lead analytics')
  }

  return response.json()
}
