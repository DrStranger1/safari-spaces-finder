
-- 1. Add report_count cache
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_report_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.properties SET report_count = report_count + 1 WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_increment_count ON public.reports;
CREATE TRIGGER reports_increment_count
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.increment_report_count();

-- 2. Replace all property images with curated real photos
DELETE FROM public.property_images;

WITH pools AS (
  SELECT
    'room'::property_type AS ptype,
    ARRAY[
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1522444690501-83e018d6e2bd?auto=format&fit=crop&w=800&q=70'
    ] AS urls
  UNION ALL SELECT 'apartment'::property_type, ARRAY[
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1494203484021-3c454daf695d?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=70'
  ]
  UNION ALL SELECT 'house'::property_type, ARRAY[
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=70'
  ]
  UNION ALL SELECT 'office'::property_type, ARRAY[
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1604328471151-b52226907017?auto=format&fit=crop&w=800&q=70'
  ]
  UNION ALL SELECT 'commercial'::property_type, ARRAY[
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1604754742629-3e0498a8a0aa?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=70'
  ]
),
ranked AS (
  SELECT p.id AS property_id, p.property_type,
         row_number() OVER (PARTITION BY p.property_type ORDER BY p.created_at, p.id) - 1 AS rn
  FROM public.properties p
)
INSERT INTO public.property_images (property_id, image_url, display_order)
SELECT
  r.property_id,
  pl.urls[ ((r.rn + offs) % array_length(pl.urls, 1)) + 1 ],
  offs
FROM ranked r
JOIN pools pl ON pl.ptype = r.property_type
CROSS JOIN generate_series(0, 4) AS offs;

-- 3. Rewrite titles to be more descriptive and human-centered
UPDATE public.properties SET title = CASE property_type
  WHEN 'room'::property_type THEN
    CASE WHEN price < 100000 THEN 'Affordable Self-Contained Room — ' || district || ' (Near Daladala Stop)'
         WHEN price < 150000 THEN 'Spacious Room with Private Bathroom — ' || district || ' (Near Main Road)'
         WHEN price < 200000 THEN 'Modern Master Bedroom — ' || district || ' (Water & Electricity Reliable)'
         ELSE 'Premium Self-Contained Studio Room — ' || district || ' (Secure Compound)'
    END
  WHEN 'apartment'::property_type THEN
    CASE WHEN bedrooms <= 1 THEN bedrooms || '-Bedroom Apartment — ' || district || ' (Walk to Main Road)'
         WHEN bedrooms = 2 THEN '2-Bedroom Family Apartment — ' || district || ' (Secure Building, Near Shops)'
         ELSE bedrooms || '-Bedroom Apartment — ' || district || ' (Modern Finishes, 24/7 Security)'
    END
  WHEN 'house'::property_type THEN
    CASE WHEN bedrooms <= 2 THEN bedrooms || '-Bedroom House — ' || district || ' (Quiet Neighbourhood, Near Daladala)'
         WHEN bedrooms = 3 THEN '3-Bedroom Family House — ' || district || ' (Wall Fence, Parking, Reliable Water)'
         ELSE bedrooms || '-Bedroom House — ' || district || ' (Master Ensuite, Garden, Gated)'
    END
  ELSE title
END;

-- 4. Rewrite descriptions with locally relevant details
UPDATE public.properties SET description =
  'A well-maintained ' || property_type || ' in ' || district || ', Dar es Salaam. ' ||
  E'\n\n📍 Location & Access\n' ||
  '• Approximately 5–10 minutes walk to the main road and daladala stop\n' ||
  '• Close to local shops, vegetable markets and pharmacy\n' ||
  '• Easy access to schools and health centres in ' || district || E'\n\n' ||
  E'💧 Utilities\n' ||
  '• Reliable DAWASA water supply with backup storage tank\n' ||
  '• TANESCO electricity connection (LUKU prepaid meter)\n' ||
  '• Mobile network coverage: Vodacom, Airtel, Tigo — strong signal\n\n' ||
  '🔒 Security & Comfort\n' ||
  '• Secure compound with perimeter wall' || CASE WHEN property_type = 'house'::property_type THEN ' and lockable gate' ELSE ' and night watchman' END || E'\n' ||
  '• Quiet, family-friendly neighbourhood\n' ||
  CASE WHEN bedrooms > 0 THEN '• ' || bedrooms || ' bedroom(s) and ' || bathrooms || ' bathroom(s)' || E'\n' ELSE '' END ||
  E'\n📞 Contact the landlord directly via WhatsApp — no brokers, no extra fees.';

-- 5. Refresh updated_at so cards feel fresh
UPDATE public.properties SET updated_at = now() - (random() * interval '6 days');
