'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Phone, Mail } from 'lucide-react'

interface Dealer {
  id: string
  user_id: string
  business_name: string
  business_address: string
  business_phone: string
  business_email?: string
  gst_number?: string
  pan_number?: string
  city: string
  state: string
  pincode: string
  status: string
  commission_rate: number
  created_at: string
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function AdminDealersPage() {
  const [dealers, setDealers] = React.useState<Dealer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDealer, setSelectedDealer] = React.useState<Dealer | null>(null)

  const fetchDealers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dealers')
      if (!response.ok) {
        throw new Error('Failed to fetch dealers')
      }
      const data = await response.json()
      setDealers(data)
    } catch (error) {
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDealers()
  }, [fetchDealers])

  return (
    <div>
      <h1 className="text-2xl font-bold">Dealers Network</h1>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Active Dealers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-gray-600">Loading dealers...</div>
          ) : dealers.length === 0 ? (
            <div className="py-6 text-center text-gray-600">No dealers found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dealers.map((dealer) => (
                <div
                  key={dealer.id}
                  className="rounded-lg border p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDealer(dealer)}
                >
                  <h3 className="font-semibold text-lg">{dealer.business_name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{dealer.city}, {dealer.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{dealer.business_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{dealer.user?.email}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      dealer.status === 'approved' ? 'bg-green-100 text-green-800' :
                      dealer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {dealer.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Commission: {dealer.commission_rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDealer} onOpenChange={() => setSelectedDealer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDealer?.business_name}</DialogTitle>
          </DialogHeader>
          {selectedDealer && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Owner: </span>
                      <span>{selectedDealer.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email: </span>
                      <span>{selectedDealer.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone: </span>
                      <span>{selectedDealer.user?.phone}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Business Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Business Phone: </span>
                      <span>{selectedDealer.business_phone}</span>
                    </div>
                    {selectedDealer.business_email && (
                      <div>
                        <span className="text-gray-600">Business Email: </span>
                        <span>{selectedDealer.business_email}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Commission Rate: </span>
                      <span>{selectedDealer.commission_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Address</h4>
                <p className="text-sm">
                  {selectedDealer.business_address}<br />
                  {selectedDealer.city}, {selectedDealer.state} - {selectedDealer.pincode}
                </p>
              </div>

              {(selectedDealer.gst_number || selectedDealer.pan_number) && (
                <div>
                  <h4 className="font-semibold mb-2">Tax Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedDealer.gst_number && (
                      <div>
                        <span className="text-gray-600">GST Number: </span>
                        <span>{selectedDealer.gst_number}</span>
                      </div>
                    )}
                    {selectedDealer.pan_number && (
                      <div>
                        <span className="text-gray-600">PAN Number: </span>
                        <span>{selectedDealer.pan_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Joined: {new Date(selectedDealer.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedDealer.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedDealer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedDealer.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
