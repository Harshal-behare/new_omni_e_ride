'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Car, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface TestRideData {
  id: string
  vehicle?: {
    name: string
    images: string[]
  }
  dealer?: {
    name: string
    city: string
  }
  scheduled_date: string
  scheduled_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
  rejection_reason?: string
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_amount: number
}

export default function TestRidesPage() {
  const [rides, setRides] = React.useState<TestRideData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  React.useEffect(() => {
    fetchTestRides()
  }, [])

  const fetchTestRides = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const response = await fetch('/api/test-rides/user')
      if (response.ok) {
        const data = await response.json()
        setRides(data.testRides || [])
      } else {
        console.error('Failed to fetch test rides')
        toast.error('Failed to load test rides')
      }
    } catch (error) {
      console.error('Error fetching test rides:', error)
      toast.error('Error loading test rides')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleCancelRide = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this test ride?')) return
    
    try {
      const response = await fetch(`/api/test-rides/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      
      if (response.ok) {
        toast.success('Test ride cancelled successfully')
        fetchTestRides()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel test ride')
      }
    } catch (error) {
      console.error('Error cancelling test ride:', error)
      toast.error('Failed to cancel test ride')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test rides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Rides</h1>
          <p className="text-gray-600">Manage your vehicle test ride bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTestRides(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/dashboard/test-rides/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book New Test Ride
            </Button>
          </Link>
        </div>
      </div>

      {/* Test Rides List */}
      {rides.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Test Rides Yet</h3>
            <p className="text-gray-600 mb-6">Book your first test ride to experience our amazing vehicles</p>
            <Link href="/dashboard/test-rides/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Book Your First Test Ride
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {/* Vehicle Image */}
                    {ride.vehicle?.images?.[0] && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={ride.vehicle.images[0]}
                          alt={ride.vehicle.name || 'Vehicle'}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Ride Details */}
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {ride.vehicle?.name || 'Vehicle'}
                        </h3>
                        <p className="text-sm text-gray-600">Booking ID: {ride.id}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{format(new Date(ride.scheduled_date), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{ride.scheduled_time}</span>
                        </div>
                        {ride.dealer && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{ride.dealer.name}, {ride.dealer.city}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(ride.status)}>
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </Badge>
                        <Badge className={getPaymentStatusColor(ride.payment_status)}>
                          Payment {ride.payment_status.charAt(0).toUpperCase() + ride.payment_status.slice(1)}
                        </Badge>
                      </div>
                      
                      {ride.status === 'rejected' && ride.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Rejection Reason:</span> {ride.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Deposit</p>
                      <p className="text-lg font-semibold">₹{ride.payment_amount.toLocaleString('en-IN')}</p>
                    </div>
                    
                    {ride.status === 'pending' || ride.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRide(ride.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-600 text-center">
        Note: Payment receipts and test ride confirmations will be sent to your registered email.
      </p>
    </div>
  )
}
