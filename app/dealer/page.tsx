'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { createClient } from '@/lib/supabase/client'
import { Package, DollarSign, Car, ClipboardList, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DealerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leadsCount, setLeadsCount] = useState<number>(0)
  const [modelsCount, setModelsCount] = useState<number>(0)
  const [warrantyCount, setWarrantyCount] = useState<number>(0)
  const [ordersCount, setOrdersCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDealerData()
  }, [])

  async function loadDealerData() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      // First get the dealer record
      const { data: dealerRecord } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!dealerRecord) {
        setError('Dealer profile not found')
        return
      }
      
      // Load leads count
      const { count: leadsTotal } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealerRecord.id)
      setLeadsCount(leadsTotal || 0)

      // Load unique vehicle models count from orders
      const { data: orderVehicles } = await supabase
        .from('orders')
        .select('vehicle_id')
        .eq('dealer_id', dealerRecord.id)
      
      const uniqueModels = new Set(orderVehicles?.map(o => o.vehicle_id).filter(Boolean))
      setModelsCount(uniqueModels.size)

      // Load warranty registrations count
      const { count: warrantyTotal } = await supabase
        .from('warranty_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealerRecord.id)
      setWarrantyCount(warrantyTotal || 0)

      // Load orders count
      const { count: ordersTotal } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealerRecord.id)
      setOrdersCount(ordersTotal || 0)
    } catch (err: any) {
      console.error('Error loading dealer data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dealer dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading dashboard: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dealer Dashboard</h1>
        <OmniButton 
          variant="ghost" 
          onClick={() => loadDealerData()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </OmniButton>
      </div>

      {/* Simple KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{leadsCount}</div>
            <div className="text-sm text-gray-600 mt-1">Total Leads</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{modelsCount}</div>
            <div className="text-sm text-gray-600 mt-1">Vehicle Models</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{warrantyCount}</div>
            <div className="text-sm text-gray-600 mt-1">Warranty Registrations</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{ordersCount}</div>
            <div className="text-sm text-gray-600 mt-1">Total Orders</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

