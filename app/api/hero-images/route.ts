import { NextResponse } from 'next/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Use browser client for public storage access
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('=== Hero Images API Called ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Fetching images from hero-section bucket...')
    
    // List all files from the hero-section bucket
    const { data: files, error } = await supabase.storage
      .from('hero-section')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    
    console.log('Storage list response - Error:', error)
    console.log('Storage list response - Files:', files)
    
    if (error) {
      console.error('❌ Error fetching hero images:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: error.message, 
        details: 'Make sure the "hero-section" bucket exists in Supabase Storage',
        images: [] 
      }, { status: 200 })
    }
    
    if (!files || files.length === 0) {
      console.log('No files found in hero-section bucket')
      return NextResponse.json({ images: [] })
    }
    
    console.log(`Found ${files.length} files in hero-section bucket`)
    
    // Generate public URLs for all images
    const imageUrls = files
      .filter(file => {
        // Filter only image files
        const ext = file.name.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
      })
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('hero-section')
          .getPublicUrl(file.name)
        
        return {
          url: publicUrl,
          name: file.name
        }
      })
    
    console.log(`Returning ${imageUrls.length} image URLs`)
    if (imageUrls.length > 0) {
      console.log('First image URL:', imageUrls[0].url)
    }
    
    return NextResponse.json({ images: imageUrls })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
