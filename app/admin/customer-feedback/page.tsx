'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Plus, Trash2, Eye, EyeOff, Star, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface CustomerFeedback {
  id: string
  name: string
  email?: string
  location: string
  rating: number
  feedback_text: string
  vehicle_purchased?: string
  photo_url?: string
  verified: boolean
  status: 'pending' | 'approved' | 'rejected'
  display_on_homepage: boolean
  created_at: string
}

export default function AdminCustomerFeedbackPage() {
  const [feedbacks, setFeedbacks] = React.useState<CustomerFeedback[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchFeedbacks = React.useCallback(async () => {
    try {
      console.log('Fetching customer feedback...')
      const response = await fetch('/api/admin/customer-feedback')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch feedbacks')
      }
      
      const data = await response.json()
      console.log('Fetched feedbacks:', data)
      setFeedbacks(data)
      
      if (data.length === 0) {
        toast('No feedback entries found. Add some to get started!', { icon: 'ℹ️' })
      }
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error)
      toast.error(error.message || 'Failed to load feedbacks')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  async function deleteFeedback(id: string) {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/customer-feedback/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete feedback')
      }
      toast.success('Feedback deleted successfully')
      await fetchFeedbacks()
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error('Failed to delete feedback')
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
    try {
      const response = await fetch(`/api/admin/customer-feedback/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      toast.success(`Feedback ${newStatus}`)
      await fetchFeedbacks()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  async function toggleHomepage(id: string, currentValue: boolean) {
    try {
      const response = await fetch(`/api/admin/customer-feedback/${id}/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_on_homepage: !currentValue }),
      })
      if (!response.ok) {
        throw new Error('Failed to toggle homepage display')
      }
      toast.success(`Homepage display ${!currentValue ? 'enabled' : 'disabled'}`)
      await fetchFeedbacks()
    } catch (error) {
      console.error('Error toggling homepage:', error)
      toast.error('Failed to update homepage display')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customer Feedback</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <OmniButton>
              <Plus className="h-4 w-4 mr-2" />
              Add Feedback
            </OmniButton>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer Feedback</DialogTitle>
            </DialogHeader>
            <AddFeedbackForm 
              onSuccess={() => {
                setIsAddDialogOpen(false)
                fetchFeedbacks()
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Customer Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 px-2">Name</th>
                  <th className="px-2">Location</th>
                  <th className="px-2">Rating</th>
                  <th className="px-2">Feedback</th>
                  <th className="px-2">Vehicle</th>
                  <th className="px-2">Status</th>
                  <th className="px-2">Homepage</th>
                  <th className="px-2">Date</th>
                  <th className="px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-6 text-center text-gray-600">Loading feedbacks...</td></tr>
                ) : feedbacks.map((f) => (
                  <tr key={f.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="font-medium">{f.name}</div>
                      {f.verified && <span className="text-xs text-emerald-600">✓ Verified</span>}
                    </td>
                    <td className="px-2 text-xs">{f.location}</td>
                    <td className="px-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </td>
                    <td className="px-2 max-w-xs">
                      <div className="truncate text-xs" title={f.feedback_text}>
                        {f.feedback_text}
                      </div>
                    </td>
                    <td className="px-2 text-xs">{f.vehicle_purchased || 'N/A'}</td>
                    <td className="px-2">
                      <button
                        onClick={() => toggleStatus(f.id, f.status)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          f.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : f.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {f.status}
                      </button>
                    </td>
                    <td className="px-2 text-center">
                      <button
                        onClick={() => toggleHomepage(f.id, f.display_on_homepage)}
                        className="text-gray-500 hover:text-emerald-600"
                        title={f.display_on_homepage ? 'Hide from homepage' : 'Show on homepage'}
                      >
                        {f.display_on_homepage ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-2 text-xs text-gray-500">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => deleteFeedback(f.id)}
                          disabled={deletingId === f.id}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && feedbacks.length === 0 && (
                  <tr><td colSpan={9} className="py-6 text-center text-gray-600">No feedbacks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddFeedbackForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    location: '',
    rating: 5,
    feedback_text: '',
    vehicle_purchased: '',
    photo_url: '',
    verified: false,
    status: 'approved' as 'pending' | 'approved' | 'rejected',
    display_on_homepage: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/customer-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create feedback')
      }

      toast.success('Feedback added successfully')
      onSuccess()
    } catch (error) {
      console.error('Error creating feedback:', error)
      toast.error('Failed to add feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, State"
            required
          />
        </div>
        <div>
          <Label htmlFor="rating">Rating *</Label>
          <select
            id="rating"
            className="w-full rounded-md border px-3 py-2"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
          >
            <option value={5}>5 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={2}>2 Stars</option>
            <option value={1}>1 Star</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="feedback_text">Feedback Text *</Label>
        <Textarea
          id="feedback_text"
          value={formData.feedback_text}
          onChange={(e) => setFormData({ ...formData, feedback_text: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicle_purchased">Vehicle Purchased</Label>
          <Input
            id="vehicle_purchased"
            value={formData.vehicle_purchased}
            onChange={(e) => setFormData({ ...formData, vehicle_purchased: e.target.value })}
            placeholder="OMNI Urban Pro"
          />
        </div>
        <div>
          <Label htmlFor="photo_url">Photo URL</Label>
          <Input
            id="photo_url"
            value={formData.photo_url}
            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            placeholder="/placeholder.svg"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.verified}
            onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Verified Customer</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.display_on_homepage}
            onChange={(e) => setFormData({ ...formData, display_on_homepage: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Display on Homepage</span>
        </label>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="w-full rounded-md border px-3 py-2"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <OmniButton type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Feedback'}
        </OmniButton>
      </div>
    </form>
  )
}
