'use client'

import { useState, useEffect } from 'react'
import { DealerApplicationForm } from '@/components/dealer/dealer-application-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

export default function DealerApplicationPage() {
  const [loading, setLoading] = useState(true)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkExistingApplication()
  }, [])

  async function checkExistingApplication() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
      }

      // Check for existing application
      const { data: application } = await supabase
        .from('dealer_applications')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (application) {
        setExistingApplication(application)
      }
    } catch (error) {
      console.error('Error checking application:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // If user is already a dealer
  if (userRole === 'dealer') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dealer Status</h1>
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">You are an approved dealer!</h2>
              <p className="text-gray-600">
                You have full access to the dealer dashboard and features.
              </p>
              <a href="/dealer" className="text-emerald-600 hover:underline">
                Go to Dealer Dashboard →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user has an existing application
  if (existingApplication) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        message: 'Your application is pending review. We will notify you once it has been processed.'
      },
      under_review: {
        icon: AlertCircle,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        message: 'Your application is currently under review by our team.'
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        message: 'Congratulations! Your dealer application has been approved.'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        message: existingApplication.rejection_reason || 'Your application was not approved at this time.'
      }
    }

    const status = statusConfig[existingApplication.status as keyof typeof statusConfig]
    const StatusIcon = status.icon

    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dealer Application Status</h1>
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Application Details</CardTitle>
              <Badge className={`${status.bgColor} ${status.color} border ${status.borderColor}`}>
                {existingApplication.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${status.bgColor} border ${status.borderColor} mb-6`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-5 w-5 ${status.color} mt-0.5`} />
                <div>
                  <p className="font-medium">{status.message}</p>
                  {existingApplication.approved_at && (
                    <p className="text-sm text-gray-600 mt-1">
                      Processed on: {new Date(existingApplication.approved_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-gray-600">Application ID:</span>
                  <p className="font-medium">{existingApplication.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <p className="font-medium">
                    {new Date(existingApplication.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Company Information</h3>
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div>
                    <span className="text-gray-600">Company Name:</span>
                    <p className="font-medium">{existingApplication.company_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Registration Number:</span>
                    <p className="font-medium">{existingApplication.business_registration_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <p className="font-medium">{existingApplication.contact_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{existingApplication.contact_email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{existingApplication.contact_phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">
                      {existingApplication.city}, {existingApplication.state_province}
                    </p>
                  </div>
                </div>
              </div>

              {existingApplication.status === 'rejected' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    If you would like to discuss your application or submit a new one, 
                    please contact our support team.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show the application form for new applicants
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Become an OMNI Dealer</h1>
      <p className="text-gray-600 mb-6">
        Join our network of authorized dealers and grow your business with OMNI's innovative electric vehicles.
      </p>
      <DealerApplicationForm />
    </div>
  )
}
