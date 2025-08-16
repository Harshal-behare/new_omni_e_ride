'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { 
  Plus, Edit, Trash2, Upload, X, Save, Car, IndianRupee,
  Zap, Gauge, Battery, Clock, Search, Filter
} from 'lucide-react'
import Image from 'next/image'

interface Vehicle {
  id: string
  name: string
  slug: string
  type: 'scooter' | 'bike' | 'ebike'
  brand: string
  model: string
  price: number
  discounted_price?: number
  description?: string
  features?: any
  specifications?: any
  images: string[]
  colors?: string[]
  status: 'active' | 'inactive' | 'draft'
  stock_quantity: number
  range_km?: number
  top_speed_kmph?: number
  charging_time_hours?: number
  battery_capacity?: string
  motor_power?: string
  created_at: string
  updated_at: string
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null)
  const [editMode, setEditMode] = React.useState(false)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [filters, setFilters] = React.useState({
    search: '',
    type: '',
    status: ''
  })
  const [formData, setFormData] = React.useState<Partial<Vehicle>>({
    name: '',
    type: 'scooter',
    brand: '',
    model: '',
    price: 0,
    discounted_price: 0,
    description: '',
    status: 'draft',
    stock_quantity: 0,
    range_km: 0,
    top_speed_kmph: 0,
    charging_time_hours: 0,
    battery_capacity: '',
    motor_power: '',
    images: [],
    colors: []
  })

  React.useEffect(() => {
    fetchVehicles()
  }, [filters])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status })
      })
      
      const response = await fetch(`/api/admin/vehicles?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      
      const data = await response.json()
      setVehicles(data.vehicles)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editMode ? 'PUT' : 'POST'
      const body = editMode ? { ...formData, id: selectedVehicle?.id } : formData
      
      const response = await fetch('/api/admin/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save vehicle')
      }
      
      toast.success(`Vehicle ${editMode ? 'updated' : 'created'} successfully`)
      setShowAddForm(false)
      setEditMode(false)
      setSelectedVehicle(null)
      setFormData({
        name: '',
        type: 'scooter',
        brand: '',
        model: '',
        price: 0,
        discounted_price: 0,
        description: '',
        status: 'draft',
        stock_quantity: 0,
        range_km: 0,
        top_speed_kmph: 0,
        charging_time_hours: 0,
        battery_capacity: '',
        motor_power: '',
        images: [],
        colors: []
      })
      await fetchVehicles()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Failed to save vehicle')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/vehicles?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }
      
      toast.success('Vehicle deleted successfully')
      await fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to delete vehicle')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('vehicleId', selectedVehicle?.id || 'temp')
    
    try {
      const response = await fetch('/api/admin/vehicles/images', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), data.url]
      }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusConfig[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredVehicles = vehicles

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicles...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles Management</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            
            <Select 
              value={filters.type} 
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="ebike">E-Bike</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              {vehicle.images[0] ? (
                <Image
                  src={vehicle.images[0]}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <Car className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(vehicle.status)}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg">{vehicle.name}</h3>
              <p className="text-sm text-gray-600">{vehicle.brand} - {vehicle.model}</p>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold">₹{vehicle.price.toLocaleString()}</span>
                {vehicle.discounted_price && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{vehicle.discounted_price.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-gray-400" />
                  <span>{vehicle.range_km} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="h-4 w-4 text-gray-400" />
                  <span>{vehicle.top_speed_kmph} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery className="h-4 w-4 text-gray-400" />
                  <span>{vehicle.battery_capacity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{vehicle.charging_time_hours}h</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setFormData(vehicle)
                    setEditMode(true)
                    setShowAddForm(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(vehicle.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No vehicles found
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editMode ? 'Edit' : 'Add'} Vehicle</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditMode(false)
                    setSelectedVehicle(null)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scooter">Scooter</SelectItem>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="ebike">E-Bike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="range">Range (km)</Label>
                    <Input
                      id="range"
                      type="number"
                      value={formData.range_km}
                      onChange={(e) => setFormData({ ...formData, range_km: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="speed">Top Speed (km/h)</Label>
                    <Input
                      id="speed"
                      type="number"
                      value={formData.top_speed_kmph}
                      onChange={(e) => setFormData({ ...formData, top_speed_kmph: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="battery">Battery Capacity</Label>
                    <Input
                      id="battery"
                      value={formData.battery_capacity}
                      onChange={(e) => setFormData({ ...formData, battery_capacity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="charging">Charging Time (hours)</Label>
                    <Input
                      id="charging"
                      type="number"
                      value={formData.charging_time_hours}
                      onChange={(e) => setFormData({ ...formData, charging_time_hours: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    {formData.images?.map((img, idx) => (
                      <div key={idx} className="relative">
                        <Image
                          src={img}
                          alt={`Vehicle ${idx + 1}`}
                          width={100}
                          height={100}
                          className="rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images?.filter((_, i) => i !== idx)
                            })
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Upload className="h-6 w-6 text-gray-400" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditMode(false)
                      setSelectedVehicle(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editMode ? 'Update' : 'Create'} Vehicle
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
