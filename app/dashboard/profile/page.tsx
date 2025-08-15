'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Loader2, Camera, Edit, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || ''
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
      const response = await fetch('/api/profile', {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      
      {/* Profile Header Card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <UserAvatar 
                name={profile?.name || 'User'}
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
                  {profile?.name || 'Complete your profile'}
                </h2>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {profile?.role || 'customer'}
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{profile?.email}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Member since {new Date(profile?.created_at || '').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div>
                  Profile {(profile?.name && profile?.phone && profile?.city) ? '100' : '60'}% complete
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Photo
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card className="mt-4">
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
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
            <Field label="Phone">
              <input 
                value={formData.phone} 
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full rounded-lg border px-3 py-2" 
                placeholder="Enter your phone number"
                pattern="[6-9][0-9]{9}"
                title="Please enter a valid 10-digit Indian phone number"
              />
            </Field>
            <Field label="City">
              <input 
                value={formData.city} 
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full rounded-lg border px-3 py-2" 
                placeholder="Enter your city"
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
            <div className="sm:col-span-2">
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
          </CardContent>
        </Card>
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
