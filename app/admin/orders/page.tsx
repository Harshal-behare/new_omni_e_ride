'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  Calendar, Filter, ChevronLeft, ChevronRight, Search, 
  Package, Truck, CheckCircle, XCircle, Clock, DollarSign,
  User, MapPin, Phone, Mail, Download, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Order {
  id: string
  order_number: string
  user_id: string
  dealer_id?: string
  vehicle_id: string
  quantity: number
  unit_price: number
  total_amount: number
  tax_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address: any
  billing_address?: any
  notes?: string
  confirmed_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string
    city?: string
    state?: string
  }
  vehicle?: {
    id: string
    name: string
    model: string
    price: number
    images?: string[]
  }
  dealer?: {
    id: string
    business_name: string
    city: string
    state: string
  }
  payments?: Array<{
    id: string
    amount: number
    status: string
    method: string
    created_at: string
  }>
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [filters, setFilters] = React.useState({
    city: '',
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  })
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })
  const [cities, setCities] = React.useState<string[]>([])
  const [updating, setUpdating] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchOrders()
  }, [pagination.page, filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.city && { city: filters.city }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      
      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data.orders)
      setCities(data.cities || [])
      setPagination(prev => ({
        ...prev,
        total: data.count,
        totalPages: data.totalPages
      }))
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdating(orderId)
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update order')
      }
      
      toast.success('Order status updated successfully')
      await fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <Package className="h-3 w-3" /> },
      processing: { color: 'bg-purple-100 text-purple-800', icon: <Package className="h-3 w-3" /> },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="h-3 w-3" /> },
      delivered: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null }
    
    return (
      <Badge className={cn('flex items-center gap-1', config.color)}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={statusConfig[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.user?.name?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower) ||
        order.vehicle?.name?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <Button 
          variant="outline"
          onClick={() => fetchOrders()}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            
            <Select 
              value={filters.city} 
              onValueChange={(value) => setFilters({ ...filters, city: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-sm text-gray-500">ID: {order.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">{order.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.user?.email}</div>
                      {order.user?.city && (
                        <div className="text-xs text-gray-400">{order.user.city}, {order.user.state}</div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {order.vehicle?.images?.[0] && (
                          <Image
                            src={order.vehicle.images[0]}
                            alt={order.vehicle.name}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{order.vehicle?.name}</div>
                          <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">₹{order.final_amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {order.payment_method || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4">
                      {getPaymentBadge(order.payment_status)}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4">
                      <div className="text-sm">
                        {format(new Date(order.created_at), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(order.created_at), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            disabled={updating === order.id}
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            disabled={updating === order.id}
                          >
                            Process
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                          >
                            Ship
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder.order_number}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedOrder.user?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedOrder.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedOrder.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">
                      {selectedOrder.user?.city}, {selectedOrder.user?.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Vehicle Details
                </h3>
                <div className="flex gap-4">
                  {selectedOrder.vehicle?.images?.[0] && (
                    <Image
                      src={selectedOrder.vehicle.images[0]}
                      alt={selectedOrder.vehicle.name}
                      width={120}
                      height={120}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-lg">{selectedOrder.vehicle?.name}</p>
                    <p className="text-gray-600">Model: {selectedOrder.vehicle?.model}</p>
                    <p className="text-gray-600">Quantity: {selectedOrder.quantity}</p>
                    <p className="text-gray-600">Unit Price: ₹{selectedOrder.unit_price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">₹{selectedOrder.tax_amount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-₹{selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span>₹{selectedOrder.final_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h3>
                <div className="text-sm">
                  <p>{selectedOrder.shipping_address?.line1}</p>
                  {selectedOrder.shipping_address?.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                  <p>
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - 
                    {selectedOrder.shipping_address?.pincode}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Order Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Order placed on {format(new Date(selectedOrder.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                  {selectedOrder.confirmed_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Confirmed on {format(new Date(selectedOrder.confirmed_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  )}
                  {selectedOrder.shipped_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Shipped on {format(new Date(selectedOrder.shipped_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  )}
                  {selectedOrder.delivered_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Delivered on {format(new Date(selectedOrder.delivered_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  )}
                  {selectedOrder.cancelled_at && (
                    <div className="flex items-center gap-3">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Cancelled on {format(new Date(selectedOrder.cancelled_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
