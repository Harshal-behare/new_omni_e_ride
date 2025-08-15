-- Insert demo vehicles
INSERT INTO vehicles (
    name, slug, type, brand, model, price, discounted_price, description, 
    features, specifications, images, colors, status, stock_quantity, 
    range_km, top_speed_kmph, charging_time_hours, battery_capacity, motor_power
) VALUES
    -- E-Max Pro
    ('E-Max Pro', 'e-max-pro', 'electric_scooter', 'OmniRide', 'Max Pro 2024', 
     75000, 69999, 'Premium electric scooter with advanced features and long range. Perfect for daily commuters who need reliability and style.',
     '{"keyless_start": true, "led_lights": true, "digital_display": true, "mobile_app": true, "cruise_control": true, "reverse_mode": true, "usb_charging": true, "anti_theft_alarm": true}'::jsonb,
     '{"weight": "95kg", "load_capacity": "150kg", "warranty": "3 years", "brakes": "Disc brakes (Front & Rear)", "suspension": "Telescopic front, Twin rear", "tyre_size": "90/90-12", "ground_clearance": "165mm"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/Omi-main.jpg', 
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/Omi-2.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/e-max-pro-3.jpg'],
     ARRAY['Midnight Black', 'Pearl White', 'Racing Red', 'Ocean Blue'],
     'active', 50, 120, 80, 4.5, '3.2 kWh Lithium-ion', '3000W BLDC Motor'),
    
    -- City Cruiser
    ('City Cruiser', 'city-cruiser', 'electric_bike', 'OmniRide', 'Cruiser 2024', 
     55000, 52999, 'Efficient and stylish electric bike designed for urban mobility. Navigate through city traffic with ease.',
     '{"regenerative_braking": true, "usb_charging": true, "anti_theft": true, "led_display": true, "mobile_connectivity": false, "parking_assist": true}'::jsonb,
     '{"weight": "85kg", "load_capacity": "130kg", "warranty": "2 years", "brakes": "Drum brake (Front), Disc brake (Rear)", "suspension": "Telescopic front", "tyre_size": "3.00-10", "ground_clearance": "155mm"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/Zeno-main.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/city-cruiser-2.jpg'],
     ARRAY['Urban Grey', 'Forest Green', 'Sky Blue'],
     'active', 75, 80, 60, 3.5, '2.5 kWh Lithium-ion', '2000W Hub Motor'),
    
    -- Eco Rider
    ('Eco Rider', 'eco-rider', 'electric_scooter', 'OmniRide', 'Eco 2024',
     45000, 42999, 'Budget-friendly electric scooter without compromising on quality. Ideal for short to medium distance travel.',
     '{"led_lights": true, "digital_display": true, "usb_charging": true, "side_stand_sensor": true}'::jsonb,
     '{"weight": "78kg", "load_capacity": "120kg", "warranty": "2 years", "brakes": "Drum brakes", "suspension": "Spring loaded", "tyre_size": "3.00-10", "ground_clearance": "150mm"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/eco-rider-1.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/eco-rider-2.jpg'],
     ARRAY['Classic White', 'Matte Black'],
     'active', 100, 60, 50, 3.0, '2.0 kWh Lithium-ion', '1500W Hub Motor'),
    
    -- Sport X
    ('Sport X', 'sport-x', 'electric_scooter', 'OmniRide', 'Sport X 2024',
     95000, 89999, 'High-performance electric scooter for enthusiasts. Experience the thrill of speed with eco-friendly technology.',
     '{"keyless_start": true, "led_lights": true, "digital_display": true, "mobile_app": true, "sport_mode": true, "abs": true, "traction_control": true, "quick_charge": true}'::jsonb,
     '{"weight": "105kg", "load_capacity": "150kg", "warranty": "3 years", "brakes": "Disc brakes with ABS", "suspension": "Inverted telescopic front, Monoshock rear", "tyre_size": "110/70-12", "ground_clearance": "170mm"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/sport-x-1.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/sport-x-2.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/sport-x-3.jpg'],
     ARRAY['Racing Red', 'Carbon Black', 'Electric Blue'],
     'active', 25, 150, 100, 3.0, '4.0 kWh Lithium-ion', '5000W BLDC Motor'),
    
    -- Family Wagon
    ('Family Wagon', 'family-wagon', 'electric_moped', 'OmniRide', 'Wagon 2024',
     65000, 62999, 'Spacious electric moped perfect for family rides. Extra storage and comfortable seating for two.',
     '{"large_storage": true, "usb_charging": true, "reverse_mode": true, "child_safety_lock": true, "comfortable_seat": true}'::jsonb,
     '{"weight": "110kg", "load_capacity": "180kg", "warranty": "2 years", "brakes": "Combi-brake system", "suspension": "Hydraulic front and rear", "tyre_size": "90/100-10", "ground_clearance": "160mm", "storage_capacity": "28L"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/family-wagon-1.jpg',
           'https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/family-wagon-2.jpg'],
     ARRAY['Pearl White', 'Burgundy Red', 'Navy Blue'],
     'active', 40, 90, 65, 4.0, '3.0 kWh Lithium-ion', '2500W Hub Motor'),

    -- Metro Lite
    ('Metro Lite', 'metro-lite', 'electric_scooter', 'OmniRide', 'Metro 2024',
     38000, 35999, 'Compact and lightweight electric scooter perfect for metro connectivity and last-mile transportation.',
     '{"foldable": true, "led_lights": true, "digital_display": true, "portable_charger": true}'::jsonb,
     '{"weight": "65kg", "load_capacity": "100kg", "warranty": "1 year", "brakes": "Drum brakes", "suspension": "Front suspension", "tyre_size": "3.00-8", "ground_clearance": "140mm"}'::jsonb,
     ARRAY['https://kfghxdqdgropxppopiud.supabase.co/storage/v1/object/public/scooter-images/metro-lite-1.jpg'],
     ARRAY['Space Grey', 'Mint Green'],
     'active', 80, 45, 45, 2.5, '1.5 kWh Lithium-ion', '1200W Hub Motor')
ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    discounted_price = EXCLUDED.discounted_price,
    stock_quantity = EXCLUDED.stock_quantity,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert sample test rides (without user_id as we can't reference auth.users directly)
INSERT INTO test_rides (
    name, email, phone, preferred_date, preferred_time,
    city, address, status, vehicle_id
)
SELECT 
    'Demo Customer ' || generate_series,
    'demo' || generate_series || '@example.com',
    '98765432' || LPAD(generate_series::text, 2, '0'),
    CURRENT_DATE + (generate_series || ' days')::interval,
    '14:00:00'::time + (generate_series || ' hours')::interval,
    CASE generate_series % 4
        WHEN 0 THEN 'Mumbai'
        WHEN 1 THEN 'Delhi'
        WHEN 2 THEN 'Bangalore'
        ELSE 'Chennai'
    END,
    'Demo Address ' || generate_series,
    CASE generate_series % 3
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'confirmed'
        ELSE 'completed'
    END::test_ride_status,
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 5)
ON CONFLICT DO NOTHING;

