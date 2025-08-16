'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Checkbox } from '@/components/ui/checkbox'
import { WarrantyStateBadge } from '@/components/warranty/status-badge'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, FileCheck, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface WarrantyRecord {
  id: string
  customer_email: string
  customer_name: string
  phone?: string
  vehicle_model: string
  model_id?: string
  vin: string
  purchase_date: string
  period_years: number
  dealer_id: string
  dealer_name: string
  invoice_image_url?: string
  signature_data_url?: string
  review_status: 'PendingReview' | 'Approved' | 'Declined'
  created_at: string
  reviewed_at?: string
  reviewer_name?: string
  notes?: string
}

export default function AdminWarrantiesPage() {
  const [rows, setRows] = React.useState<WarrantyRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processing, setProcessing] = React.useState<string | null>(null)
  const [selectedWarranty, setSelectedWarranty] = React.useState<WarrantyRecord | null>(null)
  const [showDetailsModal, setShowDetailsModal] = React.useState(false)

  React.useEffect(() => {
    fetchWarranties()
  }, [])

  async function fetchWarranties() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/warranties')
      if (response.ok) {
        const data = await response.json()
        setRows(data.warranties || [])
      } else {
        toast.error('Failed to load warranties')
      }
    } catch (error) {
      console.error('Error fetching warranties:', error)
      toast.error('Error loading warranties')
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(w: WarrantyRecord, status: 'Approved' | 'Declined') {
    setProcessing(w.id)
    try {
      const response = await fetch('/api/admin/warranties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: w.id,
          review_status: status,
          notes: status === 'Declined' ? 'Documents not verified' : null
        })
      })

      if (response.ok) {
        toast.success(`Warranty ${status.toLowerCase()} successfully`)
        await fetchWarranties()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${status.toLowerCase()} warranty`)
      }
    } catch (error) {
      console.error('Error reviewing warranty:', error)
      toast.error('Failed to process warranty review')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Warranty Management</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Submissions</div>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-600">
              {rows.filter(w => w.review_status === 'PendingReview').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {rows.filter(w => w.review_status === 'Approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Declined</div>
            <div className="text-2xl font-bold text-red-600">
              {rows.filter(w => w.review_status === 'Declined').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Warranty Registrations</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead><tr className="text-left text-gray-600">
                  <th className="py-2">ID</th><th>Dealer</th><th>Customer</th><th>Email</th><th>Model</th><th>VIN</th>
                  <th>Period</th><th>Purchase</th><th>Docs</th><th>Status</th><th className="text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id} className="border-t align-top">
                      <td className="py-2 font-mono text-xs">{w.id.slice(0, 8)}</td>
                      <td>{w.dealer_name}</td>
                      <td>{w.customer_name}</td>
                      <td>{w.customer_email}</td>
                      <td>{w.vehicle_model}</td>
                      <td className="font-mono text-xs">{w.vin}</td>
                      <td>{w.period_years} yr</td>
                      <td>{new Date(w.purchase_date).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {w.invoice_image_url && (
                            <div title="Invoice uploaded">
                              <FileCheck className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {w.signature_data_url && (
                            <div title="Signature provided">
                              <FileCheck className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedWarranty(w)
                              setShowDetailsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td><WarrantyStateBadge state={w.review_status} /></td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <OmniButton 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleReview(w, 'Declined')} 
                            disabled={w.review_status !== 'PendingReview' || processing === w.id}
                          >
                            {processing === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Decline'}
                          </OmniButton>
                          <OmniButton 
                            size="sm" 
                            onClick={() => handleReview(w, 'Approved')} 
                            disabled={w.review_status !== 'PendingReview' || processing === w.id}
                          >
                            {processing === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                          </OmniButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-gray-600">No warranties submitted.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Warranty Details</DialogTitle>
          </DialogHeader>
          {selectedWarranty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedWarranty.customer_name}</p>
                  <p className="text-sm">{selectedWarranty.customer_email}</p>
                  {selectedWarranty.phone && <p className="text-sm">{selectedWarranty.phone}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium">{selectedWarranty.vehicle_model}</p>
                  <p className="text-sm">VIN: {selectedWarranty.vin}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Purchase Date</p>
                  <p>{new Date(selectedWarranty.purchase_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warranty Period</p>
                  <p>{selectedWarranty.period_years} years</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dealer</p>
                <p>{selectedWarranty.dealer_name}</p>
              </div>
              {selectedWarranty.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p>{selectedWarranty.notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Documents</p>
                {selectedWarranty.invoice_image_url && (
                  <div>
                    <p className="text-sm font-medium">Invoice</p>
                    <img 
                      src={selectedWarranty.invoice_image_url} 
                      alt="Invoice" 
                      className="mt-1 max-w-full h-48 object-contain border rounded"
                    />
                  </div>
                )}
                {selectedWarranty.signature_data_url && (
                  <div>
                    <p className="text-sm font-medium">Signature</p>
                    <img 
                      src={selectedWarranty.signature_data_url} 
                      alt="Signature" 
                      className="mt-1 max-w-full h-24 object-contain border rounded bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
