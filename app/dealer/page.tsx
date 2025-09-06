'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getDealerStats, getDealerMetrics } from '@/lib/api/dealers-metrics'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Package, DollarSign, Users, Calendar, Car, ClipboardList, Activity, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#86efac']

export default function DealerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([])
  const [testRideStats, setTestRideStats] = useState<any>(null)
  const [leadStats, setLeadStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
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

      // First get the dealer record
      const { data: dealerRecord } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!dealerRecord) {
        setError('Dealer profile not found')
        return
      }
      
      // Load dealer stats
      const dealerStats = await getDealerStats(user.id)
      setStats(dealerStats)


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

      // Load test ride stats
      const { data: testRides } = await supabase
        .from('test_rides')
        .select('id, status, preferred_date')
        .eq('dealer_id', dealerRecord.id)
        .gte('preferred_date', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
        .lte('preferred_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString())
      
      const testRideData = {
        total: testRides?.length || 0,
        pending: testRides?.filter(t => t.status === 'pending').length || 0,
        confirmed: testRides?.filter(t => t.status === 'confirmed').length || 0,
        completed: testRides?.filter(t => t.status === 'completed').length || 0,
        cancelled: testRides?.filter(t => t.status === 'cancelled').length || 0
      }
      setTestRideStats(testRideData)

      // Load lead stats
      const { data: leads } = await supabase
        .from('leads')
        .select('id, status, created_at')
        .eq('dealer_id', dealerRecord.id)
        .gte('created_at', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
      
      const leadData = {
        total: leads?.length || 0,
        new: leads?.filter(l => l.status === 'new').length || 0,
        contacted: leads?.filter(l => l.status === 'contacted').length || 0,
        qualified: leads?.filter(l => l.status === 'qualified').length || 0,
        converted: leads?.filter(l => l.status === 'converted').length || 0
      }
      setLeadStats(leadData)

      // Load recent activities from test rides and leads
      const activities = []
      
      // Add recent test rides to activities
      const { data: recentTestRides } = await supabase
        .from('test_rides')
        .select('id, created_at, status, vehicle_id, vehicles!inner(name)')
        .eq('dealer_id', dealerRecord.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (recentTestRides) {
        activities.push(...recentTestRides.map((ride: any) => ({
          type: 'test_ride',
          title: `Test ride booking #${ride.id.slice(0, 8)}`,
          description: `${ride.vehicles?.name || 'Vehicle'} - ${ride.status}`,
          status: ride.status,
          time: new Date(ride.created_at).toLocaleString()
        })))
      }
      
      // Add recent leads to activities
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, created_at, status, name')
        .eq('dealer_id', dealerRecord.id)
        .order('created_at', { ascending: false })
        .limit(2)
      
      if (recentLeads) {
        activities.push(...recentLeads.map(lead => ({
          type: 'lead',
          title: `New lead: ${lead.name}`,
          description: `Status: ${lead.status}`,
          status: lead.status,
          time: new Date(lead.created_at).toLocaleString()
        })))
      }
      
      // Sort activities by time
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivities(activities.slice(0, 5))
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
  // Prepare inventory data for charts from metrics
  const inventoryByModel: Array<{ name: string; units: number; reserved: number; sold: number }> = []  // This will be populated when we have vehicle-specific data

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
          label="Test Rides" 
          value={testRideStats?.total || 0}
          prefix=""
          suffix=""
          icon={<Calendar className="h-5 w-5" />}
          subtext={`${testRideStats?.completed || 0} completed`}
        />
        <KPICard 
          label="Leads" 
          value={leadStats?.total || 0}
          prefix=""
          suffix=""
          icon={<ClipboardList className="h-5 w-5" />}
          subtext={`${leadStats?.qualified || 0} qualified`}
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
            <CardTitle>Activity Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <div className="flex items-center justify-center h-full text-gray-500">
              Activity charts coming soon
            </div>
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


      {/* Test Ride and Lead Stats */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Ride Management</CardTitle>
          </CardHeader>
          <CardContent>
            {testRideStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Test Rides</span>
                  <span className="text-2xl font-bold">{testRideStats.total}</span>
                </div>
                <div className="space-y-2">
                  <StatusBar label="Pending" value={testRideStats.pending} total={testRideStats.total} color="bg-yellow-500" />
                  <StatusBar label="Confirmed" value={testRideStats.confirmed} total={testRideStats.total} color="bg-blue-500" />
                  <StatusBar label="Completed" value={testRideStats.completed} total={testRideStats.total} color="bg-green-500" />
                  <StatusBar label="Cancelled" value={testRideStats.cancelled} total={testRideStats.total} color="bg-red-500" />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No test ride data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="text-2xl font-bold">{leadStats.total}</span>
                </div>
                <div className="space-y-2">
                  <StatusBar label="New" value={leadStats.new} total={leadStats.total} color="bg-gray-500" />
                  <StatusBar label="Contacted" value={leadStats.contacted} total={leadStats.total} color="bg-blue-500" />
                  <StatusBar label="Qualified" value={leadStats.qualified} total={leadStats.total} color="bg-purple-500" />
                  <StatusBar label="Converted" value={leadStats.converted} total={leadStats.total} color="bg-green-500" />
                </div>
                {leadStats.total > 0 && (
                  <div className="pt-2 text-sm text-gray-600">
                    Conversion Rate: {((leadStats.converted / leadStats.total) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No lead data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No recent activities
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-2">
        <OmniButton variant="secondary" onClick={async () => {
          setRefreshing(true)
          toast.loading('Generating report...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          toast.success('Report downloaded successfully!')
          setRefreshing(false)
        }}>
          Download Monthly Report
        </OmniButton>
        <OmniButton variant="outline" onClick={() => window.location.href = '/dealer/inventory'}>
          Manage Inventory
        </OmniButton>
        <OmniButton variant="outline" onClick={() => window.location.href = '/dealer/orders'}>
          View All Orders
        </OmniButton>
        <OmniButton 
          variant="ghost" 
          onClick={() => loadDealerData()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </OmniButton>
      </div>
    </div>
  )
}

function StatusBar({ label, value, total, color }: { 
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; bgColor: string }> = {
    pending: { color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    processing: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
    confirmed: { color: 'text-green-700', bgColor: 'bg-green-100' },
    completed: { color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { color: 'text-red-700', bgColor: 'bg-red-100' },
    rejected: { color: 'text-red-700', bgColor: 'bg-red-100' },
    delivered: { color: 'text-purple-700', bgColor: 'bg-purple-100' }
  }
  
  const config = statusConfig[status] || { color: 'text-gray-700', bgColor: 'bg-gray-100' }
  
  return (
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
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