-- Insert sample leads
INSERT INTO leads (
    name, email, phone, city, state, vehicle_interested,
    source, status
)
SELECT
    'Lead Customer ' || generate_series,
    'lead' || generate_series || '@example.com',
    '98765433' || LPAD(generate_series::text, 2, '0'),
    CASE generate_series % 4
        WHEN 0 THEN 'Pune'
        WHEN 1 THEN 'Hyderabad'
        WHEN 2 THEN 'Kolkata'
        ELSE 'Ahmedabad'
    END,
    CASE generate_series % 4
        WHEN 0 THEN 'Maharashtra'
        WHEN 1 THEN 'Telangana'
        WHEN 2 THEN 'West Bengal'
        ELSE 'Gujarat'
    END,
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    CASE generate_series % 3
        WHEN 0 THEN 'Website'
        WHEN 1 THEN 'Facebook'
        ELSE 'Google Ads'
    END,
    CASE generate_series % 4
        WHEN 0 THEN 'new'
        WHEN 1 THEN 'contacted'
        WHEN 2 THEN 'qualified'
        ELSE 'converted'
    END::lead_status
FROM generate_series(1, 8)
ON CONFLICT DO NOTHING;

-- Insert sample contact inquiries
INSERT INTO contact_inquiries (
    name, email, phone, subject, message, status
)
SELECT
    'Contact ' || generate_series,
    'contact' || generate_series || '@example.com',
    '98765434' || LPAD(generate_series::text, 2, '0'),
    CASE generate_series % 3
        WHEN 0 THEN 'Product Inquiry'
        WHEN 1 THEN 'Dealership Query'
        ELSE 'Service Request'
    END,
    'This is a demo inquiry message number ' || generate_series || '. Please provide more information.',
    CASE generate_series % 2
        WHEN 0 THEN 'new'
        ELSE 'responded'
    END
