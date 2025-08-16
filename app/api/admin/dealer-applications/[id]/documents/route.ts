import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get the application with documents
    const { data: application, error: fetchError } = await supabase
      .from('dealer_applications')
      .select('documents, user_id')
      .eq('id', id)
      .single()
    
    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
    // Delete documents from storage
    if (application.documents) {
      const filesToDelete = []
      
      // Extract file paths from URLs
      for (const [key, url] of Object.entries(application.documents)) {
        if (typeof url === 'string' && url.includes('/documents/')) {
          // Extract the file path from the URL
          const urlParts = url.split('/documents/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0] // Remove query params
            filesToDelete.push(filePath)
          }
        }
      }
      
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('documents')
          .remove(filesToDelete)
        
        if (deleteError) {
          console.error('Error deleting files:', deleteError)
          return NextResponse.json(
            { error: 'Failed to delete documents' },
            { status: 500 }
          )
        }
      }
    }
    
    // Clear documents from database
    const { error: updateError } = await supabase
      .from('dealer_applications')
      .update({ documents: null })
      .eq('id', id)
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
