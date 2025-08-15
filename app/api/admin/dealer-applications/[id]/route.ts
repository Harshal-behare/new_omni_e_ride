import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE - Delete dealer application and associated documents
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get application to find user_id for document deletion
    const { data: application } = await supabase
      .from('dealer_applications')
      .select('user_id, documents')
      .eq('id', id)
      .single()

    if (application) {
      // Delete documents from storage if they exist
      if (application.documents && typeof application.documents === 'object') {
        const documentUrls = Object.values(application.documents) as string[]
        for (const url of documentUrls) {
          // Extract file path from URL
          const urlParts = url.split('/storage/v1/object/public/dealer-documents/')
          if (urlParts[1]) {
            await supabase.storage
              .from('dealer-documents')
              .remove([urlParts[1]])
          }
        }
      }
    }

    // Delete the application
    const { error: deleteError } = await supabase
      .from('dealer_applications')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ message: 'Application deleted successfully' })

  } catch (error) {
    console.error('Error deleting dealer application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
