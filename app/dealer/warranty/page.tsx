'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { WarrantyRegistrationForm } from '@/components/warranty/warranty-registration-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { WarrantyStateBadge } from '@/components/warranty/status-badge'
import { toast } from 'react-hot-toast'
import { Loader2, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WarrantyRecord {
  id: string
  customer_email: string
  customer_name: string
  phone?: string
  vehicle_model: string
  model_id?: string
  vin: string
  purchase_date: string
  period_years: number
  dealer_name: string
  review_status: 'PendingReview' | 'Approved' | 'Declined'
  created_at: string
  reviewed_at?: string
  reviewer_name?: string
}

export default function DealerWarrantyPage() {
  const { user } = useDemoAuth()
  const [warranties, setWarranties] = React.useState<WarrantyRecord[]>([])
  const [dealerName, setDealerName] = React.useState('Loading...')
  const [dealerId, setDealerId] = React.useState<string>()
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchWarranties()

    // Set up real-time subscription for warranty updates
    const supabase = createClient()
    const channel = supabase
      .channel('dealer-warranty-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warranty_registrations',
          filter: `dealer_id=eq.${dealerId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Show notification for status changes
            if (payload.new && payload.old && payload.new.review_status !== payload.old?.review_status) {
              const status = payload.new.review_status
              if (status === 'Approved') {
                toast.success('Warranty approved by admin!', { icon: '✅' })
              } else if (status === 'Declined') {
                toast.error('Warranty declined by admin', { icon: '❌' })
              }
            }
            // Refresh the warranty list
            fetchWarranties()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dealerId])

  async function fetchWarranties() {
    setLoading(true)
    try {
      const response = await fetch('/api/dealer/warranties')
      if (response.ok) {
        const data = await response.json()
        setWarranties(data.warranties || [])
        setDealerName(data.dealerName || 'Unknown Dealer')
        setDealerId(data.dealerId)
      } else {
        toast.error('Failed to load warranties')
      }
    } catch (error) {
      console.error('Error fetching warranties:', error)
      toast.error('Error loading warranties')
    } finally {
      setLoading(false)
    }
  }

  function refresh() {
    fetchWarranties()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Warranty Management</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>Register Warranty</CardTitle></CardHeader>
        <CardContent>
          <WarrantyRegistrationForm
            dealerName={dealerName}
            dealerId={dealerId}
            defaultCustomer={user ? { name: user.name, email: user.email } : undefined}
            onSubmitted={() => refresh()}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="text-left text-gray-600">
                  <th className="py-2">ID</th><th>Customer</th><th>Email</th><th>Model</th><th>VIN</th><th>Period</th><th>Status</th><th>Submitted</th>
                </tr></thead>
                <tbody>
                  {warranties.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="py-2">{w.id.slice(0, 8)}</td>
                      <td>{w.customer_name}</td>
                      <td>{w.customer_email}</td>
                      <td>{w.vehicle_model}</td>
                      <td>{w.vin}</td>
                      <td>{w.period_years} yr</td>
                      <td><WarrantyStateBadge state={w.review_status} /></td>
                      <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {warranties.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-600">No submissions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
