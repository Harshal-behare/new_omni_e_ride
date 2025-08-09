'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { MODELS } from '@/lib/models-data'
import { addTestRide } from '@/lib/stores/test-rides'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function NewTestRidePage() {
  const { user } = useDemoAuth()
  const router = useRouter()
  const [modelId, setModelId] = React.useState(MODELS[0]?.id ?? '')
  const [dealer, setDealer] = React.useState('Green Wheels Bengaluru')
  const [date, setDate] = React.useState<string>('')
  const [time, setTime] = React.useState<string>('11:00')
  const AMOUNT = 2000

  function submit() {
    if (!user?.email || !date || !time || !modelId) return alert('Please complete the form.')
    const model = MODELS.find((m) => m.id === modelId)!
    // Simulate payment success upfront on booking.
    addTestRide({
      customerEmail: user.email,
      customerName: user.name,
      modelId,
      modelName: model.name,
      dealerName: dealer,
      date,
      time,
      status: 'Confirmed',
      payment: { amount: AMOUNT, currency: 'INR', status: 'Paid', ref: `PAY-${Date.now()}` },
    })
    alert('Test ride booked and payment received. Confirmation sent to your email.')
    router.push('/dashboard/test-rides')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Book a Test Ride</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Fill Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 max-w-2xl">
          <Field label="Model">
            <select className="w-full rounded-lg border px-3 py-2" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Dealer">
            <input className="w-full rounded-lg border px-3 py-2" value={dealer} onChange={(e) => setDealer(e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date"><input type="date" className="w-full rounded-lg border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Time"><input type="time" className="w-full rounded-lg border px-3 py-2" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          </div>

          <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
            Booking amount payable now: <strong>₹{AMOUNT.toLocaleString('en-IN')}</strong>
          </div>

          <div className="flex gap-2">
            <OmniButton onClick={submit}>Pay ₹{AMOUNT.toLocaleString('en-IN')} & Book</OmniButton>
          </div>
          <p className="text-xs text-gray-600">Receipt and confirmation will be emailed to you.</p>
        </CardContent>
      </Card>
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
