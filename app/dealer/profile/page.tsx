'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Loader2, Camera, Edit, Save, X, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealerProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  role: string
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_email: string | null
  gst_number: string | null
  pan_number: string | null
  commission_rate: number | null
  dealer_status: string | null
  dealer_id: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export default function DealerProfilePage() {
  const [profile, setProfile] = useState<DealerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal')
  const [formData, setFormData] = useState({
    // Personal details
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Business details
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    gst_number: '',
    pan_number: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/dealer/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          business_phone: data.business_phone || '',
          business_email: data.business_email || '',
          gst_number: data.gst_number || '',
          pan_number: data.pan_number || ''
        })
      } else {
        toast.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('An error occurred while loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/dealer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        setProfile(result.profile)
        toast.success('Profile updated successfully')
        await fetchProfile() // Refresh the data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An error occurred while updating profile')
    } finally {
      setSaving(false)
    }
  }

  const getProfileCompleteness = () => {
    const requiredFields = ['name', 'phone', 'city', 'business_name', 'business_phone', 'gst_number']
    const filledFields = requiredFields.filter(field => formData[field as keyof typeof formData])
    return Math.round((filledFields.length / requiredFields.length) * 100)
  }

  const getDealerStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
      suspended: { color: 'bg-gray-100 text-gray-700', label: 'Suspended' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dealer Profile</h1>
      
      {/* Profile Header Card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <UserAvatar 
                name={profile?.name || profile?.business_name || 'Dealer'}
                email={profile?.email || ''}
                size="xl"
                showOnline
              />
              <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.business_name || profile?.name || 'Complete your profile'}
                </h2>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Dealer
                </Badge>
                {getDealerStatusBadge(profile?.dealer_status || null)}
              </div>
              <p className="text-gray-600 mb-1">{profile?.email}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Dealer since {profile?.approved_at ? new Date(profile.approved_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Pending'}</span>
                </div>
                <div>
                  Profile {getProfileCompleteness()}% complete
                </div>
                {profile?.commission_rate && (
                  <div className="text-emerald-600 font-medium">
                    {profile.commission_rate}% Commission
                  </div>
                )}
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Photo
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Tab Navigation */}
      <div className="flex gap-4 mt-6 border-b">
        <button
          onClick={() => setActiveTab('personal')}
          className={cn(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'personal' 
              ? 'text-emerald-600 border-emerald-600' 
              : 'text-gray-600 border-transparent hover:text-gray-900'
          )}
        >
          Personal Information
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={cn(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'business' 
              ? 'text-emerald-600 border-emerald-600' 
              : 'text-gray-600 border-transparent hover:text-gray-900'
          )}
        >
          Business Information
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {activeTab === 'personal' ? (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <input 
                  value={formData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  required
                />
              </Field>
              <Field label="Email">
                <input 
                  value={profile?.email || ''} 
                  className="w-full rounded-lg border px-3 py-2 bg-gray-50" 
                  disabled
                />
              </Field>
              <Field label="Phone *">
                <input 
                  value={formData.phone} 
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="Enter your phone number"
                  pattern="[6-9][0-9]{9}"
                  title="Please enter a valid 10-digit Indian phone number"
                  required
                />
              </Field>
              <Field label="City *">
                <input 
                  value={formData.city} 
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="Enter your city"
                  required
                />
              </Field>
              <Field label="State">
                <input 
                  value={formData.state} 
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="Enter your state"
                />
              </Field>
              <Field label="Pincode">
                <input 
                  value={formData.pincode} 
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="Enter 6-digit pincode"
                  pattern="[0-9]{6}"
                  title="Please enter a valid 6-digit pincode"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea 
                    value={formData.address} 
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2" 
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name *">
                <input 
                  value={formData.business_name} 
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  required
                />
              </Field>
              <Field label="Business Phone *">
                <input 
                  value={formData.business_phone} 
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="Business contact number"
                  pattern="[6-9][0-9]{9}"
                  required
                />
              </Field>
              <Field label="Business Email">
                <input 
                  type="email"
                  value={formData.business_email} 
                  onChange={(e) => handleInputChange('business_email', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="business@example.com"
                />
              </Field>
              <Field label="GST Number *">
                <input 
                  value={formData.gst_number} 
                  onChange={(e) => handleInputChange('gst_number', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="22AAAAA0000A1Z5"
                  pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}"
                  title="Please enter a valid GST number"
                  required
                />
              </Field>
              <Field label="PAN Number">
                <input 
                  value={formData.pan_number} 
                  onChange={(e) => handleInputChange('pan_number', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2" 
                  placeholder="ABCDE1234F"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  title="Please enter a valid PAN number"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Business Address">
                  <textarea 
                    value={formData.business_address} 
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2" 
                    placeholder="Enter complete business address"
                    rows={3}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-6">
          <OmniButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </OmniButton>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800">{label}</div>
      <div className="mt-1">{children}</div>
    </label>
  )
}
