'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Copy,
  MapPin,
  CreditCard
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface OrderTimeline {
  status: string
  label: string
  completed: boolean
  date: string | null
}

interface OrderDetails {
  id: string
  status: string
  payment_status: string
  tracking_number: string | null
  quantity: number
  total_amount: number
  created_at: string
  updated_at: string
  delivered_at: string | null
  vehicle: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

interface OrderTrackingData {
  order: OrderDetails
  timeline: OrderTimeline[]
  estimated_delivery: string | null
}

export function OrderTracker({ orderId: initialOrderId }: { orderId?: string }) {
  const [orderId, setOrderId] = useState(initialOrderId || '')
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trackOrder = async (id: string) => {
    if (!id) {
      setError('Please enter an order ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/track/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error('Failed to track order')
      }

      const data = await response.json()
      setTrackingData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setTrackingData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialOrderId) {
      trackOrder(initialOrderId)
    }
  }, [initialOrderId])

  const copyOrderId = () => {
    if (trackingData?.order.id) {
      navigator.clipboard.writeText(trackingData.order.id)
      toast({
        title: 'Copied!',
        description: 'Order ID copied to clipboard',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />
      case 'confirmed':
        return <CreditCard className="h-5 w-5" />
      case 'processing':
        return <Package className="h-5 w-5" />
      case 'shipped':
        return <Truck className="h-5 w-5" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'cancelled':
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'confirmed':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-indigo-500'
      case 'shipped':
        return 'bg-purple-500'
      case 'delivered':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Track Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && trackOrder(orderId)}
            />
            <Button 
              onClick={() => trackOrder(orderId)}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              Track
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Order Details */}
      {trackingData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Details</CardTitle>
                <Badge variant={getStatusBadgeVariant(trackingData.order.status)}>
                  {trackingData.order.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{trackingData.order.id.slice(0, 8)}...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyOrderId}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vehicle</span>
                    <span className="font-medium">{trackingData.order.vehicle.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <span className="font-medium">{trackingData.order.quantity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="font-bold text-lg">₹{trackingData.order.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order Date</span>
                    <span className="text-sm">
                      {new Date(trackingData.order.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  
                  {trackingData.order.tracking_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tracking Number</span>
                      <span className="font-mono text-sm">{trackingData.order.tracking_number}</span>
                    </div>
                  )}
                  
                  {trackingData.estimated_delivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Est. Delivery</span>
                      <span className="text-sm">
                        {new Date(trackingData.estimated_delivery).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                  
                  {trackingData.order.delivered_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Delivered On</span>
                      <span className="text-sm text-green-600 font-medium">
                        {new Date(trackingData.order.delivered_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Image */}
              {trackingData.order.vehicle.images?.[0] && (
                <div className="mt-6">
                  <img
                    src={trackingData.order.vehicle.images[0]}
                    alt={trackingData.order.vehicle.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {trackingData.timeline.map((item, index) => (
                  <div key={item.status} className="flex items-start mb-8 last:mb-0">
                    <div className="relative flex items-center justify-center">
                      <div 
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${item.completed 
                            ? getStatusColor(item.status) + ' text-white' 
                            : 'bg-gray-200 text-gray-400'
                          }
                        `}
                      >
                        {getStatusIcon(item.status)}
                      </div>
                      {index < trackingData.timeline.length - 1 && (
                        <div 
                          className={`
                            absolute top-10 left-5 w-0.5 h-12 -translate-x-1/2
                            ${item.completed ? 'bg-green-500' : 'bg-gray-300'}
                          `}
                        />
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className={`font-medium ${item.completed ? '' : 'text-gray-400'}`}>
                        {item.label}
                      </h3>
                      {item.date && (
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(item.date).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          {trackingData.order.status !== 'delivered' && trackingData.order.status !== 'cancelled' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find Nearest Dealer
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                  {trackingData.order.status === 'pending' && (
                    <Button variant="destructive" size="sm">
                      Cancel Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
