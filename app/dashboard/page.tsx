'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Badge } from '@/components/ui/badge'
import { Calendar, ShoppingBag, MapPin, FileDown, TrendingUp, Star, Loader2, Car, Clock, CheckCircle, AlertTriangle, Briefcase } from 'lucide-react'
import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'

interface DashboardData {
  user: {
    name: string
    email: string
    joinedDate: string
    isVerified: boolean
  }
  stats: {
    activeOrders: number
    upcomingTestRides: number
    nearestDealer: string
    documentsCount: number
  }
  recentOrders: Array<{
    id: string
    vehicleName: string
    status: string
    orderDate: string
    amount: number
  }>
  dealerApplication: {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    submittedDate?: string
  } | null
  upcomingTestRide: {
    vehicleName: string
    dealerName: string
    date: string
    time: string
  } | null
}

export default function CustomerDashboardPage() {
  const { user } = useDemoAuth()
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const currentHour = new Date().getHours()
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  React.useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const profileResponse = await fetch('/api/profile')
      const profile = profileResponse.ok ? await profileResponse.json() : null
      
      // Fetch recent orders
      const ordersResponse = await fetch('/api/orders')
      const orders = ordersResponse.ok ? await ordersResponse.json() : []
      
      // Fetch dealer application status
      const dealerResponse = await fetch('/api/dealers/application/status')
      const dealerApplication = dealerResponse.ok ? await dealerResponse.json() : null
      
      // Fetch test rides
      const testRidesResponse = await fetch('/api/test-rides')
      const testRides = testRidesResponse.ok ? await testRidesResponse.json() : []
      
      const upcomingTestRide = testRides.find((ride: any) => 
        new Date(ride.scheduled_date) > new Date()
      )
      
      setDashboardData({
        user: {
          name: profile?.name || user?.name || 'User',
          email: profile?.email || user?.email || 'user@example.com',
          joinedDate: profile?.created_at || '2024-03-01',
          isVerified: profile?.email_verified || false
        },
        stats: {
          activeOrders: orders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length,
          upcomingTestRides: testRides.filter((r: any) => new Date(r.scheduled_date) > new Date()).length,
          nearestDealer: '2.4 KM', // TODO: Calculate from dealer locations
          documentsCount: 3 // TODO: Count uploaded documents
        },
        recentOrders: orders.slice(0, 3),
        dealerApplication,
        upcomingTestRide
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">Failed to load dashboard data. Please try again.</p>
      </div>
    )
  }

  const { user: userData, stats, recentOrders, dealerApplication, upcomingTestRide } = dashboardData
  const firstName = userData.name.split(' ')[0]

  return (
    <div>
      {/* Personalized Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <UserAvatar 
            name={userData.name}
            email={userData.email}
            size="lg"
            showOnline
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back to your dashboard. Here&apos;s what&apos;s happening with your orders and rides.
            </p>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span>Member since {new Date(userData.joinedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{recentOrders.length} orders placed</span>
          </div>
          {userData.isVerified && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Verified customer</span>
            </div>
          )}
        </div>
      </div>

      {/* Dealer Application Status Alert */}
      {dealerApplication && dealerApplication.status !== 'none' && (
        <div className="mb-6">
          <Card className={`border-l-4 ${
            dealerApplication.status === 'approved' ? 'border-l-green-500 bg-green-50' :
            dealerApplication.status === 'pending' ? 'border-l-yellow-500 bg-yellow-50' :
            'border-l-red-500 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">
                    Dealer Application Status: 
                    <Badge className={`ml-2 ${
                      dealerApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                      dealerApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {dealerApplication.status.charAt(0).toUpperCase() + dealerApplication.status.slice(1)}
                    </Badge>
                  </h3>
                  {dealerApplication.submittedDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Applied on {new Date(dealerApplication.submittedDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Orders" 
          value={stats.activeOrders.toString()}
          icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />} 
        />
        <StatCard 
          title="Upcoming Test Rides" 
          value={stats.upcomingTestRides.toString()}
          icon={<Calendar className="h-5 w-5 text-emerald-600" />} 
        />
        <StatCard 
          title="Nearest Dealer" 
          value={stats.nearestDealer}
          icon={<MapPin className="h-5 w-5 text-emerald-600" />} 
        />
        <StatCard 
          title="Documents" 
          value={stats.documentsCount.toString()}
          icon={<FileDown className="h-5 w-5 text-emerald-600" />} 
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">No orders yet</p>
                  <Link href="/dashboard/vehicles">
                    <OmniButton size="sm">Browse Vehicles</OmniButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{order.vehicleName}</h4>
                        <p className="text-sm text-gray-600">
                          Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{order.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard/orders" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View all orders →
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Test Ride */}
          <Card>
            <CardHeader><CardTitle>Upcoming Test Ride</CardTitle></CardHeader>
            <CardContent>
              {upcomingTestRide ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Car className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h4 className="font-medium">{upcomingTestRide.vehicleName}</h4>
                      <p className="text-sm text-gray-600">{upcomingTestRide.dealerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {upcomingTestRide.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {upcomingTestRide.time}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">No upcoming test rides</p>
                  <Link href="/dashboard/test-rides">
                    <OmniButton size="sm">Book Test Ride</OmniButton>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <ActivityFeed limit={6} />
        </div>
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
