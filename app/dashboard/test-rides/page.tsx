'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { getUserTestRides, payForTestRide, TestRide } from '@/lib/stores/test-rides'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import Link from 'next/link'

export default function TestRidesPage() {
  const { user } = useDemoAuth()
  const [rides, setRides] = React.useState<TestRide[]>([])

  React.useEffect(() => {
    if (user?.email) setRides(getUserTestRides(user.email))
  }, [user])

  function refresh() {
    if (user?.email) setRides(getUserTestRides(user.email))
  }

  function pay(id: string) {
    // Simulate payment success.
    payForTestRide(id)
    refresh()
    alert('Payment successful. A receipt will be emailed to you.')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Rides</h1>
        <Link href="/dashboard/test-rides/new"><OmniButton>Book New Test Ride</OmniButton></Link>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>My Test Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Ref</th>
                  <th>Model</th>
                  <th>Dealer</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.id}</td>
                    <td>{r.modelName}</td>
                    <td>{r.dealerName}</td>
                    <td>{r.date}</td>
                    <td>{r.time}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.payment.status === 'Paid' ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Paid</span>
                      ) : (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">Pending ₹{r.payment.amount.toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.payment.status === 'Pending' && (
                        <OmniButton size="sm" onClick={() => pay(r.id)}>
                          Pay ₹{r.payment.amount.toLocaleString('en-IN')}
                        </OmniButton>
                      )}
                    </td>
                  </tr>
                ))}
                {rides.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-600">No test rides yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Note: Payment receipts and any test ride documents will be sent to your email.</p>
        </CardContent>
      </Card>
    </div>
  )
}
