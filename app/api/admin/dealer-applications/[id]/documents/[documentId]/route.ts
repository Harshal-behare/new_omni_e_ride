import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the application to find the document path
    const { data: application, error: appError } = await supabase
      .from('dealer_applications')
      .select('documents')
      .eq('id', id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Find the document in the documents array
    const documents = application.documents || []
    const documentIndex = parseInt(documentId)
    
    if (isNaN(documentIndex) || documentIndex < 0 || documentIndex >= documents.length) {
      return NextResponse.json({ error: 'Invalid document index' }, { status: 400 })
    }

    const documentPath = documents[documentIndex]
    if (!documentPath) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Extract filename from path
    const fileName = documentPath.split('/').pop()
    if (!fileName) {
      return NextResponse.json({ error: 'Invalid document path' }, { status: 400 })
    }

    // Delete from storage (using correct bucket name)
    const { error: storageError } = await supabase.storage
      .from('dealer-documents')
      .remove([`${id}/${fileName}`])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue even if storage deletion fails
    }

    // Remove from documents array
    const updatedDocuments = documents.filter((_: string, index: number) => index !== documentIndex)

    // Update the application
    const { error: updateError } = await supabase
      .from('dealer_applications')
      .update({ documents: updatedDocuments })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
