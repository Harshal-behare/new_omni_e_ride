import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const vehicleId = formData.get('vehicleId') as string
    
    if (!file || !vehicleId) {
      return NextResponse.json(
        { error: 'File and vehicle ID are required' },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `vehicles/${vehicleId}/${Date.now()}.${fileExt}`
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('scooter-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('scooter-images')
      .getPublicUrl(fileName)
    
    // Update vehicle with new image
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('images')
      .eq('id', vehicleId)
      .single()
    
    const currentImages = vehicle?.images || []
    const updatedImages = [...currentImages, publicUrl]
    
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ 
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
    
    if (updateError) {
      // If update fails, delete the uploaded image
      await supabase.storage
        .from('scooter-images')
        .remove([fileName])
        
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      url: publicUrl,
      path: fileName
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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
    
    const body = await request.json()
    const { vehicleId, imageUrl } = body
    
    if (!vehicleId || !imageUrl) {
      return NextResponse.json(
        { error: 'Vehicle ID and image URL are required' },
        { status: 400 }
      )
    }
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/scooter-images/')
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }
    
    const filePath = urlParts[1].split('?')[0]
    
    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('scooter-images')
      .remove([filePath])
    
    if (deleteError) {
      console.error('Error deleting image:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    // Update vehicle to remove image URL
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('images')
      .eq('id', vehicleId)
      .single()
    
    const currentImages = vehicle?.images || []
    const updatedImages = currentImages.filter((img: string) => img !== imageUrl)
    
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ 
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
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
