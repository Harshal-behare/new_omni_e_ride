'use client'

import * as React from 'react'
import { getApplications, setApplicationStatus, type DealerApplication } from '@/lib/stores/dealer-applications'
import { setUserRole } from '@/lib/stores/users'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function AdminDealerApplicationsPage() {
  const [apps, setApps] = React.useState<DealerApplication[]>([])

  React.useEffect(() => {
    setApps(getApplications())
  }, [])

  function refresh() {
    setApps(getApplications())
  }

  function approve(app: DealerApplication) {
    setApplicationStatus(app.id, 'Approved', 'Admin')
    setUserRole(app.applicantEmail, 'dealer')
    refresh()
    alert(`Application approved. ${app.applicantEmail} is now a Dealer (demo). An email will be sent.`)
  }

  function decline(app: DealerApplication) {
    setApplicationStatus(app.id, 'Declined', 'Admin')
    refresh()
    alert('Application declined (demo). An email will be sent.')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dealer Applications</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Review & Action</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead><tr className="text-left text-gray-600">
                <th className="py-2">ID</th><th>Applicant</th><th>Email</th><th>City</th><th>Business</th><th>Status</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.id}</td>
                    <td>{a.applicantName}</td>
                    <td>{a.applicantEmail}</td>
                    <td>{a.city}</td>
                    <td>{a.businessName}</td>
                    <td><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{a.status}</span></td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <OmniButton size="sm" variant="secondary" onClick={() => decline(a)} disabled={a.status !== 'Pending'}>Decline</OmniButton>
                        <OmniButton size="sm" onClick={() => approve(a)} disabled={a.status !== 'Pending'}>Approve</OmniButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-600">No applications yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Approving an application promotes the user to Dealer (demo). In production, trigger an email and session revalidation.</p>
        </CardContent>
      </Card>
    </div>
  )
}
