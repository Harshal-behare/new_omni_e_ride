'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Navigation, 
  Clock, 
  Star,
  Calendar,
  Building,
  CreditCard,
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Dealer {
  id: string
  business_name: string
  business_address: string
  business_phone: string
  business_email?: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  status: string
  commission_rate?: number
  approved_at?: string
  created_at: string
}

interface DealerDetailModalProps {
  dealer: Dealer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DealerDetailModal({ dealer, open, onOpenChange }: DealerDetailModalProps) {
  if (!dealer) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleGetDirections = () => {
    const address = encodeURIComponent(dealer.business_address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank')
  }

  const handleCall = () => {
    window.open(`tel:${dealer.business_phone.replace(/\s/g, '')}`, '_self')
  }

  const handleEmail = () => {
    if (dealer.business_email) {
      window.open(`mailto:${dealer.business_email}`, '_self')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-emerald-700">
                {dealer.business_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(dealer.status)}
                <span className="text-sm text-gray-500">
                  Since {formatDate(dealer.created_at)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium">{dealer.business_address}</p>
                  <p className="text-sm text-gray-600">
                    {dealer.city}, {dealer.state} - {dealer.pincode}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{dealer.business_phone}</p>
                  </div>
                </div>

                {dealer.business_email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{dealer.business_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Saturday</span>
                <span className="font-medium">9:00 AM - 7:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium">10:00 AM - 5:00 PM</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Hours may vary. Please call ahead to confirm availability.
              </p>
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Vehicle Sales</Badge>
              <Badge variant="secondary">Test Rides</Badge>
              <Badge variant="secondary">Service & Maintenance</Badge>
              <Badge variant="secondary">Spare Parts</Badge>
              <Badge variant="secondary">Insurance Assistance</Badge>
              <Badge variant="secondary">Financing Support</Badge>
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          {dealer.commission_rate && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Business Details
              </h3>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commission Rate</span>
                  <span className="font-medium">{dealer.commission_rate}%</span>
                </div>
                {dealer.approved_at && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Approved On</span>
                    <span className="font-medium">{formatDate(dealer.approved_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={handleCall} className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
            
            <Button variant="outline" onClick={handleGetDirections} className="flex-1">
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>

            {dealer.business_email && (
              <Button variant="outline" onClick={handleEmail} className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            )}
          </div>

          {/* Additional Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="ghost" size="sm" className="text-emerald-600">
              <Calendar className="h-4 w-4 mr-2" />
              Book Test Ride
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-600">
              <Globe className="h-4 w-4 mr-2" />
              View Inventory
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>Dealer ID: {dealer.id}</p>
            <p>For any issues with this dealer, please contact our support team.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
