'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OmniButton } from '@/components/ui/omni-button'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Image from 'next/image'
import { 
  Package, TrendingUp, DollarSign, Clock, Truck, CheckCircle,
  XCircle, Search, Filter, Download, ChevronDown, ChevronUp,
  Mail, Phone, MapPin, Calendar, CreditCard, Loader2, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
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
    price: number
    images: string[]
  }
  quantity: number
  unit_price: number
  total_amount: number
  tax_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  shipping_address: any
  notes?: string
  metadata?: any
  created_at: string
  confirmed_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  payments?: Array<{
    id: string
    amount: number
    status: string
    method: string
    created_at: string
  }>
}

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    commission: 0
  })
  const [filter, setFilter] = useState<'all' | Order['status']>('all')
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [updateNotes, setUpdateNotes] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/dealer/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || stats)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Error loading orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const body: any = { orderId, status }
      if (status === 'shipped' && trackingNumber) {
        body.trackingNumber = trackingNumber
      }
      if (updateNotes) {
        body.notes = updateNotes
      }

      const response = await fetch('/api/dealer/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(`Order status updated to ${status}`)
        await fetchOrders()
        setSelectedOrder(null)
        setTrackingNumber('')
        setUpdateNotes('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const colors = {
      paid: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = search === '' || 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(search.toLowerCase())
    
    return matchesSearch
  })

  const exportOrders = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Email', 'Vehicle', 'Amount', 'Status', 'Date'].join(','),
      ...filteredOrders.map(order => [
        order.order_number,
        order.user?.name || '',
        order.user?.email || '',
        order.vehicle?.name || '',
        order.final_amount,
        order.status,
        format(new Date(order.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Orders exported successfully')
  }

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
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-emerald-600">₹{stats.commission.toLocaleString('en-IN')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
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
              {status !== 'all' && ` (${stats[status as keyof typeof stats] || 0})`}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            className="rounded-lg border pl-9 pr-3 py-2" 
            placeholder="Search orders..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-600">No orders match your current filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Vehicle Image */}
                      {order.vehicle?.images?.[0] && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={order.vehicle.images[0]}
                            alt={order.vehicle.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.order_number}</h3>
                          {getStatusBadge(order.status)}
                          {getPaymentBadge(order.payment_status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{order.user?.name || 'Customer'}</span>
                            <br />
                            <span className="text-xs">{order.user?.email}</span>
                          </div>
                          <div>
                            <span className="font-medium">{order.vehicle?.name}</span>
                            <br />
                            <span className="text-xs">Qty: {order.quantity}</span>
                          </div>
                          <div>
                            <span className="font-medium">₹{order.final_amount.toLocaleString('en-IN')}</span>
                            <br />
                            <span className="text-xs">{format(new Date(order.created_at), 'dd MMM yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Customer Details */}
                      <div>
                        <h4 className="font-medium mb-3">Customer Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{order.user?.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{order.user?.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              {order.shipping_address?.address || order.user?.address || 'Not provided'}
                              {order.shipping_address?.city && `, ${order.shipping_address.city}`}
                              {order.shipping_address?.state && `, ${order.shipping_address.state}`}
                              {order.shipping_address?.pincode && ` - ${order.shipping_address.pincode}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Details */}
                      <div>
                        <h4 className="font-medium mb-3">Order Details</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600">Payment Method:</span>{' '}
                            {order.payment_method || 'Not specified'}
                          </p>
                          <p>
                            <span className="text-gray-600">Subtotal:</span>{' '}
                            ₹{order.total_amount.toLocaleString('en-IN')}
                          </p>
                          <p>
                            <span className="text-gray-600">Tax:</span>{' '}
                            ₹{order.tax_amount.toLocaleString('en-IN')}
                          </p>
                          {order.discount_amount > 0 && (
                            <p>
                              <span className="text-gray-600">Discount:</span>{' '}
                              -₹{order.discount_amount.toLocaleString('en-IN')}
                            </p>
                          )}
                          <p className="font-medium">
                            <span className="text-gray-600">Total:</span>{' '}
                            ₹{order.final_amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Timeline & Actions */}
                      <div>
                        <h4 className="font-medium mb-3">Timeline</h4>
                        <div className="space-y-2 text-sm mb-4">
                          <p>
                            <span className="text-gray-600">Ordered:</span>{' '}
                            {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                          </p>
                          {order.confirmed_at && (
                            <p>
                              <span className="text-gray-600">Confirmed:</span>{' '}
                              {format(new Date(order.confirmed_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                          )}
                          {order.shipped_at && (
                            <p>
                              <span className="text-gray-600">Shipped:</span>{' '}
                              {format(new Date(order.shipped_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                          )}
                          {order.delivered_at && (
                            <p>
                              <span className="text-gray-600">Delivered:</span>{' '}
                              {format(new Date(order.delivered_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                          )}
                          {order.metadata?.tracking_number && (
                            <p>
                              <span className="text-gray-600">Tracking:</span>{' '}
                              <span className="font-medium">{order.metadata.tracking_number}</span>
                            </p>
                          )}
                        </div>
                        
                        {/* Status Update Actions */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Update Status</h5>
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateOrderStatus(order.id, 'processing')
                                }}
                              >
                                Mark as Processing
                              </Button>
                            )}
                            {order.status === 'processing' && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrder(order)
                                }}
                              >
                                Mark as Shipped
                              </Button>
                            )}
                            {order.status === 'shipped' && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateOrderStatus(order.id, 'delivered')
                                }}
                              >
                                Mark as Delivered
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Notes:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ship Order Modal */}
      {selectedOrder && selectedOrder.status === 'processing' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ship Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tracking Number (Optional)</label>
                  <input
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    placeholder="Enter tracking number..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <textarea
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    rows={2}
                    placeholder="Any additional notes..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <OmniButton
                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  >
                    Mark as Shipped
                  </OmniButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrder(null)
                      setTrackingNumber('')
                      setUpdateNotes('')
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
    </div>
  )
}
