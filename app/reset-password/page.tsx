'use client'

import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { OmniButton } from '@/components/ui/omni-button'

export default function ResetPasswordPage() {
  const { register, handleSubmit, watch } = useForm<{ password: string; confirm: string }>()
  const pwd = watch('password')
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Create a New Password</h1>
      <form onSubmit={handleSubmit(() => alert('Password reset (demo)'))} className="mt-6 grid gap-4">
        <label className="text-sm">
          <div className="font-medium">New Password</div>
          <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2" {...register('password', { required: true })} />
        </label>
        <label className="text-sm">
          <div className="font-medium">Confirm Password</div>
          <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2" {...register('confirm', { required: true, validate: (v) => v === pwd || 'Passwords do not match' })} />
        </label>
        <OmniButton type="submit">Update Password</OmniButton>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">Back to login</Link>
    </div>
  )
}
