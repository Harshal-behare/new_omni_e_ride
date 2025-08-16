import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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

    // Fetch all dealer applications with user info
  const { data: applications, error } = await supabase
    .from('dealer_applications')
    .select(`
      *,
      user:profiles!dealer_applications_user_id_fkey(
        id,
        email,
        name,
        phone,
        city,
        state
      )
    `)
    .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Add document URLs for each application
    const applicationsWithUrls = await Promise.all(
      (applications || []).map(async (application) => {
        if (!application.documents || application.documents.length === 0) {
          return { ...application, documentUrls: [] }
        }

        // Generate signed URLs for each document
        const documentUrls = await Promise.all(
          (Array.isArray(application.documents) ? application.documents : []).map(async (docPath: string) => {
            const fileName = docPath.split('/').pop()
            const { data, error } = await supabase.storage
              .from('dealer-documents')
              .createSignedUrl(`${application.id}/${fileName}`, 3600) // 1 hour expiry
            
            if (error) {
              console.error(`Error creating signed URL for ${docPath}:`, error)
              return null
            }
            
            return {
              path: docPath,
              url: data?.signedUrl,
              name: fileName
            }
          })
        )

        return {
          ...application,
          documentUrls: documentUrls.filter(doc => doc !== null)
        }
      })
    )

    return NextResponse.json(applicationsWithUrls)

  } catch (error) {
    console.error('Error fetching dealer applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealer applications' },
      { status: 500 }
    )
  }
}
