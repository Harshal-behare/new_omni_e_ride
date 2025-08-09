'use client'

import * as React from 'react'
import { addTestRide, TestRide } from '@/lib/stores/test-rides'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { MODELS } from '@/lib/models-data'

export default function DealerTestRidesPage() {
  const [form, setForm] = React.useState({
    customerEmail: '',
    customerName: '',
    modelId: MODELS[0]?.id ?? '',
    dealerName: 'Green Wheels Patna',
    date: '',
    time: '11:00',
    paid: false,
  })

  function create() {
    if (!form.customerEmail || !form.date) return alert('Please fill customer email and date.')
    const model = MODELS.find((m) => m.id === form.modelId)!
    addTestRide({
      customerEmail: form.customerEmail,
      customerName: form.customerName || form.customerEmail,
      modelId: form.modelId,
      modelName: model.name,
      dealerName: form.dealerName,
      date: form.date,
      time: form.time,
      status: 'Confirmed',
      payment: { amount: 2000, currency: 'INR', status: form.paid ? 'Paid' : 'Pending' },
    })
    alert('Test ride created. It will reflect on the customer dashboard.')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Test Rides</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Schedule a Test Ride for Customer</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Customer Email"><input className="w-full rounded-lg border px-3 py-2" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></Field>
            <Field label="Customer Name (optional)"><input className="w-full rounded-lg border px-3 py-2" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Model">
              <select className="w-full rounded-lg border px-3 py-2" value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}>
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Dealer">
              <input className="w-full rounded-lg border px-3 py-2" value={form.dealerName} onChange={(e) => setForm({ ...form, dealerName: e.target.value })} />
            </Field>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Date"><input type="date" className="w-full rounded-lg border px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" className="w-full rounded-lg border px-3 py-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
            <label className="text-sm flex items-end gap-2">
              <input type="checkbox" className="accent-emerald-600" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
              Mark ₹2,000 as paid
            </label>
          </div>
          <OmniButton onClick={create}>Create Test Ride</OmniButton>
          <p className="text-xs text-gray-600">Customers can complete pending payment from their dashboard.</p>
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
