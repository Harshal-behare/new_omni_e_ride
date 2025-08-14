'use client'

import { useState, useEffect } from 'react'
import { getLeads, updateLeadStatus, updateLeadNotes, type Lead } from '@/lib/api/leads'
import { OmniButton } from '@/components/ui/omni-button'
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2,
  MessageSquare,
  Clock
} from 'lucide-react'

export default function DealerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText, setNoteText] = useState('')
  const [updatingNote, setUpdatingNote] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    setLoading(true)
    try {
      const result = await getLeads({
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      // Dealer-specific filtering is handled by the API based on authentication
      setLeads(result.leads)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
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

  async function handleAddNote(leadId: string) {
    if (!noteText.trim()) return
    
    setUpdatingNote(true)
    try {
      const lead = leads.find(l => l.id === leadId)
      const existingNotes = lead?.notes || ''
      const timestamp = new Date().toLocaleString()
      const newNotes = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}] ${noteText}`
        : `[${timestamp}] ${noteText}`
      
      await updateLeadNotes(leadId, newNotes)
      setNoteText('')
      await fetchLeads()
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setUpdatingNote(false)
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

  const newLeads = leads.filter(l => l.status === 'new' || l.status === 'assigned')
  const activeLeads = leads.filter(l => l.status === 'contacted' || l.status === 'qualified')
  const closedLeads = leads.filter(l => l.status === 'converted' || l.status === 'closed')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Leads</h1>
        <p className="text-gray-600">Manage and follow up on your assigned leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold">{leads.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">New/Assigned</div>
          <div className="text-2xl font-bold text-blue-600">{newLeads.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-purple-600">{activeLeads.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-gray-600">{closedLeads.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          No leads assigned to you yet
        </div>
      ) : (
        <div className="space-y-6">
          {/* New/Assigned Leads */}
          {newLeads.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-600">New & Assigned Leads ({newLeads.length})</h2>
              <div className="space-y-3">
                {newLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    isExpanded={selectedLead?.id === lead.id}
                    onToggleExpand={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Leads */}
          {activeLeads.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-purple-600">Active Leads ({activeLeads.length})</h2>
              <div className="space-y-3">
                {activeLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    isExpanded={selectedLead?.id === lead.id}
                    onToggleExpand={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Closed Leads */}
          {closedLeads.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-600">Closed Leads ({closedLeads.length})</h2>
              <div className="space-y-3">
                {closedLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    isExpanded={selectedLead?.id === lead.id}
                    onToggleExpand={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LeadCard({ 
  lead, 
  onUpdateStatus, 
  onAddNote,
  isExpanded,
  onToggleExpand
}: { 
  lead: Lead
  onUpdateStatus: (id: string, status: Lead['status']) => void
  onAddNote: (id: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const [noteText, setNoteText] = useState('')
  
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              {lead.priority === 'urgent' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Urgent
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                lead.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                lead.status === 'qualified' ? 'bg-indigo-100 text-indigo-800' :
                lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lead.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {lead.email}
                <span className="text-gray-400">•</span>
                <Phone className="h-3 w-3" />
                {lead.phone}
              </div>
              <div className="font-medium">{lead.subject}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3 bg-gray-50">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Message</h4>
              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                {lead.message}
              </p>
            </div>

            {lead.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                <pre className="text-sm text-gray-600 bg-white p-2 rounded border whitespace-pre-wrap">
                  {lead.notes}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Update Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                  className="mt-1 w-full text-sm border rounded px-3 py-2"
                >
                  <option value="assigned">Assigned</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Add Note</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 text-sm border rounded px-3 py-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && noteText.trim()) {
                        onAddNote(lead.id)
                        setNoteText('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (noteText.trim()) {
                        onAddNote(lead.id)
                        setNoteText('')
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Mail className="h-3 w-3" />
                Send Email
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
