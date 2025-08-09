'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { getUserApplication, submitApplication } from '@/lib/stores/dealer-applications'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function DealerApplicationPage() {
  const { user } = useDemoAuth()
  const [app, setApp] = React.useState(getUserApplication(user?.email || ''))

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user?.email) return
    const fd = new FormData(e.currentTarget)
    const applicantName = String(fd.get('name') || '')
    const phone = String(fd.get('phone') || '')
    const city = String(fd.get('city') || '')
    const businessName = String(fd.get('business') || '')
    const yearsExperience = Number(fd.get('years') || 0)
    const gst = String(fd.get('gst') || '')
    const message = String(fd.get('message') || '')

    const res = submitApplication({
      applicantEmail: user.email,
      applicantName,
      phone,
      city,
      businessName,
      yearsExperience,
      gst,
      message,
    })
    setApp(res)
    alert('Application submitted. Admin will review it. Updates will be emailed to you.')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dealer Application</h1>

      {!app ? (
        <Card className="mt-4 max-w-2xl">
          <CardHeader><CardTitle>Apply to become a dealer</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <Field label="Full Name"><input name="name" required className="w-full rounded-lg border px-3 py-2" defaultValue={user?.name} /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Phone"><input name="phone" required className="w-full rounded-lg border px-3 py-2" /></Field>
                <Field label="City/District"><input name="city" required className="w-full rounded-lg border px-3 py-2" /></Field>
              </div>
              <Field label="Business Name"><input name="business" required className="w-full rounded-lg border px-3 py-2" /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Years of Experience"><input type="number" name="years" className="w-full rounded-lg border px-3 py-2" /></Field>
                <Field label="GST Number (optional)"><input name="gst" className="w-full rounded-lg border px-3 py-2" /></Field>
              </div>
              <Field label="Why do you want to be a dealer?"><textarea name="message" rows={4} className="w-full rounded-lg border px-3 py-2" /></Field>
              <OmniButton type="submit">Submit Application</OmniButton>
              <p className="text-xs text-gray-600">You’ll receive updates over email.</p>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4 max-w-2xl">
          <CardHeader><CardTitle>Application Status</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-700">
            <div><span className="text-gray-600">Application ID:</span> {app.id}</div>
            <div><span className="text-gray-600">Status:</span> <strong>{app.status}</strong></div>
            <div className="mt-3">
              <div><span className="text-gray-600">Name:</span> {app.applicantName}</div>
              <div><span className="text-gray-600">Phone:</span> {app.phone}</div>
              <div><span className="text-gray-600">City:</span> {app.city}</div>
              <div><span className="text-gray-600">Business:</span> {app.businessName}</div>
              {!!app.yearsExperience && <div><span className="text-gray-600">Experience:</span> {app.yearsExperience} years</div>}
              {!!app.gst && <div><span className="text-gray-600">GST:</span> {app.gst}</div>}
            </div>
            <p className="mt-3 text-xs text-gray-600">Admin will approve or decline your application. If approved, your role will be updated to Dealer.</p>
          </CardContent>
        </Card>
      )}
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
