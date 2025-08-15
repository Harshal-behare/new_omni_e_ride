import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
  const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has submitted a dealer application
    const { data: application, error } = await supabase
      .from('dealer_applications')
      .select('status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({ 
          status: 'none',
          submittedDate: null 
        })
      }
      throw error
    }

    return NextResponse.json({
      status: application.status || 'pending',
      submittedDate: application.created_at
    })

  } catch (error) {
    console.error('Error fetching dealer application status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealer application status' },
      { status: 500 }
    )
  }
}
