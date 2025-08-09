'use client'

import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { OmniButton } from '@/components/ui/omni-button'

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<{ email: string }>()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Reset Your Password</h1>
      <p className="text-gray-600">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={handleSubmit(() => alert('Reset link sent (demo)'))} className="mt-6 grid gap-4">
        <label className="text-sm">
          <div className="font-medium">Email</div>
          <input type="email" className="mt-1 w-full rounded-lg border px-3 py-2" {...register('email', { required: true })} />
        </label>
        <OmniButton type="submit">Send Reset Link</OmniButton>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">Back to login</Link>
    </div>
  )
}
