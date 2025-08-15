'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { Loader2, MessageSquare, Phone, Mail, Clock, CheckCircle } from 'lucide-react'

interface ContactInquiry {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: string
  response: string | null
  created_at: string
  updated_at: string
}

export default function SupportPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/contact-inquiries')
      if (response.ok) {
        const data = await response.json()
        setInquiries(data)
      } else {
        console.error('Failed to fetch inquiries')
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
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
    setSubmitting(true)

    try {
      const response = await fetch('/api/contact-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
        // Refresh inquiries list
        fetchInquiries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      toast.error('An error occurred while submitting your inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Center</h1>
          <p className="text-gray-600">Get help with your orders, test rides, and more</p>
        </div>
      </div>

      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="info">Contact Info</TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Submit Support Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name *">
                    <input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                      placeholder="Enter your full name"
                    />
                  </Field>
                  <Field label="Email *">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                      placeholder="Enter your email address"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone Number">
                    <input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="Enter your phone number"
                      pattern="[6-9][0-9]{9}"
                      title="Please enter a valid 10-digit Indian phone number"
                    />
                  </Field>
                  <Field label="Subject *">
                    <select
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="Order Issue">Order Issue</option>
                      <option value="Test Ride Support">Test Ride Support</option>
                      <option value="Payment Problem">Payment Problem</option>
                      <option value="Vehicle Information">Vehicle Information</option>
                      <option value="Account Support">Account Support</option>
                      <option value="Warranty Claim">Warranty Claim</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>

                <Field label="Message *">
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    rows={6}
                    required
                    placeholder="Please describe your issue or question in detail..."
                    minLength={10}
                  />
                </Field>

                <OmniButton type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </OmniButton>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inquiries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No support tickets yet</p>
                  <p className="text-sm text-gray-500">
                    Submit a support request and it will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{inquiry.subject}</h3>
                          <p className="text-sm text-gray-600">
                            Submitted on {new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {inquiry.message}
                      </p>
                      {inquiry.response && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Support Response
                            </span>
                          </div>
                          <p className="text-sm text-green-700">{inquiry.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">Customer Care</p>
                  <p className="text-lg text-emerald-600">+91 12345 67890</p>
                </div>
                <div>
                  <p className="font-medium">Technical Support</p>
                  <p className="text-lg text-emerald-600">+91 12345 67891</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Hours:</strong> Monday - Saturday, 9:00 AM - 8:00 PM</p>
                  <p><strong>Sunday:</strong> 10:00 AM - 6:00 PM</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">General Support</p>
                  <p className="text-emerald-600">support@omnideride.com</p>
                </div>
                <div>
                  <p className="font-medium">Technical Issues</p>
                  <p className="text-emerald-600">tech@omnideride.com</p>
                </div>
                <div>
                  <p className="font-medium">Business Inquiries</p>
                  <p className="text-emerald-600">business@omnideride.com</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800 mb-1">{label}</div>
      {children}
    </label>
  )
}
