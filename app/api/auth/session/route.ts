import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { user: null, session: null },
        { status: 200 }
      )
    }
    
    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()
    
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()
    
    return NextResponse.json({
      user: {
        ...user,
        role: profile?.role || user.user_metadata?.role || 'customer',
        name: profile?.name || user.user_metadata?.name,
      },
      session,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
