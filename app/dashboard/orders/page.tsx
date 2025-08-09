'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { getUserOrders, Order } from '@/lib/stores/orders'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function OrdersPage() {
  const { user } = useDemoAuth()
  const [orders, setOrders] = React.useState<Order[]>([])

  React.useEffect(() => {
    if (user?.email) setOrders(getUserOrders(user.email))
  }, [user])

  return (
    <div>
      <h1 className="text-2xl font-bold">My Orders</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr className="text-left text-gray-600"><th className="py-2">Order #</th><th>Model</th><th>Status</th><th>Placed</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.id}</td>
                    <td>{o.modelName}</td>
                    <td>{o.status}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">₹{o.value.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-600">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Order documents will be sent via email.</p>
        </CardContent>
      </Card>
    </div>
  )
}
