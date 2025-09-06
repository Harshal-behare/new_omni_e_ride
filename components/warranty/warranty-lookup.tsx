'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OmniButton } from '@/components/ui/omni-button'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle2, XCircle, Calendar, Car, User, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface WarrantyResult {
  id: string
  customer_name: string
  customer_email: string
  vehicle_model: string
  vin: string
  purchase_date: string
  period_years: number
  dealer_name: string
  expiry_date: string
  is_expired: boolean
  days_remaining: number
  status: 'Active' | 'Expired'
}

export function WarrantyLookup() {
  const [searchType, setSearchType] = React.useState<'vin' | 'email'>('vin')
  const [searchValue, setSearchValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<WarrantyResult[]>([])
  const [searched, setSearched] = React.useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    
    if (!searchValue.trim()) {
      toast.error('Please enter a value to search')
      return
    }

    setLoading(true)
    setSearched(true)
    
    try {
      const params = new URLSearchParams({
        [searchType]: searchValue.trim()
      })
      
      const response = await fetch(`/api/public/warranty/check?${params}`)
      const data = await response.json()
      
      if (response.ok && data.warranties) {
        setResults(data.warranties)
        if (data.warranties.length === 0) {
          toast.error('No warranty found')
        }
      } else {
        setResults([])
        toast.error(data.error || 'Failed to fetch warranty')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search warranty')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Check Warranty Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="vin"
                  checked={searchType === 'vin'}
                  onChange={() => setSearchType('vin')}
                  className="text-emerald-600"
                />
                <span>Search by VIN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="email"
                  checked={searchType === 'email'}
                  onChange={() => setSearchType('email')}
                  className="text-emerald-600"
                />
                <span>Search by Email</span>
              </label>
            </div>
            
            <div>
              <Label htmlFor="search">
                {searchType === 'vin' ? 'Vehicle Identification Number (VIN)' : 'Email Address'}
              </Label>
              <Input
                id="search"
                type={searchType === 'email' ? 'email' : 'text'}
                placeholder={searchType === 'vin' ? 'Enter VIN' : 'Enter email address'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <OmniButton type="submit" loading={loading} className="w-full">
              {loading ? 'Searching...' : 'Search Warranty'}
            </OmniButton>
          </form>
        </CardContent>
      </Card>

      {searched && !loading && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No warranty found</p>
            <p className="text-sm text-gray-500 mt-1">
              Please check your {searchType === 'vin' ? 'VIN' : 'email'} and try again
            </p>
          </CardContent>
        </Card>
      )}

      {results.map((warranty) => (
        <Card key={warranty.id} className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                {warranty.vehicle_model}
              </CardTitle>
              <Badge className={warranty.is_expired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                {warranty.is_expired ? (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Expired
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium">{warranty.customer_name}</p>
                  <p className="text-sm text-gray-600">{warranty.customer_email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">VIN</p>
                  <p className="font-medium font-mono">{warranty.vin}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Purchase Date</p>
                  <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Warranty Period</p>
                  <p className="font-medium">{warranty.period_years} Year{warranty.period_years > 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Expiry Date</p>
                  <p className="font-medium">{new Date(warranty.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Dealer</p>
                  <p className="font-medium">{warranty.dealer_name}</p>
                </div>
              </div>
            </div>
            
            {!warranty.is_expired && warranty.days_remaining <= 90 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Warranty expiring soon!</strong> {warranty.days_remaining} days remaining
                </p>
              </div>
            )}
            
            {warranty.is_expired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warranty expired</strong> on {new Date(warranty.expiry_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
