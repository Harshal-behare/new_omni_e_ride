import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedSampleData() {
  console.log('Starting to seed sample data...')

  // Sample vehicles
  const vehicles = [
    {
      id: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'OMNI Urban Pro',
      slug: 'urban-pro',
      type: 'scooter',
      brand: 'OMNI',
      model: 'Urban Pro',
      price: 84999,
      discounted_price: 79999,
      description: 'Premium electric scooter for urban commute',
      range_km: 120,
      top_speed_kmph: 85,
      charging_time_hours: 4,
      battery_capacity: '3.2 kWh',
      motor_power: '3000W',
      status: 'active',
      stock_quantity: 50,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
      colors: ['Black', 'White', 'Blue'],
      features: {
        'safety': ['ABS', 'LED Lights', 'Disc Brakes'],
        'comfort': ['Digital Display', 'USB Charging', 'Mobile App']
      },
      specifications: {
        'dimensions': { 'length': '1850mm', 'width': '700mm', 'height': '1150mm' },
        'weight': '95kg',
        'warranty': '2 years'
      }
    },
    {
      id: 'v2c3d4e5-f6a7-8901-bcde-f23456789012',
      name: 'OMNI City Rider',
      slug: 'city-rider',
      type: 'scooter',
      brand: 'OMNI',
      model: 'City Rider',
      price: 74999,
      discounted_price: 69999,
      description: 'Affordable and efficient city transport',
      range_km: 110,
      top_speed_kmph: 80,
      charging_time_hours: 4,
      battery_capacity: '2.8 kWh',
      motor_power: '2500W',
      status: 'active',
      stock_quantity: 75,
      images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800'],
      colors: ['Red', 'Black', 'Silver'],
      features: {
        'safety': ['LED Lights', 'Disc Brakes'],
        'comfort': ['Digital Display', 'Storage Box']
      },
      specifications: {
        'dimensions': { 'length': '1800mm', 'width': '680mm', 'height': '1100mm' },
        'weight': '85kg',
        'warranty': '2 years'
      }
    },
    {
      id: 'v3d4e5f6-a7b8-9012-cdef-345678901234',
      name: 'OMNI Smart Series',
      slug: 'smart-series',
      type: 'scooter',
      brand: 'OMNI',
      model: 'Smart Series',
      price: 89999,
      discounted_price: 84999,
      description: 'Smart features for modern riders',
      range_km: 125,
      top_speed_kmph: 85,
      charging_time_hours: 4,
      battery_capacity: '3.4 kWh',
      motor_power: '3000W',
      status: 'active',
      stock_quantity: 30,
      images: ['https://images.unsplash.com/photo-1593764592116-bfb2a97c642a?w=800'],
      colors: ['Black', 'Green', 'Gray'],
      features: {
        'safety': ['ABS', 'LED Lights', 'Disc Brakes', 'GPS Tracking'],
        'comfort': ['Touch Display', 'USB Charging', 'Mobile App', 'Cruise Control'],
        'smart': ['IoT Connectivity', 'Remote Diagnostics', 'OTA Updates']
      },
      specifications: {
        'dimensions': { 'length': '1900mm', 'width': '720mm', 'height': '1200mm' },
        'weight': '98kg',
        'warranty': '3 years'
      }
    }
  ]

  // Sample dealers
  const dealers = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      business_name: 'Omni E-Ride Delhi Hub',
      business_address: '123 Main Street, Connaught Place',
      business_phone: '9876543210',
      business_email: 'delhi@omnieride.com',
      gst_number: 'GST123456789',
      pan_number: 'PAN123456',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      status: 'approved',
      commission_rate: 10.00,
      latitude: 28.6315,
      longitude: 77.2167
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      business_name: 'Omni E-Ride Mumbai Center',
      business_address: '456 Marine Drive',
      business_phone: '9876543211',
      business_email: 'mumbai@omnieride.com',
      gst_number: 'GST987654321',
      pan_number: 'PAN789012',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      status: 'approved',
      commission_rate: 10.00,
      latitude: 19.0760,
      longitude: 72.8777
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
      business_name: 'Omni E-Ride Bangalore Store',
      business_address: '789 MG Road',
      business_phone: '9876543212',
      business_email: 'bangalore@omnieride.com',
      gst_number: 'GST456789123',
      pan_number: 'PAN345678',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      status: 'approved',
      commission_rate: 10.00,
      latitude: 12.9716,
      longitude: 77.5946
    }
  ]

  try {
    // Insert vehicles
    console.log('Inserting vehicles...')
    for (const vehicle of vehicles) {
      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicle, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error inserting vehicle ${vehicle.name}:`, error)
      } else {
        console.log(`✓ Inserted vehicle: ${vehicle.name}`)
      }
    }

    // Insert dealers
    console.log('\nInserting dealers...')
    for (const dealer of dealers) {
      const { error } = await supabase
        .from('dealers')
        .upsert(dealer, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error inserting dealer ${dealer.business_name}:`, error)
      } else {
        console.log(`✓ Inserted dealer: ${dealer.business_name}`)
      }
    }

    console.log('\n✅ Sample data seeding completed!')
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

// Run the seed function
seedSampleData().then(() => {
  console.log('Done!')
  process.exit(0)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
