'use client'

import * as React from 'react'
import { listWarranties, setWarrantyReview, type WarrantyRecord } from '@/lib/stores/warranties'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Checkbox } from '@/components/ui/checkbox'
import { WarrantyStateBadge } from '@/components/warranty/status-badge'

export default function AdminWarrantiesPage() {
  const [rows, setRows] = React.useState<WarrantyRecord[]>([])

  function refresh() {
    setRows(listWarranties())
  }

  React.useEffect(() => { refresh() }, [])

  function approve(w: WarrantyRecord) {
    setWarrantyReview(w.id, 'Approved', 'Admin')
    refresh()
    alert('Warranty approved (demo). Customer will be notified.')
  }
  function decline(w: WarrantyRecord) {
    setWarrantyReview(w.id, 'Declined', 'Admin')
    refresh()
    alert('Warranty declined (demo). Rejection reason recorded.')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Warranties</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead><tr className="text-left text-gray-600">
                <th className="py-2">ID</th><th>Dealer</th><th>Customer</th><th>Email</th><th>Model</th><th>VIN</th>
                <th>Period</th><th>Purchase</th><th>Docs</th><th>Status</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="border-t align-top">
                    <td className="py-2">{w.id}</td>
                    <td>{w.dealerName}</td>
                    <td>{w.customerName}</td>
                    <td>{w.customerEmail}</td>
                    <td>{w.modelName}</td>
                    <td className="font-mono text-xs">{w.vin}</td>
                    <td>{w.periodYears} yr</td>
                    <td>{new Date(w.purchaseDate).toLocaleDateString()}</td>
                    <td className="space-y-2">
                      <label className="inline-flex items-center gap-2"><Checkbox /> Invoice</label>
                      <label className="inline-flex items-center gap-2"><Checkbox /> Signature</label>
                      <label className="inline-flex items-center gap-2"><Checkbox /> Customer Verification</label>
                    </td>
                    <td><WarrantyStateBadge state={w.reviewStatus} /></td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <OmniButton size="sm" variant="secondary" onClick={() => decline(w)} disabled={w.reviewStatus !== 'PendingReview'}>Decline</OmniButton>
                        <OmniButton size="sm" onClick={() => approve(w)} disabled={w.reviewStatus !== 'PendingReview'}>Approve</OmniButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-gray-600">No warranties submitted.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Use the checklist to verify documents before approval. Bulk approvals can be added later.</p>
        </CardContent>
      </Card>
    </div>
  )
}
