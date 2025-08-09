'use client'

import * as React from 'react'
import { addOrder, Order } from '@/lib/stores/orders'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function DealerOrdersPage() {
  const [form, setForm] = React.useState({
    customerEmail: '',
    customerName: '',
    modelName: 'Urban Pro',
    value: 125000,
    status: 'Confirmed' as Order['status'],
  })

  function create() {
    if (!form.customerEmail) return alert('Customer email required')
    addOrder({
      customerEmail: form.customerEmail,
      customerName: form.customerName || form.customerEmail,
      modelName: form.modelName,
      value: Number(form.value),
      status: form.status,
    })
    alert('Order created. It will reflect on the customer dashboard.')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Create Order for Customer</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Customer Email"><input className="w-full rounded-lg border px-3 py-2" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></Field>
            <Field label="Customer Name (optional)"><input className="w-full rounded-lg border px-3 py-2" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Model"><input className="w-full rounded-lg border px-3 py-2" value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} /></Field>
            <Field label="Amount (₹)"><input type="number" className="w-full rounded-lg border px-3 py-2" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></Field>
            <Field label="Status">
              <select className="w-full rounded-lg border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Order['status'] })}>
                <option>Confirmed</option>
                <option>In Production</option>
                <option>Shipped</option>
                <option>Delivered</option>
              </select>
            </Field>
          </div>
          <OmniButton onClick={create}>Create Order</OmniButton>
          <p className="text-xs text-gray-600">Order documents will be emailed to the customer.</p>
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
