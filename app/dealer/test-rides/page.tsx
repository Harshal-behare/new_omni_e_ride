'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, Car, CheckCircle, 
  XCircle, AlertCircle, Loader2, Filter, Settings, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { AvailabilitySettingsModal } from '@/components/dealer/availability-settings-modal'

interface TestRideData {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  vehicle: {
    id: string
    name: string
    model: string
    images: string[]
    price: number
  }
  preferred_date: string
  preferred_time: string
  alternate_date?: string
  alternate_time?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  dealer_notes?: string
  confirmed_date?: string
  confirmed_time?: string
  cancellation_reason?: string
  created_at: string
}

export default function DealerTestRidesPage() {
  const [testRides, setTestRides] = useState<TestRideData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRide, setSelectedRide] = useState<TestRideData | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [dealerNotes, setDealerNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [showAvailabilitySettings, setShowAvailabilitySettings] = useState(false)
  const [expandedRide, setExpandedRide] = useState<string | null>(null)

  useEffect(() => {
    fetchTestRides()
  }, [])

  const fetchTestRides = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const response = await fetch('/api/dealer/test-rides')
      if (response.ok) {
        const data = await response.json()
        setTestRides(data.testRides || [])
      } else {
        toast.error('Failed to load test rides')
      }
    } catch (error) {
      console.error('Error fetching test rides:', error)
      toast.error('Error loading test rides')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleApprove = async (ride: TestRideData) => {
    try {
      const response = await fetch('/api/dealer/test-rides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRideId: ride.id,
          status: 'confirmed',
          confirmed_date: ride.preferred_date,
          confirmed_time: ride.preferred_time,
          dealer_notes: dealerNotes
        })
      })

      if (response.ok) {
        toast.success('Test ride approved successfully')
        await fetchTestRides()
        setSelectedRide(null)
        setDealerNotes('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve test ride')
      }
    } catch (error) {
      console.error('Error approving test ride:', error)
      toast.error('Failed to approve test ride')
    }
  }

  const handleReject = async (ride: TestRideData) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      const response = await fetch('/api/dealer/test-rides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRideId: ride.id,
          status: 'cancelled',
          rejection_reason: rejectionReason,
          dealer_notes: dealerNotes
        })
      })

      if (response.ok) {
        toast.success('Test ride rejected')
        await fetchTestRides()
        setSelectedRide(null)
        setRejectionReason('')
        setDealerNotes('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject test ride')
      }
    } catch (error) {
      console.error('Error rejecting test ride:', error)
      toast.error('Failed to reject test ride')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filteredRides = testRides.filter(ride => {
    if (filter === 'all') return true
    return ride.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Test Ride Management</h1>
          <p className="text-gray-600">Manage customer test ride requests</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTestRides(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAvailabilitySettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Availability Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{testRides.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {testRides.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {testRides.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {testRides.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <Car className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              filter === status
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${testRides.length})`}
            {status !== 'all' && ` (${testRides.filter(r => r.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Test Rides List */}
      {filteredRides.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Test Rides Found</h3>
            <p className="text-gray-600">No test rides match the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRides.map(ride => (
            <Card key={ride.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedRide(expandedRide === ride.id ? null : ride.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Vehicle Image */}
                      {ride.vehicle?.images?.[0] && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={ride.vehicle.images[0]}
                            alt={ride.vehicle.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Basic Info */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{ride.vehicle?.name}</h3>
                          {getStatusBadge(ride.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ride.user?.name || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(ride.preferred_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {ride.preferred_time}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {ride.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRide(ride)
                              handleApprove(ride)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRide(ride)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {expandedRide === ride.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedRide === ride.id && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Customer Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{ride.user?.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{ride.user?.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>
                              {ride.user?.address || 'Address not provided'}
                              {ride.user?.city && `, ${ride.user.city}`}
                              {ride.user?.state && `, ${ride.user.state}`}
                              {ride.user?.pincode && ` - ${ride.user.pincode}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Additional Information</h4>
                        <div className="space-y-2 text-sm">
                          {ride.alternate_date && (
                            <p>
                              <span className="text-gray-600">Alternate Date:</span>{' '}
                              {format(new Date(ride.alternate_date), 'PPP')} at {ride.alternate_time}
                            </p>
                          )}
                          {ride.notes && (
                            <p>
                              <span className="text-gray-600">Customer Notes:</span>{' '}
                              {ride.notes}
                            </p>
                          )}
                          {ride.dealer_notes && (
                            <p>
                              <span className="text-gray-600">Dealer Notes:</span>{' '}
                              {ride.dealer_notes}
                            </p>
                          )}
                          {ride.cancellation_reason && (
                            <p>
                              <span className="text-gray-600">Cancellation Reason:</span>{' '}
                              {ride.cancellation_reason}
                            </p>
                          )}
                          <p>
                            <span className="text-gray-600">Requested on:</span>{' '}
                            {format(new Date(ride.created_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRide && selectedRide.status === 'pending' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Test Ride</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Reason for Rejection *</label>
                  <textarea
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <textarea
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    rows={2}
                    placeholder="Any additional notes..."
                    value={dealerNotes}
                    onChange={(e) => setDealerNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <OmniButton
                    variant="destructive"
                    onClick={() => handleReject(selectedRide)}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Test Ride
                  </OmniButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRide(null)
                      setRejectionReason('')
                      setDealerNotes('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Availability Settings Modal */}
      <AvailabilitySettingsModal
        isOpen={showAvailabilitySettings}
        onClose={() => setShowAvailabilitySettings(false)}
      />
    </div>
  )
}
