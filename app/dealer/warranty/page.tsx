'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { WarrantyRegistrationForm } from '@/components/warranty/warranty-registration-form'
import { listWarrantiesByDealer } from '@/lib/stores/warranties'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { WarrantyStateBadge } from '@/components/warranty/status-badge'

export default function DealerWarrantyPage() {
  const dealerName = 'Green Wheels Bengaluru'
  const { user } = useDemoAuth()
  const [warranties, setWarranties] = React.useState(() => listWarrantiesByDealer(dealerName))

  function refresh() {
    setWarranties(listWarrantiesByDealer(dealerName))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Warranty Management</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>Register Warranty</CardTitle></CardHeader>
        <CardContent>
          <WarrantyRegistrationForm
            dealerName={dealerName}
            defaultCustomer={user ? { name: user.name, email: user.email } : undefined}
            onSubmitted={() => refresh()}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="text-left text-gray-600">
                <th className="py-2">ID</th><th>Customer</th><th>Email</th><th>Model</th><th>Period</th><th>Status</th><th>Submitted</th>
              </tr></thead>
              <tbody>
                {warranties.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="py-2">{w.id}</td>
                    <td>{w.customerName}</td>
                    <td>{w.customerEmail}</td>
                    <td>{w.modelName}</td>
                    <td>{w.periodYears} yr</td>
                    <td><WarrantyStateBadge state={w.reviewStatus} /></td>
                    <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {warranties.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-600">No submissions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
