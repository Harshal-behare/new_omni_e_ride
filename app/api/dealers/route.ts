import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDealerApplications } from '@/lib/api/dealers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin or dealer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile || !['admin', 'dealer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') as any,
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      state_province: searchParams.get('state_province') || undefined,
      country: searchParams.get('country') || undefined,
      sortBy: searchParams.get('sortBy') as any || 'created_at',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    }
    
    // If user is a dealer, only show their own application
    if (profile.role === 'dealer') {
      const { data: application } = await supabase
        .from('dealer_applications')
        .select(`
          *,
          user:profiles!dealer_applications_user_id_fkey(
            id,
            email,
            name
          )
        `)
        .eq('user_id', user.id)
        .single()
        
      return NextResponse.json(
        {
          data: application ? [application] : [],
          count: application ? 1 : 0
        },
        { status: 200 }
      )
    }
    
    // Admin can see all applications with filters
    const { data, count } = await getDealerApplications(filters)
    
    return NextResponse.json(
      {
        data,
        count,
        page: filters.page,
        limit: filters.limit,
        totalPages: count ? Math.ceil(count / filters.limit) : 0
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error fetching dealer applications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
