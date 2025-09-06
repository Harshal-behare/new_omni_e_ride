'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WarrantyTimeline } from '@/components/warranty/warranty-timeline'
import { WarrantyButton } from '@/components/warranty/warranty-button'
import { Loader2, CheckCircle2, XCircle, Calendar, Car, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

interface WarrantyData {
  id: string
  customer_name: string
  customer_email: string
  vehicle_model: string
  vin: string
  purchase_date: string
  period_years: number
  dealer_name: string
  expiry_date: string
  is_expired: boolean
  days_remaining: number
  status: 'Active' | 'Expired'
}

export default function CustomerWarrantyPage() {
  const { user } = useDemoAuth()
  const [warranties, setWarranties] = React.useState<WarrantyData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (user?.email) {
      fetchWarranties(user.email)
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchWarranties(email: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/public/warranty/check?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      
      if (response.ok && data.warranties) {
        setWarranties(data.warranties)
      } else {
        setWarranties([])
      }
    } catch (error) {
      console.error('Error fetching warranties:', error)
      toast.error('Failed to load warranties')
      setWarranties([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">My Warranties</h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4">
            {warranties.map((warranty) => (
              <Card key={warranty.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {warranty.vehicle_model}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">VIN: {warranty.vin}</p>
                    </div>
                    <Badge className={warranty.is_expired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                      {warranty.is_expired ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Expired
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Purchase Date</p>
                        <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Warranty Period</p>
                        <p className="font-medium">{warranty.period_years} Year{warranty.period_years > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Expiry Date</p>
                        <p className="font-medium">{new Date(warranty.expiry_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">Dealer:</span> {warranty.dealer_name}
                  </div>
                  
                  {!warranty.is_expired && warranty.days_remaining <= 90 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800">
                        <strong>Warranty expiring soon!</strong> {warranty.days_remaining} days remaining
                      </p>
                    </div>
                  )}
                  
                  {warranty.is_expired && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Warranty expired</strong> on {new Date(warranty.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <WarrantyButton
                      purchaseDate={warranty.purchase_date}
                      periodYears={warranty.period_years as 1 | 2 | 3}
                      showProgress
                      tooltip="Download your certificate"
                      confirm={{ title: 'Download Certificate', message: 'Generate a print-ready warranty certificate?' }}
                      onClick={() => alert('Certificate download feature coming soon!')}
                    >
                      Download Certificate
                    </WarrantyButton>
                    {!warranty.is_expired && (
                      <>
                        <WarrantyButton variant="renew" tooltip="Renew your warranty" onClick={() => alert('Warranty renewal feature coming soon!')}>
                          Renew Warranty
                        </WarrantyButton>
                        <WarrantyButton variant="warranty" tooltip="Submit a warranty claim" onClick={() => alert('Claim submission feature coming soon!')}>
                          Submit Claim
                        </WarrantyButton>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {warranties.length === 0 && (
              <Card>
                <CardHeader><CardTitle>No Warranties Found</CardTitle></CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <p>You don't have any warranties registered yet.</p>
                  <p className="mt-2">When your dealer submits a warranty and it's approved by admin, it will appear here with live status updates.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {warranties.length > 0 && warranties[0] && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Warranty Timeline</CardTitle></CardHeader>
              <CardContent>
                <WarrantyTimeline 
                  purchaseDate={warranties[0].purchase_date} 
                  years={warranties[0].period_years as 1 | 2 | 3} 
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
