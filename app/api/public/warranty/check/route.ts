import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/public/warranty/check - Check warranty status by VIN or email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vin = searchParams.get('vin')
    const email = searchParams.get('email')
    
    if (!vin && !email) {
      return NextResponse.json({ 
        error: 'Please provide either VIN or email to check warranty' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Build query
    let query = supabase
      .from('warranty_registrations')
      .select('*')
      .eq('review_status', 'Approved') // Only show approved warranties
    
    if (vin) {
      query = query.eq('vin', vin.toUpperCase())
    } else if (email) {
      query = query.eq('customer_email', email.toLowerCase())
    }
    
    const { data: warranties, error } = await query
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching warranty:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch warranty information' 
      }, { status: 500 })
    }
    
    if (!warranties || warranties.length === 0) {
      return NextResponse.json({ 
        error: 'No warranty found for the provided information',
        warranties: []
      }, { status: 404 })
    }
    
    // Calculate warranty expiry for each warranty
    const warrantiesWithExpiry = warranties.map(warranty => {
      const purchaseDate = new Date(warranty.purchase_date)
      const expiryDate = new Date(purchaseDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + warranty.period_years)
      
      const isExpired = expiryDate < new Date()
      const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: warranty.id,
        customer_name: warranty.customer_name,
        customer_email: warranty.customer_email,
        vehicle_model: warranty.vehicle_model,
        vin: warranty.vin,
        purchase_date: warranty.purchase_date,
        period_years: warranty.period_years,
        dealer_name: warranty.dealer_name,
        expiry_date: expiryDate.toISOString(),
        is_expired: isExpired,
        days_remaining: isExpired ? 0 : daysRemaining,
        status: isExpired ? 'Expired' : 'Active'
      }
    })
    
    return NextResponse.json({ 
      success: true,
      warranties: warrantiesWithExpiry 
    })
  } catch (error) {
    console.error('Error in warranty check:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
