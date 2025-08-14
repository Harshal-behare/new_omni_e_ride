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
  // Company Information
  company_name: string
  business_registration_number: string
  tax_id: string
  
  // Contact Information
  contact_name: string
  contact_email: string
  contact_phone: string
  
  // Address
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  postal_code: string
  country: string
  
  // Business Details
  years_in_business: number
  annual_revenue: string
  existing_brands: string[]
  showroom_size_sqft: number
  number_of_employees: number
  website_url: string
  
  // Documents
  business_license_url?: string
  tax_certificate_url?: string
  bank_statement_url?: string
  additional_documents?: string[]
  
  // Agreement
  terms_accepted: boolean
  notes: string
}

export function DealerApplicationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState<DealerApplicationFormData>({
    company_name: '',
    business_registration_number: '',
    tax_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    years_in_business: 0,
    annual_revenue: '',
    existing_brands: [],
    showroom_size_sqft: 0,
    number_of_employees: 0,
    website_url: '',
    terms_accepted: false,
    notes: ''
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
      // Process existing brands from comma-separated string to array
      const processedData = {
        ...formData,
        existing_brands: formData.existing_brands.length > 0 
          ? formData.existing_brands 
          : (document.getElementById('existing_brands') as HTMLInputElement)?.value
              .split(',')
              .map(b => b.trim())
              .filter(b => b.length > 0) || []
      }

      const response = await fetch('/api/dealers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
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

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="business_registration_number">Business Registration Number *</Label>
              <Input
                id="business_registration_number"
                name="business_registration_number"
                value={formData.business_registration_number}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                value={formData.website_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address_line1">Address Line 1 *</Label>
            <Input
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
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
              <Label htmlFor="state_province">State/Province *</Label>
              <Input
                id="state_province"
                name="state_province"
                value={formData.state_province}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="years_in_business">Years in Business</Label>
              <Input
                id="years_in_business"
                name="years_in_business"
                type="number"
                value={formData.years_in_business}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="annual_revenue">Annual Revenue Range</Label>
              <select
                id="annual_revenue"
                name="annual_revenue"
                value={formData.annual_revenue}
                onChange={(e) => setFormData(prev => ({ ...prev, annual_revenue: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select range</option>
                <option value="< $100K">Less than $100K</option>
                <option value="$100K - $500K">$100K - $500K</option>
                <option value="$500K - $1M">$500K - $1M</option>
                <option value="$1M - $5M">$1M - $5M</option>
                <option value="> $5M">More than $5M</option>
              </select>
            </div>
            <div>
              <Label htmlFor="showroom_size_sqft">Showroom Size (sq ft)</Label>
              <Input
                id="showroom_size_sqft"
                name="showroom_size_sqft"
                type="number"
                value={formData.showroom_size_sqft}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="number_of_employees">Number of Employees</Label>
              <Input
                id="number_of_employees"
                name="number_of_employees"
                type="number"
                value={formData.number_of_employees}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="existing_brands">Existing Brands (comma-separated)</Label>
            <Input
              id="existing_brands"
              name="existing_brands"
              placeholder="Brand1, Brand2, Brand3"
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
