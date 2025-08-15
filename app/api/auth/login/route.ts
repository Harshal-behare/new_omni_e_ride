import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)
    
    const supabase = await createClient()
    
    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', data.user.id)
      .single()
    
    // Determine redirect path based on role
    let redirectTo = '/dashboard'
    if (profile?.role === 'admin') {
      redirectTo = '/admin'
    } else if (profile?.role === 'dealer') {
      redirectTo = '/dealer'
    }
    
    return NextResponse.json({
      user: {
        ...data.user,
        role: profile?.role || data.user.user_metadata?.role || 'customer',
        name: profile?.name || data.user.user_metadata?.name,
      },
      session: data.session,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
