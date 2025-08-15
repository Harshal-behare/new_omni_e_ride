'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OmniButton } from '@/components/ui/omni-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ShoppingBag, CreditCard, Truck, Shield, Clock, Gauge, Battery, Timer } from 'lucide-react'
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
  description?: string
}

interface OrderFormData {
  quantity: number
  delivery_address: string
  special_instructions: string
  payment_method: 'razorpay' | 'cod'
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleParam = searchParams.get('vehicle')
  
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [placing, setPlacing] = React.useState(false)
  
  const [formData, setFormData] = React.useState<OrderFormData>({
    quantity: 1,
    delivery_address: '',
    special_instructions: '',
    payment_method: 'razorpay'
  })

  React.useEffect(() => {
    if (vehicleParam) {
      fetchVehicle(vehicleParam)
    } else {
      setLoading(false)
    }
  }, [vehicleParam])

  const fetchVehicle = async (slug: string) => {
    try {
      const response = await fetch(`/api/vehicles/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setVehicle(data)
      } else {
        toast.error('Vehicle not found')
        router.push('/dashboard/vehicles')
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      toast.error('Failed to load vehicle details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateTotal = () => {
    if (!vehicle) return 0
    const price = vehicle.discounted_price || vehicle.price
    return price * formData.quantity
  }

  const handlePlaceOrder = async () => {
    if (!vehicle) return
    
    if (!formData.delivery_address.trim()) {
      toast.error('Please enter delivery address')
      return
    }

    setPlacing(true)

    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          quantity: formData.quantity,
          unit_price: vehicle.discounted_price || vehicle.price,
          total_amount: calculateTotal(),
          delivery_address: formData.delivery_address,
          special_instructions: formData.special_instructions,
          payment_method: formData.payment_method
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (formData.payment_method === 'razorpay' && result.payment_url) {
          // Redirect to Razorpay payment
          window.location.href = result.payment_url
        } else {
          // COD order placed successfully
          toast.success('Order placed successfully!')
          router.push(`/dashboard/orders?new_order=${result.order_id}`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('An error occurred while placing the order')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle Not Found</h3>
        <p className="text-gray-600 mb-6">The vehicle you're looking for doesn't exist or has been removed.</p>
        <Link href="/dashboard/vehicles">
          <OmniButton>Browse Vehicles</OmniButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-gray-600">Review and place your order</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                <Image
                  src={vehicle.images[0] || '/placeholder.svg?height=200&width=300'}
                  alt={vehicle.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                <Badge variant="secondary" className="mb-2">{vehicle.type}</Badge>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {vehicle.top_speed_kmph} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {vehicle.range_km} km
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <div className="flex items-center gap-2">
                  {vehicle.discounted_price && (
                    <span className="text-sm line-through text-gray-400">
                      ₹{vehicle.price.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-lg font-semibold text-emerald-600">
                    ₹{(vehicle.discounted_price || vehicle.price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-emerald-600">₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <Textarea
                placeholder="Enter your complete delivery address"
                value={formData.delivery_address}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <Textarea
                placeholder="Any special delivery instructions or requirements"
                value={formData.special_instructions}
                onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="razorpay"
                    checked={formData.payment_method === 'razorpay'}
                    onChange={(e) => handleInputChange('payment_method', e.target.value as 'razorpay')}
                  />
                  <CreditCard className="h-4 w-4" />
                  <span className="flex-1">Pay Online (Card/UPI/Wallet)</span>
                  <Badge className="bg-green-100 text-green-700">Recommended</Badge>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={(e) => handleInputChange('payment_method', e.target.value as 'cod')}
                  />
                  <Truck className="h-4 w-4" />
                  <span className="flex-1">Cash on Delivery</span>
                  <Badge variant="outline">₹500 extra</Badge>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <OmniButton
                onClick={handlePlaceOrder}
                disabled={placing || !formData.delivery_address.trim()}
                className="w-full"
                size="lg"
              >
                {placing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Place Order - ₹{calculateTotal().toLocaleString('en-IN')}
                  </>
                )}
              </OmniButton>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>• Free delivery within city limits</p>
              <p>• 7-day return policy</p>
              <p>• 2-year comprehensive warranty</p>
              <p>• Order confirmation will be sent via email</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
