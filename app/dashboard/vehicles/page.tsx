'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OmniButton } from '@/components/ui/omni-button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingCart, Calendar, Zap, Gauge, Battery, Timer } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Vehicle {
  id: string
  name: string
  slug: string
  price: number
  discounted_price?: number
  range_km: number
  top_speed_kmph: number
  charging_time_hours: number
  battery_capacity?: string
  motor_power?: string
  features: string[]
  images: string[]
  type: string
  status: string
  description?: string
  created_at: string
}

export default function DashboardVehiclesPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState('all')
  const [priceRange, setPriceRange] = React.useState('all')

  React.useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      } else {
        toast.error('Failed to load vehicles')
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('An error occurred while loading vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleBookTestRide = async (vehicleId: string) => {
    try {
      // Redirect to test ride booking page
      window.location.href = `/dashboard/test-rides/new?vehicle=${vehicleId}`
    } catch (error) {
      console.error('Error booking test ride:', error)
      toast.error('Failed to book test ride')
    }
  }

  const handleBuyNow = async (vehicleSlug: string) => {
    try {
      // Redirect to order page
      window.location.href = `/dashboard/orders/checkout?vehicle=${vehicleSlug}`
    } catch (error) {
      console.error('Error starting purchase:', error)
      toast.error('Failed to start purchase')
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || vehicle.type === categoryFilter
    
    let matchesPrice = true
    if (priceRange !== 'all') {
      const price = vehicle.price
      switch (priceRange) {
        case 'under-50k':
          matchesPrice = price < 50000
          break
        case '50k-100k':
          matchesPrice = price >= 50000 && price < 100000
          break
        case '100k-150k':
          matchesPrice = price >= 100000 && price < 150000
          break
        case 'over-150k':
          matchesPrice = price >= 150000
          break
      }
    }

    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Browse Vehicles</h1>
          <p className="text-gray-600 mt-1">
            Discover our range of electric vehicles and find your perfect ride
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="scooter">Scooters</SelectItem>
                <SelectItem value="motorcycle">Motorcycles</SelectItem>
                <SelectItem value="bicycle">E-Bicycles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-50k">Under ₹50,000</SelectItem>
                <SelectItem value="50k-100k">₹50,000 - ₹1,00,000</SelectItem>
                <SelectItem value="100k-150k">₹1,00,000 - ₹1,50,000</SelectItem>
                <SelectItem value="over-150k">Above ₹1,50,000</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 text-center max-w-sm">
              Try adjusting your search criteria or browse all available vehicles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={vehicle.images[0] || '/placeholder.svg?height=200&width=300'}
                    alt={vehicle.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <Badge 
                    className="absolute top-3 right-3 bg-emerald-600 text-white"
                  >
                    {vehicle.type}
                  </Badge>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {vehicle.name}
                  </h3>
                  
                  {vehicle.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {vehicle.description.slice(0, 60)}...
                    </p>
                  )}
                  
                  <div className="mb-3">
                    {vehicle.discounted_price && (
                      <span className="text-sm line-through text-gray-400 mr-2">
                        ₹{vehicle.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <div className="text-2xl font-bold text-emerald-600">
                      ₹{(vehicle.discounted_price || vehicle.price).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Gauge className="h-3 w-3 text-emerald-600" />
                      {vehicle.top_speed_kmph} km/h
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Battery className="h-3 w-3 text-emerald-600" />
                      {vehicle.battery_capacity || '—'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Timer className="h-3 w-3 text-emerald-600" />
                      {vehicle.range_km} km
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Array.isArray(vehicle.features) && vehicle.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {Array.isArray(vehicle.features) && vehicle.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{vehicle.features.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <OmniButton
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBookTestRide(vehicle.id)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Test Ride
                    </OmniButton>
                    <OmniButton
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBuyNow(vehicle.slug)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Buy Now
                    </OmniButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
