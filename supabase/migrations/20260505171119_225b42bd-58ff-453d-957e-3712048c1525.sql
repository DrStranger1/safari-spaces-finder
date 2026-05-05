
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  reporter_id uuid,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit reports" ON public.reports;
CREATE POLICY "Anyone can submit reports" ON public.reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Sample landlord auth users + profiles + roles
DO $$
DECLARE
  ids uuid[] := ARRAY[
    '11111111-1111-1111-1111-111111111101'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    '11111111-1111-1111-1111-111111111104'::uuid,
    '11111111-1111-1111-1111-111111111105'::uuid
  ];
  names text[] := ARRAY['Juma Mwakalinga','Amina Hassan','Peter Mushi','Fatma Ally','Joseph Mhina'];
  phones text[] := ARRAY['+255712345601','+255712345602','+255712345603','+255712345604','+255712345605'];
  bios text[] := ARRAY[
    'Verified landlord in Kinondoni since 2019.',
    'Manages family properties in Sinza & Mbezi.',
    'Real estate professional, Ilala area.',
    'Trusted by 50+ tenants in Temeke.',
    'Modern apartments in Ubungo & Kijitonyama.'
  ];
  i int;
BEGIN
  FOR i IN 1..5 LOOP
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous)
    VALUES (
      ids[i], '00000000-0000-0000-0000-000000000000',
      'authenticated','authenticated',
      'sample-landlord-' || i || '@pango.local',
      crypt('SamplePass123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', names[i], 'phone', phones[i], 'role', 'landlord'),
      false, false
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (user_id, full_name, phone, is_verified, bio)
    VALUES (ids[i], names[i], phones[i], true, bios[i])
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (ids[i], 'landlord') ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Seed 30 properties
DO $$
DECLARE
  new_id uuid;
  owners uuid[] := ARRAY[
    '11111111-1111-1111-1111-111111111101'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    '11111111-1111-1111-1111-111111111104'::uuid,
    '11111111-1111-1111-1111-111111111105'::uuid
  ];
  titles text[] := ARRAY[
    'Single Room near Mwenge','Master Bedroom in Sinza','Affordable Room in Mbezi','Modern Studio Room - Kijitonyama','Shared Room in Ubungo',
    'Self-Contained Room - Temeke','Cozy Room in Ilala','Bedsitter in Sinza C','Room with Balcony - Mbezi','Pocket-Friendly Room Ubungo',
    '2-Bedroom Apartment Kijitonyama','Modern Apartment in Mbezi Beach','Family Apartment Sinza','1-Bedroom Apartment Ilala','Executive Apartment Ubungo',
    'Furnished Apartment Temeke','Penthouse Kijitonyama','Affordable Apartment Mbezi','Studio Apartment Sinza','New 2BR Apartment Ilala',
    '3-Bedroom House Mbezi','Family Home in Sinza','Cozy 2BR House Temeke','Modern Villa Kijitonyama','Townhouse in Ubungo',
    'Bungalow in Ilala','Beach House Mbezi','Compact House Temeke','Spacious Home Sinza','Garden House Kijitonyama'
  ];
  districts text[] := ARRAY[
    'Kinondoni','Kinondoni','Kinondoni','Kinondoni','Ubungo','Temeke','Ilala','Kinondoni','Kinondoni','Ubungo',
    'Kinondoni','Kinondoni','Kinondoni','Ilala','Ubungo','Temeke','Kinondoni','Kinondoni','Kinondoni','Ilala',
    'Kinondoni','Kinondoni','Temeke','Kinondoni','Ubungo','Ilala','Kinondoni','Temeke','Kinondoni','Kinondoni'
  ];
  ptypes text[] := ARRAY[
    'room','room','room','room','room','room','room','room','room','room',
    'apartment','apartment','apartment','apartment','apartment','apartment','apartment','apartment','apartment','apartment',
    'house','house','house','house','house','house','house','house','house','house'
  ];
  prices int[] := ARRAY[
    120000,180000,90000,250000,75000,110000,130000,160000,140000,85000,
    450000,750000,550000,320000,680000,400000,1200000,280000,220000,520000,
    900000,1100000,600000,1800000,850000,750000,2200000,480000,1300000,950000
  ];
  beds int[] := ARRAY[1,1,1,1,1,1,1,1,1,1, 2,3,3,1,3,2,3,2,1,2, 3,4,2,4,3,3,4,2,4,3];
  baths int[] := ARRAY[1,1,1,1,1,1,1,1,1,1, 1,2,2,1,2,1,3,1,1,2, 2,3,1,3,2,2,3,1,3,2];
  areas int[] := ARRAY[18,22,15,25,12,20,18,24,22,14, 65,110,95,45,100,70,140,55,35,80, 180,220,120,280,160,150,300,90,240,170];
  descs text[] := ARRAY[
    'Cozy self-contained room close to Mwenge bus stand. Water and electricity included.',
    'Spacious master bedroom with private bathroom in a shared house. Quiet street.',
    'Budget-friendly single room in Mbezi Beach area. Walking distance to daladala.',
    'Newly renovated studio with kitchenette. Tiled floors, fresh paint.',
    'Affordable shared accommodation near UDSM. Perfect for students.',
    'Self-contained room with own entrance. Secure compound.',
    'Quiet residential area near Kariakoo. Reliable water supply.',
    'Modern bedsitter with built-in wardrobe. Parking available.',
    'Sunny room with private balcony overlooking the garden.',
    'Clean and safe room. Great for first-time renters.',
    'Comfortable 2-bedroom apartment, fully tiled. Backup generator.',
    'Beachfront 3-bedroom apartment. Sea breeze and stunning views.',
    'Spacious family apartment. Kids play area in compound.',
    'Compact 1-bedroom near city center. Walk to Posta.',
    'Executive 3-bed with master ensuite. 24hr security.',
    'Fully furnished 2-bedroom. Move in with just your bags.',
    'Top-floor penthouse with rooftop access. Premium finishes.',
    'Budget 2-bedroom. Reliable water and electricity.',
    'Open-plan studio. Ideal for young professionals.',
    'Brand new construction. Lift, parking, backup water.',
    'Standalone house with garden and gated parking.',
    'Large family house, mature garden, servant quarters.',
    'Affordable family home in quiet neighborhood.',
    'Contemporary villa with pool. Premium location.',
    '3-bedroom townhouse in gated community.',
    'Classic bungalow with mango trees. Lots of character.',
    'Walking distance to beach. Perfect for families.',
    'Small but well-maintained family house.',
    'Spacious home with double garage and garden.',
    'Beautiful garden, fruit trees, peaceful surroundings.'
  ];
  featured_idx int[] := ARRAY[1,4,11,12,17,21,24,27];
  promoted_idx int[] := ARRAY[4,12,15,24,29];
  amen text[];
  i int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.properties WHERE owner_id = '11111111-1111-1111-1111-111111111101') THEN
    RETURN;
  END IF;

  FOR i IN 1..30 LOOP
    new_id := gen_random_uuid();
    amen := CASE (i % 5)
      WHEN 0 THEN ARRAY['Water','Electricity','Security','Backup Water','Parking','Wifi']
      WHEN 1 THEN ARRAY['Water','Electricity','Parking']
      WHEN 2 THEN ARRAY['Water','Electricity','Wifi','Security']
      WHEN 3 THEN ARRAY['Water','Electricity','Parking','Backup Generator','Security']
      ELSE ARRAY['Water','Electricity','Wifi','Furnished','Parking']
    END;

    INSERT INTO public.properties (
      id, owner_id, title, description, property_type, status, price, currency,
      bedrooms, bathrooms, area_sqm, address, district, latitude, longitude,
      amenities, is_featured, is_promoted
    ) VALUES (
      new_id,
      owners[1 + ((i-1) % 5)],
      titles[i], descs[i], ptypes[i]::property_type, 'active'::property_status,
      prices[i], 'TZS', beds[i], baths[i], areas[i],
      'Sample Street ' || i || ', ' || districts[i], districts[i],
      -6.78 + (random() * 0.15), 39.20 + (random() * 0.15),
      amen,
      i = ANY(featured_idx),
      i = ANY(promoted_idx)
    );

    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES
      (new_id, 'https://picsum.photos/seed/pango' || i || 'a/800/600', 0),
      (new_id, 'https://picsum.photos/seed/pango' || i || 'b/800/600', 1),
      (new_id, 'https://picsum.photos/seed/pango' || i || 'c/800/600', 2),
      (new_id, 'https://picsum.photos/seed/pango' || i || 'd/800/600', 3);

    INSERT INTO public.nearby_services (property_id, service_type, name, distance_km) VALUES
      (new_id, 'hospital', 'Local Health Centre', round((0.5 + random()*3)::numeric, 1)),
      (new_id, 'transport', 'Daladala Stand', round((0.1 + random()*1.5)::numeric, 1)),
      (new_id, 'market', 'Soko la ' || districts[i], round((0.3 + random()*2)::numeric, 1));
  END LOOP;
END $$;
