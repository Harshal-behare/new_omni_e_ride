import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    
    // Build query - fetch all dealers (no auth required for public view)
    let query = supabase
      .from('dealers')
      .select('*')
    
    // Apply filters
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }
    
    if (state) {
      query = query.ilike('state', `%${state}%`)
    }
    
    // Order by created_at
    query = query.order('created_at', { ascending: false })
    
    const { data: dealers, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      // Return empty array instead of error for public endpoint
      return NextResponse.json([])
    }
    
    // Transform dealer data if needed
    const formattedDealers = dealers?.map(dealer => ({
      id: dealer.id,
      business_name: dealer.business_name || dealer.user_id, // fallback to user_id if no name
      business_address: dealer.business_address || 'Address not available',
      business_phone: dealer.business_phone || 'Contact not available',
      business_email: dealer.business_email,
      city: dealer.city || 'City not specified',
      state: dealer.state || 'State not specified',
      pincode: dealer.pincode || '',
      google_maps_link: dealer.google_maps_link,
      status: dealer.status || 'pending',
      commission_rate: dealer.commission_rate,
      approved_at: dealer.approved_at,
      created_at: dealer.created_at
    })) || []
    
    return NextResponse.json(formattedDealers)
  } catch (error) {
    console.error('Error fetching dealers:', error)
    // Return empty array for public endpoint
    return NextResponse.json([])
  }
}
