'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getDealerStats, getDealerInventory, getDealerMetrics } from '@/lib/api/dealers'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Package, DollarSign, Users, ShoppingCart } from 'lucide-react'

const COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#86efac']

export default function DealerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDealerData()
  }, [])

  async function loadDealerData() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Load dealer stats
      const dealerStats = await getDealerStats(user.id)
      setStats(dealerStats)

      // Load dealer inventory
      const dealerInventory = await getDealerInventory(user.id)
      setInventory(dealerInventory || [])

      // Load last 6 months metrics
      const currentDate = new Date()
      const metricsData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const metrics = await getDealerMetrics(user.id, date.getFullYear(), date.getMonth() + 1)
        if (metrics && metrics.length > 0) {
          metricsData.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            sales: metrics[0].monthly_sales || 0,
            revenue: (metrics[0].monthly_revenue || 0) / 1000,
            inventory: metrics[0].total_inventory || 0
          })
        } else {
          metricsData.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            sales: 0,
            revenue: 0,
            inventory: 0
          })
        }
      }
      setMonthlyMetrics(metricsData)
    } catch (err: any) {
      console.error('Error loading dealer data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dealer dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading dashboard: {error}
      </div>
    )
  }

  const currentMetrics = stats?.current || {}
  const growth = stats?.growth || {}
  const inventoryStats = stats?.inventory || {}
  // Prepare inventory data for charts
  const inventoryByModel = inventory.reduce((acc: any[], item: any) => {
    if (item.vehicle) {
      acc.push({
        name: item.vehicle.name,
        units: item.quantity || 0,
        reserved: item.reserved_quantity || 0,
        sold: item.sold_quantity || 0
      })
    }
    return acc
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dealer Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          label="Monthly Sales" 
          value={currentMetrics.monthly_sales || 0}
          prefix=""
          suffix=" units"
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={growth?.sales}
        />
        <KPICard 
          label="Monthly Revenue" 
          value={currentMetrics.monthly_revenue || 0}
          prefix="₹"
          suffix=""
          icon={<DollarSign className="h-5 w-5" />}
          trend={growth?.revenue}
          format
        />
        <KPICard 
          label="Total Inventory" 
          value={inventoryStats.total || 0}
          prefix=""
          suffix=" units"
          icon={<Package className="h-5 w-5" />}
          subtext={`${inventoryStats.available || 0} available`}
        />
        <KPICard 
          label="Conversion Rate" 
          value={currentMetrics.conversion_rate || 0}
          prefix=""
          suffix="%"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales & Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {monthlyMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyMetrics}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => {
                    if (name === 'Revenue (₹K)') return `₹${value}K`
                    return value
                  }} />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" fill="#d1fae5" name="Sales (units)" />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" fill="#bbf7d0" name="Revenue (₹K)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Model</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {inventoryByModel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryByModel}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="units" fill="#10b981" name="Available" />
                  <Bar dataKey="reserved" fill="#fbbf24" name="Reserved" />
                  <Bar dataKey="sold" fill="#3b82f6" name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No inventory data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Details and Performance */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {inventory.length > 0 ? (
              <div className="space-y-3">
                {inventory.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{item.vehicle?.name}</div>
                      <div className="text-sm text-gray-600">
                        Stock: {item.quantity} | Reserved: {item.reserved_quantity || 0}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-600">
                        ₹{item.dealer_price || item.vehicle?.price || 0}
                      </div>
                    </div>
                  </div>
                ))}
                {inventory.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    And {inventory.length - 5} more items...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No inventory items found
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Inventory Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {inventoryByModel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={inventoryByModel} 
                    dataKey="units" 
                    nameKey="name" 
                    innerRadius={45} 
                    outerRadius={80} 
                    paddingAngle={4}
                  >
                    {inventoryByModel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No inventory data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-2">
        <OmniButton variant="secondary">Download Monthly Report</OmniButton>
        <OmniButton variant="outline">Manage Inventory</OmniButton>
        <OmniButton variant="outline">View All Orders</OmniButton>
      </div>
    </div>
  )
}

function KPICard({ 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  icon, 
  trend, 
  subtext,
  format = false 
}: { 
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  trend?: number | null
  subtext?: string
  format?: boolean
}) {
  const displayValue = format ? value.toLocaleString('en-IN') : value
  
  return (
    <Card className="hover:shadow-sm transition">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{label}</div>
            <div className="text-2xl font-bold">
              {prefix}{displayValue}{suffix}
            </div>
            {trend !== null && trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
            {subtext && (
              <div className="text-xs text-gray-500 mt-1">{subtext}</div>
            )}
          </div>
          {icon && (
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
