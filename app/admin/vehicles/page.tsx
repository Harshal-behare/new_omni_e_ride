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
  Zap, Gauge, Battery, Clock, Search, Filter, FileEdit
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
  const [showDataEditModal, setShowDataEditModal] = React.useState(false)
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
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status })
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

  const handleDataUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Only send data fields, no images
      const dataToUpdate = {
        id: selectedVehicle?.id,
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        price: formData.price,
        discounted_price: formData.discounted_price,
        description: formData.description,
        status: formData.status,
        stock_quantity: formData.stock_quantity,
        range_km: formData.range_km,
        top_speed_kmph: formData.top_speed_kmph,
        charging_time_hours: formData.charging_time_hours,
        battery_capacity: formData.battery_capacity,
        motor_power: formData.motor_power,
        colors: formData.colors
      }
      
      const response = await fetch('/api/admin/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update vehicle data')
      }
      
      toast.success('Vehicle data updated successfully')
      setShowDataEditModal(false)
      setSelectedVehicle(null)
      await fetchVehicles()
    } catch (error) {
      console.error('Error updating vehicle data:', error)
      toast.error('Failed to update vehicle data')
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
              value={filters.type || undefined} 
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="ebike">E-Bike</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.status || undefined} 
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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
                  className="flex-1"
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setFormData(vehicle)
                    setShowDataEditModal(true)
                  }}
                  title="Edit vehicle data (no images)"
                >
                  <FileEdit className="h-4 w-4 mr-1" />
                  Edit Data
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setFormData(vehicle)
                    setEditMode(true)
                    setShowAddForm(true)
                  }}
                  title="Edit all (including images)"
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

      {/* Data Edit Modal - No Images */}
      {showDataEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Edit Vehicle Data</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Edit vehicle information (images are managed separately)
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDataEditModal(false)
                    setSelectedVehicle(null)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleDataUpdate} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data-name">Vehicle Name *</Label>
                      <Input
                        id="data-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Omni X Pro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-slug">Slug</Label>
                      <Input
                        id="data-slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g., omni-x-pro"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
                    </div>
                    <div>
                      <Label htmlFor="data-type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                      >
                        <SelectTrigger id="data-type">
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
                      <Label htmlFor="data-status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                      >
                        <SelectTrigger id="data-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="data-brand">Brand *</Label>
                      <Input
                        id="data-brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        required
                        placeholder="e.g., Omni"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-model">Model *</Label>
                      <Input
                        id="data-model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        required
                        placeholder="e.g., X Pro"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="data-price">Price (₹) *</Label>
                      <Input
                        id="data-price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        required
                        placeholder="125000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-discounted-price">Discounted Price (₹)</Label>
                      <Input
                        id="data-discounted-price"
                        type="number"
                        value={formData.discounted_price || ''}
                        onChange={(e) => setFormData({ ...formData, discounted_price: parseInt(e.target.value) || undefined })}
                        placeholder="110000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-stock">Stock Quantity *</Label>
                      <Input
                        id="data-stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                        required
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data-range">Range (km)</Label>
                      <Input
                        id="data-range"
                        type="number"
                        value={formData.range_km || ''}
                        onChange={(e) => setFormData({ ...formData, range_km: parseInt(e.target.value) || undefined })}
                        placeholder="180"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-speed">Top Speed (km/h)</Label>
                      <Input
                        id="data-speed"
                        type="number"
                        value={formData.top_speed_kmph || ''}
                        onChange={(e) => setFormData({ ...formData, top_speed_kmph: parseInt(e.target.value) || undefined })}
                        placeholder="75"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-battery">Battery Capacity</Label>
                      <Input
                        id="data-battery"
                        value={formData.battery_capacity || ''}
                        onChange={(e) => setFormData({ ...formData, battery_capacity: e.target.value })}
                        placeholder="e.g., 3.2 kWh"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-charging">Charging Time (hours)</Label>
                      <Input
                        id="data-charging"
                        type="number"
                        step="0.5"
                        value={formData.charging_time_hours || ''}
                        onChange={(e) => setFormData({ ...formData, charging_time_hours: parseFloat(e.target.value) || undefined })}
                        placeholder="4.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-motor">Motor Power</Label>
                      <Input
                        id="data-motor"
                        value={formData.motor_power || ''}
                        onChange={(e) => setFormData({ ...formData, motor_power: e.target.value })}
                        placeholder="e.g., 2000W"
                      />
                    </div>
                    <div>
                      <Label htmlFor="data-colors">Available Colors</Label>
                      <Input
                        id="data-colors"
                        value={formData.colors?.join(', ') || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean) 
                        })}
                        placeholder="Red, Blue, Black"
                      />
                      <p className="text-xs text-gray-500 mt-1">Comma-separated values</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div>
                    <Label htmlFor="data-description">Vehicle Description</Label>
                    <Textarea
                      id="data-description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      placeholder="Enter detailed description of the vehicle..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDataEditModal(false)
                      setSelectedVehicle(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4 mr-2" />
                    Update Vehicle Data
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
