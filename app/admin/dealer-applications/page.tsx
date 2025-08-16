'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { 
  Eye, Download, Trash2, FileText, Building2, Phone, Mail, 
  MapPin, Calendar, CheckCircle, XCircle, Clock, User,
  CreditCard, FileCheck, Briefcase
} from 'lucide-react'
import { format } from 'date-fns'

interface DealerApplication {
  id: string
  user_id: string
  business_name: string
  business_address?: string
  business_type: string
  business_phone?: string
  business_email?: string
  city?: string
  state?: string
  pincode?: string
  gst_number?: string
  pan_number?: string
  aadhar_number?: string
  current_business?: string
  experience_years?: number
  investment_capacity?: string
  preferred_areas?: string[]
  why_partner?: string
  documents?: string[]
  documentUrls?: {
    path: string
    url: string
    name: string
  }[]
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  terms_accepted: boolean
  terms_accepted_at?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    city?: string
    state?: string
  }
}

export default function AdminDealerApplicationsPage() {
  const [apps, setApps] = React.useState<DealerApplication[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [selectedApp, setSelectedApp] = React.useState<DealerApplication | null>(null)
  const [deletingDocs, setDeletingDocs] = React.useState(false)
  const [deletingDocId, setDeletingDocId] = React.useState<number | null>(null)

  const fetchApplications = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dealer-applications')
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      const data = await response.json()
      setApps(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  async function approve(app: DealerApplication) {
    setProcessingId(app.id)
    try {
      const response = await fetch(`/api/admin/dealer-applications/${app.id}/approve`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to approve application')
      }
      await fetchApplications()
      toast.success(`Application approved. ${app.user.email} is now a Dealer.`)
      setSelectedApp(null)
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error('Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  async function decline(app: DealerApplication) {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return
    
    setProcessingId(app.id)
    try {
      const response = await fetch(`/api/admin/dealer-applications/${app.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) {
        throw new Error('Failed to reject application')
      }
      await fetchApplications()
      toast.success('Application rejected.')
      setSelectedApp(null)
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  async function deleteDocument(appId: string, docIndex: number) {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }
    
    setDeletingDocId(docIndex)
    try {
      const response = await fetch(`/api/admin/dealer-applications/${appId}/documents/${docIndex}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      await fetchApplications()
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    } finally {
      setDeletingDocId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      approved: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null }
    
    return (
      <Badge className={`flex items-center gap-1 ${config.color}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dealer Applications</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Review & Action</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead><tr className="text-left text-gray-600">
                <th className="py-2">Application #</th><th>Applicant</th><th>Business</th><th>Location</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-600">Loading applications...</td></tr>
                ) : apps.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium">#{a.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500">ID: {a.id}</div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{a.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-600">{a.user?.email}</div>
                      {a.user?.phone && (
                        <div className="text-xs text-gray-500">{a.user.phone}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{a.business_name}</div>
                      <div className="text-sm text-gray-600">{a.business_type}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">{a.city || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{a.state}</div>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        {format(new Date(a.created_at), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(a.created_at), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedApp(a)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {a.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => decline(a)}
                              disabled={processingId === a.id}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approve(a)}
                              disabled={processingId === a.id}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && apps.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-600">No applications yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Approving an application promotes the user to Dealer role. An email notification will be sent.</p>
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Dealer Application Details</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Application #{selectedApp.id.slice(0, 8)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedApp(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className="font-semibold">Status:</span>
                {getStatusBadge(selectedApp.status)}
                {selectedApp.rejection_reason && (
                  <div className="text-sm text-red-600">
                    Reason: {selectedApp.rejection_reason}
                  </div>
                )}
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedApp.user?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedApp.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedApp.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">
                      {selectedApp.user?.city}, {selectedApp.user?.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <p className="font-medium">{selectedApp.business_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Business Type:</span>
                    <p className="font-medium">{selectedApp.business_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedApp.business_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedApp.business_email || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <p className="font-medium">
                      {selectedApp.business_address || 'N/A'}<br />
                      {selectedApp.city}, {selectedApp.state} - {selectedApp.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tax & Legal Information
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">GST Number:</span>
                    <p className="font-medium font-mono">{selectedApp.gst_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">PAN Number:</span>
                    <p className="font-medium font-mono">{selectedApp.pan_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Aadhar Number:</span>
                    <p className="font-medium font-mono">{selectedApp.aadhar_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Business Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Current Business:</span>
                    <p className="font-medium">{selectedApp.current_business || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <p className="font-medium">{selectedApp.experience_years} years</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Investment Capacity:</span>
                    <p className="font-medium">{selectedApp.investment_capacity || 'N/A'}</p>
                  </div>
                  {selectedApp.preferred_areas && selectedApp.preferred_areas.length > 0 && (
                    <div>
                      <span className="text-gray-600">Preferred Areas:</span>
                      <p className="font-medium">{selectedApp.preferred_areas.join(', ')}</p>
                    </div>
                  )}
                  {selectedApp.why_partner && (
                    <div>
                      <span className="text-gray-600">Why Partner With Us:</span>
                      <p className="font-medium mt-1">{selectedApp.why_partner}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Uploaded Documents
                  </h3>
                </div>
                
                {selectedApp.documentUrls && selectedApp.documentUrls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApp.documentUrls.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteDocument(selectedApp.id, index)}
                            disabled={deletingDocId === index}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => downloadDocument(doc.url, doc.name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No documents uploaded
                  </div>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">
                    Terms accepted on {selectedApp.terms_accepted_at ? 
                      format(new Date(selectedApp.terms_accepted_at), 'dd MMM yyyy, hh:mm a') : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApp.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => decline(selectedApp)}
                    disabled={processingId === selectedApp.id}
                  >
                    Decline Application
                  </Button>
                  <Button
                    onClick={() => approve(selectedApp)}
                    disabled={processingId === selectedApp.id}
                  >
                    {processingId === selectedApp.id ? 'Processing...' : 'Approve Application'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
