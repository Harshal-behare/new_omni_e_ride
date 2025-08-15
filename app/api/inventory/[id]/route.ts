import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory/[id] - Get inventory item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to inventory
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('inventory')
      .select(`
        id,
        vehicle_id,
        dealer_id,
        quantity,
        reserved_quantity,
        status,
        last_updated,
        created_at,
        vehicles(
          id,
          make,
          model,
          variant,
          year,
          price,
          specifications,
          images
        ),
        dealers(
          id,
          business_name,
          business_address,
          city,
          state,
          business_phone
        )
      `)
      .eq('id', id)

    // For dealers, only show their inventory
    if (profile?.role === 'dealer') {
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (dealerProfile) {
        query = query.eq('dealer_id', dealerProfile.id)
      }
    }

    const { data: inventory, error } = await query.single()

    if (error) {
      console.error('Error fetching inventory item:', error)
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    return NextResponse.json({ inventory })

  } catch (error) {
    console.error('Error in get inventory item API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to update inventory
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { quantity, reserved_quantity, status, action } = body

    // For dealers, ensure they can only update their own inventory
    if (profile?.role === 'dealer') {
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (dealerProfile) {
        // Check if this inventory item belongs to the dealer
        const { data: inventoryItem } = await supabase
          .from('inventory')
          .select('dealer_id')
          .eq('id', id)
          .single()
        
        if (!inventoryItem || inventoryItem.dealer_id !== dealerProfile.id) {
          return NextResponse.json({ error: 'Can only manage your own inventory' }, { status: 403 })
        }
      }
    }

    // Handle different actions
    let updateData: any = {
      last_updated: new Date().toISOString()
    }

    if (action) {
      // Get current inventory state
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity, reserved_quantity')
        .eq('id', id)
        .single()

      if (!currentInventory) {
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
      }

      switch (action) {
        case 'add_stock':
          if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Valid quantity required for add_stock action' }, { status: 400 })
          }
          updateData.quantity = currentInventory.quantity + quantity
          break

        case 'remove_stock':
          if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Valid quantity required for remove_stock action' }, { status: 400 })
          }
          const newQuantity = currentInventory.quantity - quantity
          if (newQuantity < 0) {
            return NextResponse.json({ error: 'Cannot remove more stock than available' }, { status: 400 })
          }
          updateData.quantity = newQuantity
          break

        case 'reserve':
          if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Valid quantity required for reserve action' }, { status: 400 })
          }
          const availableForReservation = currentInventory.quantity - currentInventory.reserved_quantity
          if (quantity > availableForReservation) {
            return NextResponse.json({ error: 'Not enough available stock to reserve' }, { status: 400 })
          }
          updateData.reserved_quantity = currentInventory.reserved_quantity + quantity
          break

        case 'unreserve':
          if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Valid quantity required for unreserve action' }, { status: 400 })
          }
          const newReservedQuantity = currentInventory.reserved_quantity - quantity
          if (newReservedQuantity < 0) {
            return NextResponse.json({ error: 'Cannot unreserve more than currently reserved' }, { status: 400 })
          }
          updateData.reserved_quantity = newReservedQuantity
          break

        case 'sell':
          if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Valid quantity required for sell action' }, { status: 400 })
          }
          // Sell from available stock (quantity - reserved)
          const availableToSell = currentInventory.quantity - currentInventory.reserved_quantity
          if (quantity > availableToSell) {
            return NextResponse.json({ error: 'Not enough available stock to sell' }, { status: 400 })
          }
          updateData.quantity = currentInventory.quantity - quantity
          break

        default:
          return NextResponse.json({ error: 'Invalid action. Supported: add_stock, remove_stock, reserve, unreserve, sell' }, { status: 400 })
      }
    } else {
      // Direct update of fields
      if (quantity !== undefined) updateData.quantity = quantity
      if (reserved_quantity !== undefined) updateData.reserved_quantity = reserved_quantity
      if (status) updateData.status = status

      // Validate quantities
      if (updateData.quantity !== undefined && updateData.quantity < 0) {
        return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
      }
      if (updateData.reserved_quantity !== undefined && updateData.reserved_quantity < 0) {
        return NextResponse.json({ error: 'Reserved quantity cannot be negative' }, { status: 400 })
      }
    }

    const { data: updatedInventory, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory:', error)
      return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Inventory updated successfully',
      inventory: updatedInventory 
    })

  } catch (error) {
    console.error('Error in update inventory API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to delete inventory
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For dealers, ensure they can only delete their own inventory
    if (profile?.role === 'dealer') {
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (dealerProfile) {
        // Check if this inventory item belongs to the dealer
        const { data: inventoryItem } = await supabase
          .from('inventory')
          .select('dealer_id')
          .eq('id', id)
          .single()
        
        if (!inventoryItem || inventoryItem.dealer_id !== dealerProfile.id) {
          return NextResponse.json({ error: 'Can only manage your own inventory' }, { status: 403 })
        }
      }
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting inventory:', error)
      return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Inventory item deleted successfully' })

  } catch (error) {
    console.error('Error in delete inventory API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
