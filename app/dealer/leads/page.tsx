'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OmniButton } from '@/components/ui/omni-button'
import { toast } from 'react-hot-toast'
import { 
  Search, Phone, Mail, Calendar, User, AlertCircle, 
  CheckCircle2, Clock, ChevronRight, Filter, Loader2,
  TrendingUp, ClipboardList, UserCheck, UserX,
  ChevronDown, ChevronUp, Car, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  city?: string
  state?: string
  vehicle?: {
    id: string
    name: string
    model: string
    price: number
  }
  source: string
  status: 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'closed'
  priority: 'normal' | 'urgent'
  notes?: string
  contacted_at?: string
  qualified_at?: string
  converted_at?: string
  lost_reason?: string
  created_at: string
  updated_at: string
}

export default function DealerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    closed: 0
  })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Lead['status']>('all')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [updateNotes, setUpdateNotes] = useState('')
  const [lostReason, setLostReason] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [filter])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/dealer/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
        setStats(data.stats || stats)
      } else {
        toast.error('Failed to load leads')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Error loading leads')
    } finally {
      setLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const body: any = { leadId, status }
      if (status === 'closed' && lostReason) {
        body.lost_reason = lostReason
      }
      if (updateNotes) {
        body.notes = updateNotes
      }

      const response = await fetch('/api/dealer/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(`Lead status updated to ${status}`)
        await fetchLeads()
        setSelectedLead(null)
        setUpdateNotes('')
        setLostReason('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    }
  }

  const updateLeadPriority = async (leadId: string, priority: Lead['priority']) => {
    try {
      const response = await fetch('/api/dealer/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, priority })
      })

      if (response.ok) {
        toast.success('Lead priority updated')
        await fetchLeads()
      } else {
        toast.error('Failed to update priority')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
    }
  }

  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      assigned: { color: 'bg-yellow-100 text-yellow-800', icon: User },
      contacted: { color: 'bg-purple-100 text-purple-800', icon: Phone },
      qualified: { color: 'bg-indigo-100 text-indigo-800', icon: UserCheck },
      converted: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      closed: { color: 'bg-gray-100 text-gray-800', icon: UserX }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: Lead['priority']) => {
    return priority === 'urgent' ? (
      <Badge className="bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Urgent
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Normal</Badge>
    )
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'contact': return <Mail className="h-4 w-4" />
      case 'test_ride': return <Car className="h-4 w-4" />
      case 'inquiry': return <MessageSquare className="h-4 w-4" />
      default: return <ClipboardList className="h-4 w-4" />
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = search === '' || 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search)
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-gray-600">Manage and track your assigned leads</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              className="rounded-lg border pl-9 pr-3 py-2" 
              placeholder="Search leads..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('new')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-gray-600">New</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('contacted')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.contacted}</div>
            <div className="text-sm text-gray-600">Contacted</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('qualified')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.qualified}</div>
            <div className="text-sm text-gray-600">Qualified</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('converted')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <div className="text-sm text-gray-600">Converted</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('closed')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'new', 'contacted', 'qualified', 'converted', 'closed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              filter === status
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leads Found</h3>
            <p className="text-gray-600">No leads match your current filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        {getStatusBadge(lead.status)}
                        {getPriorityBadge(lead.priority)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(lead.source)}
                          {lead.source.replace('_', ' ').charAt(0).toUpperCase() + lead.source.replace('_', ' ').slice(1)}
                        </div>
                      </div>
                      {lead.vehicle && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Interested in:</span>{' '}
                          <span className="font-medium">{lead.vehicle.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {expandedLead === lead.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedLead === lead.id && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Lead Details</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600">Location:</span>{' '}
                            {lead.city && lead.state ? `${lead.city}, ${lead.state}` : 'Not provided'}
                          </p>
                          <p>
                            <span className="text-gray-600">Created:</span>{' '}
                            {format(new Date(lead.created_at), 'PPP')}
                          </p>
                          {lead.contacted_at && (
                            <p>
                              <span className="text-gray-600">Contacted:</span>{' '}
                              {format(new Date(lead.contacted_at), 'PPP')}
                            </p>
                          )}
                          {lead.qualified_at && (
                            <p>
                              <span className="text-gray-600">Qualified:</span>{' '}
                              {format(new Date(lead.qualified_at), 'PPP')}
                            </p>
                          )}
                          {lead.converted_at && (
                            <p>
                              <span className="text-gray-600">Converted:</span>{' '}
                              {format(new Date(lead.converted_at), 'PPP')}
                            </p>
                          )}
                          {lead.lost_reason && (
                            <p>
                              <span className="text-gray-600">Lost Reason:</span>{' '}
                              {lead.lost_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Actions</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Update Status:</span>
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                if (e.target.value === 'closed') {
                                  setSelectedLead(lead)
                                } else {
                                  updateLeadStatus(lead.id, e.target.value as Lead['status'])
                                }
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Priority:</span>
                            <button
                              onClick={() => updateLeadPriority(lead.id, lead.priority === 'normal' ? 'urgent' : 'normal')}
                              className={cn(
                                'text-sm px-3 py-1 rounded-full transition-colors',
                                lead.priority === 'urgent' 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              )}
                            >
                              {lead.priority === 'urgent' ? 'Mark as Normal' : 'Mark as Urgent'}
                            </button>
                          </div>
                          
                          {lead.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Notes:</p>
                              <p className="text-sm mt-1 p-2 bg-white rounded border">{lead.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Close Lead Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Close Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Reason for Closing *</label>
                  <textarea
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    rows={3}
                    placeholder="Please provide a reason for closing this lead..."
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <textarea
                    className="w-full mt-1 rounded-lg border px-3 py-2"
                    rows={2}
                    placeholder="Any additional notes..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <OmniButton
                    onClick={() => updateLeadStatus(selectedLead.id, 'closed')}
                    disabled={!lostReason.trim()}
                  >
                    Close Lead
                  </OmniButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedLead(null)
                      setLostReason('')
                      setUpdateNotes('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
