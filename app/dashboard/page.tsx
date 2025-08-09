'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { recentOrders, testRides } from '@/lib/demo'
import { Calendar, ShoppingBag, MapPin, FileDown, BadgePlus } from 'lucide-react'

export default function CustomerDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Your Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Orders" value="1" icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />} />
        <StatCard title="Upcoming Test Rides" value="1" icon={<Calendar className="h-5 w-5 text-emerald-600" />} />
        <StatCard title="Nearest Dealer" value="2.4 KM" icon={<MapPin className="h-5 w-5 text-emerald-600" />} />
        <StatCard title="Documents" value="3" icon={<FileDown className="h-5 w-5 text-emerald-600" />} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-600"><th>Order</th><th>Model</th><th>Status</th><th className="text-right">Value</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.id}</td>
                    <td>{o.model}</td>
                    <td>{o.status}</td>
                    <td className="text-right">₹{o.value.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming Test Ride</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-700">
            {testRides[0] ? (
              <div>
                <div className="font-semibold">{testRides[0].model}</div>
                <div>{testRides[0].dealer}</div>
                <div>{testRides[0].date} at {testRides[0].time}</div>
                <div className="mt-2">
                  <Link href="/dashboard/test-rides" className="text-emerald-700 hover:underline">Manage</Link>
                </div>
              </div>
            ) : 'No upcoming rides'}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/test-rides"><OmniButton>Book Test Ride</OmniButton></Link>
            <Link href="/dashboard/orders"><OmniButton variant="secondary">Track Orders</OmniButton></Link>
            <Link href="/dealers"><OmniButton variant="outline">Find Dealers</OmniButton></Link>
            <Link href="/profile"><OmniButton variant="ghost">Update Profile</OmniButton></Link>
            <Link href="/dashboard/dealer-application"><OmniButton startIcon={<BadgePlus className="h-4 w-4" />}>Become a Dealer</OmniButton></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-sm transition">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
