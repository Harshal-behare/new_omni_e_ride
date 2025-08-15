'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

interface DealerApplication {
  id: string
  user_id: string
  business_name: string
  business_address: string
  business_type: string
  tax_id: string
  experience_years: number
  expected_monthly_sales: number
  additional_info?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function AdminDealerApplicationsPage() {
  const [apps, setApps] = React.useState<DealerApplication[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  const fetchApplications = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dealer-applications')
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      const data = await response.json()
      setApps(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  async function approve(app: DealerApplication) {
    setProcessingId(app.id)
    try {
      const response = await fetch(`/api/admin/dealer-applications/${app.id}/approve`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to approve application')
      }
      await fetchApplications()
      alert(`Application approved. ${app.user.email} is now a Dealer.`)
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  async function decline(app: DealerApplication) {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return
    
    setProcessingId(app.id)
    try {
      const response = await fetch(`/api/admin/dealer-applications/${app.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) {
        throw new Error('Failed to reject application')
      }
      await fetchApplications()
      alert('Application rejected.')
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
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
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-600">Loading applications...</td></tr>
                ) : apps.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.id.slice(0, 8)}</td>
                    <td>{a.user?.name || 'N/A'}</td>
                    <td>{a.user?.email || 'N/A'}</td>
                    <td>{a.business_address || 'N/A'}</td>
                    <td>{a.business_name}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === 'approved' ? 'bg-green-100 text-green-800' :
                        a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <OmniButton 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => decline(a)} 
                          disabled={a.status !== 'pending' || processingId === a.id}
                        >
                          {processingId === a.id ? 'Processing...' : 'Decline'}
                        </OmniButton>
                        <OmniButton 
                          size="sm" 
                          onClick={() => approve(a)} 
                          disabled={a.status !== 'pending' || processingId === a.id}
                        >
                          {processingId === a.id ? 'Processing...' : 'Approve'}
                        </OmniButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && apps.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-600">No applications yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Approving an application promotes the user to Dealer role. An email notification will be sent.</p>
        </CardContent>
      </Card>
    </div>
  )
}
