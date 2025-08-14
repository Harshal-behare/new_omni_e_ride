'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { OmniButton } from '@/components/ui/omni-button'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { Eye, EyeOff, ShieldCheck, Users, MapPin } from 'lucide-react'

type FormVals = { email: string; password: string; remember: boolean }

export default function LoginPage() {
  const [show, setShow] = React.useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormVals>({ defaultValues: { remember: true } })
  const { login } = useDemoAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const onSubmit = handleSubmit(async (vals) => {
    setError(null); setLoading(true)
    const res = await login({ email: vals.email, password: vals.password, remember: vals.remember })
    setLoading(false)
    if (!res.ok) setError(res.error || 'Login failed')
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden lg:block overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1200&width=1200')] bg-cover bg-center opacity-30" />
        <div className="relative p-12">
          <h1 className="text-3xl font-bold text-gray-900">OMNI E-RIDE</h1>
          <p className="mt-2 text-gray-700">Welcome Back to the Future of Mobility</p>
          <ul className="mt-8 grid gap-4 text-gray-800">
            <li className="inline-flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Secure Access to Your Dashboard</li>
            <li className="inline-flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Track Orders & Test Rides</li>
            <li className="inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> Connect with Our Dealer Network</li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold">Sign In to Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">Welcome back! Please enter your credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input 
                type="email" 
                className="mt-1 w-full rounded-lg border px-3 py-2 focus-visible:ring-emerald-500" 
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })} 
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input 
                  type={show ? 'text' : 'password'} 
                  className="mt-1 w-full rounded-lg border px-3 py-2 pr-10 focus-visible:ring-emerald-500" 
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })} 
                />
                <button 
                  type="button" 
                  onClick={() => setShow((s) => !s)} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-emerald-600" {...register('remember')} /> Remember me
              </label>
              <Link className="text-sm text-emerald-700 hover:underline" href="/forgot-password">Forgot Password?</Link>
            </div>
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <OmniButton type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </OmniButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">
              Don&apos;t have an account?{' '}
              <Link className="text-emerald-700 hover:underline font-medium" href="/signup">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
