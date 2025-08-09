'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { dealerKPIs, salesMonthly, topModels, recentOrders } from '@/lib/demo'
import { OmniButton } from '@/components/ui/omni-button'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#10b981', '#059669', '#34d399']

export default function DealerOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dealer Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Today’s Test Rides" value={String(dealerKPIs.todayTestRides)} />
        <KPI label="Pending Orders" value={String(dealerKPIs.pendingOrders)} />
        <KPI label="Monthly Sales" value={`₹${dealerKPIs.monthlySales.toLocaleString('en-IN')}`} />
        <KPI label="New Inquiries" value={String(dealerKPIs.inquiries)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales & Profit (Monthly)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesMonthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#10b981" fill="#d1fae5" name="Sales (units)" />
                <Area type="monotone" dataKey="profit" stroke="#059669" fill="#bbf7d0" name="Profit (₹x1000)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Models (Units)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topModels}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-600"><th>Order</th><th>Customer</th><th>Model</th><th className="text-right">Value</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{o.model}</td>
                    <td className="text-right">₹{o.value.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sales Share</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topModels} dataKey="units" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                  {topModels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <OmniButton variant="secondary">Download Monthly Report</OmniButton>
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
