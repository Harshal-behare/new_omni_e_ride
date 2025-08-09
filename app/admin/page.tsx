'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { salesMonthly, topModels, recentOrders } from '@/lib/demo'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Analytics</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total Users" value="5,420" />
        <KPI label="Active Dealers" value="58" />
        <KPI label="Monthly Revenue" value="₹92,00,000" />
        <KPI label="System Uptime" value="99.98%" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Platform Sales (Units)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesMonthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#10b981" fill="#d1fae5" name="Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Models</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topModels}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-600"><th>Order</th><th>Customer</th><th>Model</th><th>Status</th><th className="text-right">Value</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{o.model}</td>
                    <td>{o.status}</td>
                    <td className="text-right">₹{o.value.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="hover:shadow-sm transition">
      <CardContent className="p-5">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
