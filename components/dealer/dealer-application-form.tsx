'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileText, CheckCircle } from 'lucide-react'

interface DealerApplicationFormData {
  // Business Information
  business_name: string
  business_type: string
  business_address: string
  city: string
  state: string
  pincode: string
  business_phone: string
  business_email: string
  gst_number: string
  pan_number: string
  aadhar_number: string
  
  // Experience & Background
  current_business: string
  experience_years: number
  investment_capacity: string
  preferred_areas: string[]
  why_partner: string
  
  // Documents
  documents?: any
  
  // Agreement
  terms_accepted: boolean
}

export function DealerApplicationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState<DealerApplicationFormData>({
    business_name: '',
    business_type: '',
    business_address: '',
    city: '',
    state: '',
    pincode: '',
    business_phone: '',
    business_email: '',
    gst_number: '',
    pan_number: '',
    aadhar_number: '',
    current_business: '',
    experience_years: 0,
    investment_capacity: '',
    preferred_areas: [],
    why_partner: '',
    terms_accepted: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: 'business_license' | 'tax_certificate' | 'bank_statement'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFiles(prev => new Set(prev).add(documentType))
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const response = await fetch('/api/dealers/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload file')
      }

      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        [`${documentType}_url`]: data.url
      }))
    } catch (err: any) {
      setError(`Failed to upload ${documentType.replace('_', ' ')}: ${err.message}`)
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentType)
        return newSet
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.terms_accepted) {
      setError('You must accept the terms and conditions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dealers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Application Submitted Successfully!</h2>
            <p className="text-gray-600">
              Thank you for your interest in becoming an OMNI dealer. 
              We will review your application and get back to you within 3-5 business days.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="business_type">Business Type *</Label>
              <select
                id="business_type"
                name="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select business type</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="Limited Liability Partnership">Limited Liability Partnership</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="business_phone">Business Phone *</Label>
              <Input
                id="business_phone"
                name="business_phone"
                type="tel"
                value={formData.business_phone}
                onChange={handleInputChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div>
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                name="business_email"
                type="email"
                value={formData.business_email}
                onChange={handleInputChange}
                placeholder="business@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_address">Complete Business Address *</Label>
            <Textarea
              id="business_address"
              name="business_address"
              value={formData.business_address}
              onChange={handleInputChange}
              placeholder="Enter your complete business address"
              rows={3}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                pattern="[0-9]{6}"
                placeholder="123456"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleInputChange}
                placeholder="22AAAAA0000A1Z5"
                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
              />
            </div>
            <div>
              <Label htmlFor="pan_number">PAN Number</Label>
              <Input
                id="pan_number"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleInputChange}
                placeholder="ABCDE1234F"
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              />
            </div>
            <div>
              <Label htmlFor="aadhar_number">Aadhar Number</Label>
              <Input
                id="aadhar_number"
                name="aadhar_number"
                value={formData.aadhar_number}
                onChange={handleInputChange}
                placeholder="1234 5678 9012"
                pattern="[0-9]{4}\s[0-9]{4}\s[0-9]{4}"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience & Background */}
      <Card>
        <CardHeader>
          <CardTitle>Experience & Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current_business">Current Business Details *</Label>
            <Textarea
              id="current_business"
              name="current_business"
              value={formData.current_business}
              onChange={handleInputChange}
              placeholder="Describe your current business, products/services offered, target market, etc."
              rows={3}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="experience_years">Years of Experience in Business *</Label>
              <Input
                id="experience_years"
                name="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={handleInputChange}
                min="0"
                max="50"
                required
              />
            </div>
            <div>
              <Label htmlFor="investment_capacity">Investment Capacity *</Label>
              <select
                id="investment_capacity"
                name="investment_capacity"
                value={formData.investment_capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, investment_capacity: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select investment range</option>
                <option value="₹1-5 Lakhs">₹1-5 Lakhs</option>
                <option value="₹5-10 Lakhs">₹5-10 Lakhs</option>
                <option value="₹10-25 Lakhs">₹10-25 Lakhs</option>
                <option value="₹25-50 Lakhs">₹25-50 Lakhs</option>
                <option value="₹50 Lakhs+">₹50 Lakhs+</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="preferred_areas">Preferred Areas for Dealership (comma-separated)</Label>
            <Input
              id="preferred_areas"
              name="preferred_areas"
              value={formData.preferred_areas.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                preferred_areas: e.target.value.split(',').map(area => area.trim()).filter(area => area.length > 0)
              }))}
              placeholder="Area1, Area2, Area3"
            />
          </div>
          <div>
            <Label htmlFor="why_partner">Why do you want to partner with OMNI? *</Label>
            <Textarea
              id="why_partner"
              name="why_partner"
              value={formData.why_partner}
              onChange={handleInputChange}
              placeholder="Explain your motivation for becoming an OMNI dealer and how you plan to contribute to our growth..."
              rows={4}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_license">Business License</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="business_license"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'business_license')}
                  disabled={uploadingFiles.has('business_license')}
                />
                {formData.business_license_url && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadingFiles.has('business_license') && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="tax_certificate">Tax Certificate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax_certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'tax_certificate')}
                  disabled={uploadingFiles.has('tax_certificate')}
                />
                {formData.tax_certificate_url && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadingFiles.has('tax_certificate') && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="bank_statement">Bank Statement</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bank_statement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'bank_statement')}
                  disabled={uploadingFiles.has('bank_statement')}
                />
                {formData.bank_statement_url && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadingFiles.has('bank_statement') && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Tell us more about your business and why you want to become an OMNI dealer..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Terms and Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms_accepted"
              checked={formData.terms_accepted}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))
              }
            />
            <Label htmlFor="terms_accepted" className="text-sm">
              I agree to the OMNI Dealer Terms and Conditions and understand that my application
              will be reviewed by the OMNI team. I certify that all information provided is accurate
              and complete.
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <OmniButton
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </OmniButton>
          <OmniButton
            type="submit"
            disabled={loading || uploadingFiles.size > 0 || !formData.terms_accepted}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </OmniButton>
        </CardFooter>
      </Card>
    </form>
  )
}
