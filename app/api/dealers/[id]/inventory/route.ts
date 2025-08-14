import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDealerInventory, updateDealerInventory } from '@/lib/api/dealers'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Dealers can view their own inventory, admins can view all
    if (profile.role === 'dealer' && id !== user.id) {
      return NextResponse.json(
        { error: 'You can only view your own inventory' },
        { status: 403 }
      )
    }
    
    if (!['dealer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get inventory
    const inventory = await getDealerInventory(id)
    
    return NextResponse.json(
      { data: inventory },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error fetching dealer inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Dealers can update their own inventory, admins can update all
    if (profile.role === 'dealer' && id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own inventory' },
        { status: 403 }
      )
    }
    
    if (!['dealer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    if (!body.vehicle_id) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }
    
    // Update inventory
    const inventory = await updateDealerInventory(
      id,
      body.vehicle_id,
      {
        quantity: body.quantity,
        reserved_quantity: body.reserved_quantity,
        sold_quantity: body.sold_quantity,
        dealer_price: body.dealer_price,
        minimum_price: body.minimum_price,
        is_active: body.is_active !== undefined ? body.is_active : true
      }
    )
    
    return NextResponse.json(
      {
        message: 'Inventory updated successfully',
        data: inventory
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error updating dealer inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Dealers can update their own inventory, admins can update all
    if (profile.role === 'dealer' && id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own inventory' },
        { status: 403 }
      )
    }
    
    if (!['dealer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get vehicle_id from query params
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicle_id')
    
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }
    
    // Soft delete by setting is_active to false
    const inventory = await updateDealerInventory(
      id,
      vehicleId,
      { is_active: false }
    )
    
    return NextResponse.json(
      {
        message: 'Inventory item removed successfully',
        data: inventory
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error deleting dealer inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory' },
      { status: 500 }
    )
  }
}
