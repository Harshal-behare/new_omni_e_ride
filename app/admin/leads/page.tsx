'use client'

import { useState, useEffect } from 'react'
import { getLeads, assignLeadToDealer, updateLeadStatus, type Lead, type LeadFilters } from '@/lib/api/leads'
import { OmniButton } from '@/components/ui/omni-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react'

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [filters, setFilters] = useState<LeadFilters>({
    status: [],
    priority: [],
    source: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  useEffect(() => {
    fetchLeads()
  }, [currentPage, filters])

  async function fetchLeads() {
    setLoading(true)
    try {
      const result = await getLeads({
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      })
      setLeads(result.leads)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignLead(leadId: string, dealerId: string) {
    try {
      await assignLeadToDealer(leadId, dealerId)
      await fetchLeads()
      setAssignDialogOpen(false)
      setSelectedLead(null)
    } catch (error) {
      console.error('Failed to assign lead:', error)
    }
  }

  async function handleUpdateStatus(leadId: string, status: Lead['status']) {
    try {
      await updateLeadStatus(leadId, status)
      await fetchLeads()
    } catch (error) {
      console.error('Failed to update lead status:', error)
    }
  }

  function getStatusBadge(status: Lead['status']) {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-indigo-100 text-indigo-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status}
      </span>
    )
  }

  function getPriorityBadge(priority: Lead['priority']) {
    return priority === 'urgent' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Urgent
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Normal
      </span>
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lead Management</h1>
        <p className="text-gray-600">Manage and track customer inquiries and leads</p>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm">Status</Label>
            <select 
              className="mt-1 w-full rounded-md border px-3 py-2"
              onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as Lead['status']] : [] })}
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Priority</Label>
            <select 
              className="mt-1 w-full rounded-md border px-3 py-2"
              onChange={(e) => setFilters({ ...filters, priority: e.target.value ? [e.target.value as Lead['priority']] : [] })}
            >
              <option value="">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Source</Label>
            <select 
              className="mt-1 w-full rounded-md border px-3 py-2"
              onChange={(e) => setFilters({ ...filters, source: e.target.value ? [e.target.value as Lead['source']] : [] })}
            >
              <option value="">All Sources</option>
              <option value="contact">Contact Form</option>
              <option value="inquiry">Inquiry</option>
              <option value="warranty">Warranty</option>
              <option value="test_ride">Test Ride</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Sort By</Label>
            <select 
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as LeadFilters['sortBy'] })}
            >
              <option value="created_at">Date Created</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">New Leads</div>
          <div className="text-2xl font-bold text-blue-600">
            {leads.filter(l => l.status === 'new').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Urgent</div>
          <div className="text-2xl font-bold text-red-600">
            {leads.filter(l => l.priority === 'urgent').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Converted</div>
          <div className="text-2xl font-bold text-green-600">
            {leads.filter(l => l.status === 'converted').length}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">ID: {lead.id.slice(0, 8)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {lead.subject}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getPriorityBadge(lead.priority)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 capitalize">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            // You can implement a modal here to show lead details
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                        {lead.status === 'new' && (
                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setAssignDialogOpen(true)
                              // Implement assign dialog
                            }}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Assign
                          </button>
                        )}
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as Lead['status'])}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="assigned">Assigned</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} leads
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === page 
                        ? 'bg-emerald-600 text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
