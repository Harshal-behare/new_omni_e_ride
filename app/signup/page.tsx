"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { OmniButton } from "@/components/ui/omni-button"
import { useAuth } from "@/hooks/use-auth"

type CustomerForm = {
  name: string
  email: string
  phone: string
  password: string
  confirm: string
  city: string
  pin: string
  newsletter: boolean
}

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const c = useForm<CustomerForm>()

  const submitCustomer = c.handleSubmit(async (data) => {
    // Validate password confirmation
    if (data.password !== data.confirm) {
      setError("Passwords do not match")
      return
    }
    
    if (data.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    setError(null)
    setLoading(true)
    
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'customer' // Default to customer role
      })
      
      if (!result.ok) {
        setError(result.error || "Signup failed")
        setLoading(false)
        return
      }
      
      // Show success message and redirect to login
      alert("Registration successful! Please check your email to verify your account.")
      router.push('/login')
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 p-12">
        <h1 className="text-3xl font-bold">Join the Electric Revolution</h1>
        <ul className="mt-6 grid gap-3 text-gray-800">
          <li>• Book Test Rides Easily</li>
          <li>• Track Your Orders</li>
          <li>• Exclusive Member Benefits</li>
          <li>• Priority Customer Support</li>
        </ul>
      </div>

      <div className="p-8 md:p-12">
        <h2 className="text-2xl font-bold">Create a Customer Account</h2>

        <form onSubmit={submitCustomer} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name">
              <input className="w-full rounded-lg border px-3 py-2" {...c.register("name", { required: true })} />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                className="w-full rounded-lg border px-3 py-2"
                {...c.register("email", { required: true })}
              />
            </Field>
            <Field label="Phone Number">
              <input className="w-full rounded-lg border px-3 py-2" {...c.register("phone", { required: true })} />
            </Field>
            <Field label="City/District">
              <input className="w-full rounded-lg border px-3 py-2" {...c.register("city")} />
            </Field>
            <Field label="PIN Code">
              <input className="w-full rounded-lg border px-3 py-2" {...c.register("pin")} />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2"
                {...c.register("password", { required: true })}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2"
                {...c.register("confirm", { required: true })}
              />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-emerald-600" {...c.register("newsletter")} /> Subscribe to
            newsletter
          </label>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <OmniButton type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </OmniButton>
          <p className="text-sm text-gray-700">
            Already have an account?{" "}
            <Link className="text-emerald-700 hover:underline" href="/login">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800">{label}</div>
      <div className="mt-1">{children}</div>
    </label>
  )
}
