'use client'

import * as React from 'react'
import { useOrdersStore } from '@/lib/stores/orders'
import type { Order } from '@/lib/database.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function DealerOrdersPage() {
  const addOrder = useOrdersStore((state) => state.addOrder)
  const [form, setForm] = React.useState({
    customerEmail: '',
    customerName: '',
    vehicleId: 'test-vehicle-id', // This needs to be set based on vehicle selection
    modelName: 'Urban Pro',
    value: 125000,
    status: 'confirmed' as Order['status'],
  })

  async function create() {
    if (!form.customerEmail) return alert('Customer email required')
    if (!form.vehicleId) {
      // For now, hardcode a vehicle ID - in production this should be selected
      alert('Vehicle selection is required')
      return
    }
    
    const result = await addOrder({
      user_id: 'placeholder-user-id', // This should be filled with actual user ID from customer lookup
      vehicle_id: form.vehicleId || 'placeholder-vehicle-id', // This should be from vehicle selection
      unit_price: form.value,
      total_amount: form.value,
      status: form.status,
      shipping_address: {
        full_name: form.customerName || form.customerEmail,
        email: form.customerEmail,
        phone: '9999999999', // Placeholder - should be from form
        address_line1: 'Placeholder Address', // Should be from form
        city: 'Mumbai', // Should be from form
        state: 'Maharashtra', // Should be from form
        pincode: '400001', // Should be from form
        country: 'India'
      },
      billing_address: {
        full_name: form.customerName || form.customerEmail,
        email: form.customerEmail,
        phone: '9999999999', // Placeholder - should be from form
        address_line1: 'Placeholder Address', // Should be from form
        city: 'Mumbai', // Should be from form
        state: 'Maharashtra', // Should be from form
        pincode: '400001', // Should be from form
        country: 'India'
      },
    })
    if (result.success) {
      alert('Order created. It will reflect on the customer dashboard.')
      // Reset form
      setForm({
        customerEmail: '',
        customerName: '',
        vehicleId: 'test-vehicle-id',
        modelName: 'Urban Pro',
        value: 125000,
        status: 'confirmed' as Order['status'],
      })
    }
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
                <option value="confirmed">Confirmed</option>
                <option value="processing">In Production</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
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
