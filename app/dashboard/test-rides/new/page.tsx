'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarScheduler } from '@/components/test-rides/calendar-scheduler'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTestRidePayment } from '@/hooks/use-razorpay'
import { ArrowLeft, Car, MapPin, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { MODELS } from '@/lib/models-data'

interface Dealer {
  id: string
  name: string
  address: string
  city: string
  state: string
  phone: string
}

export default function NewTestRidePage() {
  const router = useRouter()
  const { bookTestRide, isBooking } = useTestRidePayment()
  
  const [dealers, setDealers] = useState<Dealer[]>([
    { id: 'd1', name: 'Green Wheels Bengaluru', address: '123 MG Road', city: 'Bengaluru', state: 'Karnataka', phone: '080-12345678' },
    { id: 'd2', name: 'Eco Motors Mumbai', address: '456 Bandra West', city: 'Mumbai', state: 'Maharashtra', phone: '022-87654321' },
    { id: 'd3', name: 'E-Drive Delhi', address: '789 Connaught Place', city: 'New Delhi', state: 'Delhi', phone: '011-98765432' }
  ])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [selectedDealer, setSelectedDealer] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const handleDateTimeSelection = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedVehicle) {
      toast.error('Please select a vehicle')
      return
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time')
      return
    }
    
    try {
      await bookTestRide({
        vehicle_id: selectedVehicle,
        dealer_id: selectedDealer || undefined,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: notes || undefined
      })
    } catch (error: any) {
      console.error('Booking error:', error)
    }
  }

  const selectedVehicleData = MODELS.find(v => v.id === selectedVehicle)
  const selectedDealerData = dealers.find(d => d.id === selectedDealer)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/test-rides">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Book a Test Ride</h1>
            <p className="text-gray-600">Experience your dream vehicle with a test ride</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Vehicle and Dealer Selection */}
        <div className="space-y-6">
          {/* Vehicle Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Select Vehicle
              </CardTitle>
              <CardDescription>
                Choose the vehicle you want to test ride
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{vehicle.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ₹{vehicle.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedVehicleData && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex gap-4">
                    {selectedVehicleData.images[0] && (
                      <img
                        src={selectedVehicleData.images[0]}
                        alt={selectedVehicleData.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedVehicleData.name}</h3>
                      <p className="text-sm text-gray-600">
                        Starting at ₹{selectedVehicleData.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dealer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Dealer (Optional)
              </CardTitle>
              <CardDescription>
                Choose a preferred dealer location for your test ride
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dealer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Available Dealer</SelectItem>
                  {dealers.map(dealer => (
                    <SelectItem key={dealer.id} value={dealer.id}>
                      <div>
                        <div>{dealer.name}</div>
                        <div className="text-xs text-gray-500">
                          {dealer.city}, {dealer.state}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedDealerData && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium">{selectedDealerData.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedDealerData.address}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDealerData.city}, {selectedDealerData.state}
                  </p>
                  <p className="text-sm text-gray-600">Phone: {selectedDealerData.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
              <CardDescription>
                Any special requests or requirements for your test ride
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="E.g., Preferred route, specific features to test, accessibility requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar and Time Selection */}
        <div className="space-y-6">
          <CalendarScheduler
            onSelectDateTime={handleDateTimeSelection}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            vehicleId={selectedVehicle}
            dealerId={selectedDealer}
          />

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription>
                A refundable deposit is required to book your test ride
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Test Ride Deposit</p>
                    <p className="text-sm text-gray-600">Fully refundable after test ride</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">₹2,000</p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• The deposit will be refunded within 7 working days after your test ride</p>
                  <p>• You can cancel up to 24 hours before the scheduled time for a full refund</p>
                  <p>• Payment will be processed securely through Razorpay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isBooking || !selectedVehicle || !selectedDate || !selectedTime}
          >
            {isBooking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₹2,000 and Book Test Ride
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
