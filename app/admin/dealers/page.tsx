'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { EditDealerModal } from '@/components/modals/edit-dealer-modal'

export interface Dealer {
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
  google_maps_link?: string
  created_at: string
  approved_at?: string
  approved_by?: string
  updated_at?: string
  documents?: any
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function AdminDealersPage() {
  const [dealers, setDealers] = React.useState<Dealer[]>([])
  const [filteredDealers, setFilteredDealers] = React.useState<Dealer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDealer, setSelectedDealer] = React.useState<Dealer | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchDealers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dealers')
      if (!response.ok) {
        throw new Error('Failed to fetch dealers')
      }
      const data = await response.json()
      setDealers(data)
      setFilteredDealers(data)
    } catch (error) {
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDealers()
  }, [fetchDealers])

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDealers(dealers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredDealers(
        dealers.filter(
          (dealer) =>
            dealer.business_name.toLowerCase().includes(query) ||
            dealer.user?.name.toLowerCase().includes(query) ||
            dealer.user?.email.toLowerCase().includes(query) ||
            dealer.city.toLowerCase().includes(query) ||
            dealer.state.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, dealers])

  const handleDealerUpdate = (updatedDealer: Dealer) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === updatedDealer.id ? updatedDealer : d))
    )
    setSelectedDealer(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dealers Management</h1>
        <p className="text-gray-600 text-sm mt-1">View and manage all registered dealers</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Dealers ({filteredDealers.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search dealers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-600">Loading dealers...</div>
          ) : filteredDealers.length === 0 ? (
            <div className="py-8 text-center text-gray-600">
              {searchQuery ? 'No dealers found matching your search' : 'No dealers found'}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers.map((dealer) => (
                    <TableRow key={dealer.id}>
                      <TableCell className="font-medium">{dealer.business_name}</TableCell>
                      <TableCell>{dealer.user?.name || 'N/A'}</TableCell>
                      <TableCell>{dealer.user?.email || 'N/A'}</TableCell>
                      <TableCell>{dealer.business_phone}</TableCell>
                      <TableCell>
                        {dealer.city}, {dealer.state}
                      </TableCell>
                      <TableCell>{getStatusBadge(dealer.status)}</TableCell>
                      <TableCell>{dealer.commission_rate}%</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDealer(dealer)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditDealerModal
        dealer={selectedDealer}
        open={!!selectedDealer}
        onOpenChange={(open) => !open && setSelectedDealer(null)}
        onUpdate={handleDealerUpdate}
      />
    </div>
  )
}
