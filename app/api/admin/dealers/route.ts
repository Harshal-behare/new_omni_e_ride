import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all dealers with user info
    const { data: dealers, error } = await supabase
      .from('dealers')
      .select(`
        *,
        user:profiles!dealers_user_id_fkey(
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(dealers || [])

  } catch (error) {
    console.error('Error fetching dealers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    )
  }
}