FROM generate_series(1, 6)
ON CONFLICT DO NOTHING;

-- Insert sample dealer applications
INSERT INTO dealer_applications (
    business_name, business_type, business_address, city, state, pincode,
    business_phone, business_email, gst_number, pan_number,
    current_business, experience_years, investment_capacity,
    why_partner, status
)
SELECT
    'Demo Motors ' || generate_series,
    CASE generate_series % 2
        WHEN 0 THEN 'Automobile Dealership'
        ELSE 'New Business'
    END,
    'Demo Business Address ' || generate_series,
    CASE generate_series % 4
        WHEN 0 THEN 'Jaipur'
        WHEN 1 THEN 'Lucknow'
        WHEN 2 THEN 'Indore'
        ELSE 'Surat'
    END,
    CASE generate_series % 4
        WHEN 0 THEN 'Rajasthan'
        WHEN 1 THEN 'Uttar Pradesh'
        WHEN 2 THEN 'Madhya Pradesh'
        ELSE 'Gujarat'
    END,
    (400000 + generate_series * 1000)::text,
    '98765435' || LPAD(generate_series::text, 2, '0'),
    'dealer' || generate_series || '@demomotors.com',
    'GST' || LPAD(generate_series::text, 9, '0'),
    'PAN' || LPAD(generate_series::text, 6, '0'),
    'Existing automobile business',
    generate_series * 2,
    CASE generate_series % 3
        WHEN 0 THEN '25-50 Lakhs'
        WHEN 1 THEN '50-75 Lakhs'
        ELSE '75-100 Lakhs'
    END,
    'Interested in expanding into electric vehicle segment',
    CASE generate_series % 3
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        ELSE 'rejected'
    END::dealer_status
FROM generate_series(1, 4)
ON CONFLICT DO NOTHING;

-- Note: User-specific data (profiles, orders, payments, warranties, notifications) 
-- should be created after users are registered through Supabase Auth.
-- You can create test users via Supabase Studio or using a script.

-- Create a helpful message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Vehicles: 6 models added';
    RAISE NOTICE 'Test Rides: 5 sample bookings added';
    RAISE NOTICE 'Leads: 8 sample leads added';
    RAISE NOTICE 'Contact Inquiries: 6 sample inquiries added';
    RAISE NOTICE 'Dealer Applications: 4 sample applications added';
    RAISE NOTICE '';
    RAISE NOTICE 'To complete the setup:';
    RAISE NOTICE '1. Create test users via Supabase Auth Dashboard';
    RAISE NOTICE '2. Insert corresponding profiles with appropriate roles';
    RAISE NOTICE '3. Upload vehicle images to the scooter-images bucket';
END $$;
