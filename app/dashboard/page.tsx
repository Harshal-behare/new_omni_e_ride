'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Badge } from '@/components/ui/badge'
import { Calendar, ShoppingBag, MapPin, FileDown, TrendingUp, Star, Loader2, Car, Clock, CheckCircle, AlertTriangle, Briefcase, Package, CreditCard, Truck } from 'lucide-react'
import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { format } from 'date-fns'

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
    order_number: string
    vehicleName: string
    vehicleImage?: string
    status: string
    payment_status: string
    orderDate: string
    amount: number
    quantity: number
    dealerName?: string
  }>
  dealerApplication: {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    submittedDate?: string
  } | null
  upcomingTestRides: Array<{
    id: string
    vehicleName: string
    vehicleImage?: string
    dealerName: string
    date: string
    time: string
    status: string
    confirmation_code?: string
    address?: string
  }>
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
      
      // Filter and sort upcoming test rides
      const upcomingTestRides = testRides
        .filter((ride: any) => {
          const rideDate = new Date(`${ride.preferred_date}T${ride.preferred_time}`)
          return rideDate > new Date() && ['pending', 'confirmed'].includes(ride.status)
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(`${a.preferred_date}T${a.preferred_time}`)
          const dateB = new Date(`${b.preferred_date}T${b.preferred_time}`)
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 3)
        .map((ride: any) => ({
          id: ride.id,
          vehicleName: ride.vehicle?.name || 'Vehicle',
          vehicleImage: ride.vehicle?.images?.[0],
          dealerName: ride.dealer?.business_name || 'Any Available Dealer',
          date: ride.preferred_date,
          time: ride.preferred_time,
          status: ride.status,
          confirmation_code: ride.confirmation_code,
          address: ride.dealer?.business_address
        }))
      
      // Format recent orders
      const formattedOrders = orders.slice(0, 3).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        vehicleName: order.vehicles?.name || 'Vehicle',
        vehicleImage: order.vehicles?.images?.[0],
        status: order.status,
        payment_status: order.payment_status,
        orderDate: order.created_at,
        amount: order.final_amount || order.total_amount,
        quantity: order.quantity || 1,
        dealerName: order.dealers?.business_name
      }))
      
      setDashboardData({
        user: {
          name: profile?.name || user?.name || 'User',
          email: profile?.email || user?.email || 'user@example.com',
          joinedDate: profile?.created_at || '2024-03-01',
          isVerified: profile?.email_verified || false
        },
        stats: {
          activeOrders: orders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length,
          upcomingTestRides: upcomingTestRides.length,
          nearestDealer: '2.4 KM', // TODO: Calculate from dealer locations
          documentsCount: 3 // TODO: Count uploaded documents
        },
        recentOrders: formattedOrders,
        dealerApplication,
        upcomingTestRides
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

  const { user: userData, stats, recentOrders, dealerApplication, upcomingTestRides } = dashboardData
  const firstName = userData.name.split(' ')[0]
  
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getTestRideStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
          {/* Upcoming Test Rides */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Test Rides</CardTitle>
                {upcomingTestRides.length > 0 && (
                  <Badge variant="secondary">{upcomingTestRides.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTestRides.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">No upcoming test rides</p>
                  <Link href="/dashboard/vehicles">
                    <OmniButton size="sm">Book Test Ride</OmniButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTestRides.map((ride) => (
                    <div key={ride.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {ride.vehicleImage && (
                            <img 
                              src={ride.vehicleImage} 
                              alt={ride.vehicleName} 
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{ride.vehicleName}</h4>
                            <p className="text-sm text-gray-600">{ride.dealerName}</p>
                            {ride.address && (
                              <p className="text-xs text-gray-500 mt-1">{ride.address}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getTestRideStatusColor(ride.status)}>
                          {ride.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(ride.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {ride.time}
                        </div>
                      </div>
                      {ride.confirmation_code && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Booking ID: </span>
                          <span className="text-xs font-mono">{ride.confirmation_code}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard/test-rides" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View all test rides →
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                {recentOrders.length > 0 && (
                  <Badge variant="secondary">{stats.activeOrders} active</Badge>
                )}
              </div>
            </CardHeader>
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
                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {order.vehicleImage && (
                            <img 
                              src={order.vehicleImage} 
                              alt={order.vehicleName} 
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {order.vehicleName} 
                              {order.quantity > 1 && (
                                <span className="text-sm text-gray-600">×{order.quantity}</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                            </p>
                            {order.dealerName && (
                              <p className="text-xs text-gray-500 mt-1">
                                Dealer: {order.dealerName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            ₹{order.amount.toLocaleString('en-IN')}
                          </p>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          {order.payment_status === 'completed' ? (
                            <>
                              <CreditCard className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Paid</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Payment {order.payment_status}</span>
                            </>
                          )}
                        </div>
                        {order.status === 'shipped' && (
                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Truck className="h-4 w-4" />
                            <span>In Transit</span>
                          </div>
                        )}
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
