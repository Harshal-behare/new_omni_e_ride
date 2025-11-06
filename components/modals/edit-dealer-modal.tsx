'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Dealer } from '@/app/admin/dealers/page'

interface EditDealerModalProps {
  dealer: Dealer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (dealer: Dealer) => void
}

export function EditDealerModal({ dealer, open, onOpenChange, onUpdate }: EditDealerModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    pan_number: '',
    status: 'pending',
    commission_rate: 0,
    google_maps_link: '',
    user_id: '',
  })

  React.useEffect(() => {
    if (dealer) {
      setFormData({
        business_name: dealer.business_name || '',
        business_address: dealer.business_address || '',
        business_phone: dealer.business_phone || '',
        business_email: dealer.business_email || '',
        city: dealer.city || '',
        state: dealer.state || '',
        pincode: dealer.pincode || '',
        gst_number: dealer.gst_number || '',
        pan_number: dealer.pan_number || '',
        status: dealer.status || 'pending',
        commission_rate: dealer.commission_rate || 0,
        google_maps_link: dealer.google_maps_link || '',
        user_id: dealer.user_id || '',
      })
    }
  }, [dealer])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealer) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/dealers/${dealer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update dealer')
      }

      const updatedDealer = await response.json()
      onUpdate({ ...dealer, ...updatedDealer })
      toast.success('Dealer updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating dealer:', error)
      toast.error('Failed to update dealer')
    } finally {
      setLoading(false)
    }
  }

  if (!dealer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dealer Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Owner Information (Read-only) */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Owner Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-gray-600">Owner Name</Label>
                  <Input
                    value={dealer.user?.name || 'N/A'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Owner Email</Label>
                  <Input
                    value={dealer.user?.email || 'N/A'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Business Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleChange('business_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="business_phone">Business Phone *</Label>
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => handleChange('business_phone', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => handleChange('business_email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Address</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="business_address">Street Address *</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleChange('business_address', e.target.value)}
                    rows={2}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Tax Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={formData.gst_number}
                    onChange={(e) => handleChange('gst_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => handleChange('pan_number', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Business Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_rate}
                    onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Google Maps Link */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Location Link</h3>
              <div>
                <Label htmlFor="google_maps_link">Google Maps Link</Label>
                <Input
                  id="google_maps_link"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formData.google_maps_link}
                  onChange={(e) => handleChange('google_maps_link', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Google Maps URL for this dealer's location
                </p>
              </div>
            </div>

            {/* User ID (Read-only) */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">System Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-gray-600">User ID</Label>
                  <Input
                    value={formData.user_id}
                    disabled
                    className="bg-gray-50 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Dealer ID</Label>
                  <Input
                    value={dealer?.id || ''}
                    disabled
                    className="bg-gray-50 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
