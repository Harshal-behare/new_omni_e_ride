'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderTracker } from '@/components/orders/order-tracker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Eye, ShoppingCart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface Order {
  id: string
  vehicle_id: string
  quantity: number
  unit_price: number
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  vehicles?: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Failed to fetch orders')
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while loading orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleTrackOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setActiveTab('track')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Link href="/vehicles">
          <Button>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shop Vehicles
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Order List</TabsTrigger>
          <TabsTrigger value="track">Track Order</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link href="/vehicles">
                    <Button variant="outline">Browse Vehicles</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-3 px-2">Order ID</th>
                        <th className="py-3 px-2">Vehicle</th>
                        <th className="py-3 px-2">Qty</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Payment</th>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2 text-right">Amount</th>
                        <th className="py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <span className="font-mono text-xs">
                              {order.id.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {order.vehicles?.images?.[0] && (
                                <img
                                  src={order.vehicles.images[0]}
                                  alt={order.vehicles.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span className="font-medium">
                                {order.vehicles?.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2">{order.quantity}</td>
                          <td className="py-3 px-2">
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {getPaymentStatusBadge(order.payment_status)}
                          </td>
                          <td className="py-3 px-2">
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">
                            ₹{order.total_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTrackOrder(order.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Track
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {orders.length > 0 && (
                <p className="mt-4 text-xs text-gray-600">
                  Order documents and invoices will be sent via email.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="track" className="mt-6">
          <OrderTracker orderId={selectedOrderId || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
