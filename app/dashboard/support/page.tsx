'use client'

import { OmniButton } from '@/components/ui/omni-button'

export default function SupportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Support</h1>
      <p className="mt-2 text-gray-700">Create a ticket and our team will get back within 24 hours.</p>
      <form onSubmit={(e) => { e.preventDefault(); alert('Ticket created (demo)') }} className="mt-4 grid gap-3 max-w-xl">
        <label className="text-sm">
          <div className="font-medium">Subject</div>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          <div className="font-medium">Description</div>
          <textarea rows={5} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <OmniButton type="submit">Submit</OmniButton>
      </form>
    </div>
  )
}
