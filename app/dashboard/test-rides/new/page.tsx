'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarScheduler } from '@/components/test-rides/calendar-scheduler'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSimpleTestRideBooking } from '@/hooks/use-simple-booking'
import { ArrowLeft, Car, MapPin, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Dealer {
  id: string
  name: string
  address: string
  city: string
  state: string
  phone: string
}

interface Vehicle {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  range_km: number
  top_speed_kmph: number
  charging_time_hours: number
}

export default function NewTestRidePage() {
  const router = useRouter()
  const { bookTestRide, isBooking } = useSimpleTestRideBooking()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loadingDealers, setLoadingDealers] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [selectedDealer, setSelectedDealer] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    fetchVehicles()
    fetchDealers()
    
    // Check if vehicle ID is passed in query params
    const searchParams = new URLSearchParams(window.location.search)
    const vehicleId = searchParams.get('vehicle')
    if (vehicleId) {
      setSelectedVehicle(vehicleId)
    }
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data || [])
      } else {
        console.error('Failed to fetch vehicles')
        toast.error('Unable to load vehicles')
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Unable to load vehicles')
    } finally {
      setLoadingVehicles(false)
    }
  }

  const fetchDealers = async () => {
    try {
      const response = await fetch('/api/public/dealers')
      if (response.ok) {
        const data = await response.json()
        const dealersList = data.map((dealer: any) => ({
          id: dealer.id,
          name: dealer.business_name || dealer.profiles?.name || 'Dealer',
          address: dealer.business_address || '',
          city: dealer.city || '',
          state: dealer.state || '',
          phone: dealer.business_phone || ''
        }))
        setDealers(dealersList)
      } else {
        console.error('Failed to fetch dealers')
        toast.error('Unable to load dealer locations. You can still proceed with booking.')
        setDealers([])
      }
    } catch (error) {
      console.error('Error fetching dealers:', error)
      toast.error('Unable to load dealer locations. You can still proceed with booking.')
      setDealers([])
    } finally {
      setLoadingDealers(false)
    }
  }

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
        dealer_id: selectedDealer && selectedDealer !== 'any' ? selectedDealer : undefined,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: notes || undefined
      })
    } catch (error: any) {
      console.error('Booking error:', error)
    }
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
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
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={loadingVehicles}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
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
                      <div className="mt-1 text-xs text-gray-500">
                        Range: {selectedVehicleData.range_km}km | Top Speed: {selectedVehicleData.top_speed_kmph}km/h
                      </div>
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
              <Select value={selectedDealer} onValueChange={setSelectedDealer} disabled={loadingDealers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingDealers ? "Loading dealers..." : "Select a dealer (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Available Dealer</SelectItem>
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

          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Booking Information
              </CardTitle>
              <CardDescription>
                Complete your test ride booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• You'll receive a confirmation code instantly</li>
                    <li>• Our dealer will contact you within 24 hours</li>
                    <li>• Show the confirmation code at the dealership</li>
                    <li>• Enjoy your test ride!</li>
                  </ul>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Test rides are subject to availability</p>
                  <p>• Valid driving license is required</p>
                  <p>• You can cancel or reschedule anytime</p>
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
                Book Test Ride
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
