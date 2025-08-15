import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['customer', 'dealer', 'admin']).default('customer'),
  phone: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, phone, city, pincode } = signupSchema.parse(body)
    
    const supabase = await createClient()
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }
    
    // Store additional user data in a profiles table (if you have one)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name,
          role,
          phone,
          city,
          pincode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      // If profile creation fails, log it but don't fail the signup
      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }
    
    return NextResponse.json({
      user: authData.user,
      message: 'Signup successful. Please check your email for verification.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
