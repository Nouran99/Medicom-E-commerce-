-- Insert sample categories
INSERT INTO categories (id, name_en, name_ar, description_en, description_ar, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Pain Relief', 'مسكنات الألم', 'Medications for pain management', 'أدوية لعلاج الألم', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Antibiotics', 'المضادات الحيوية', 'Antibacterial medications', 'أدوية مضادة للبكتيريا', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Vitamins & Supplements', 'الفيتامينات والمكملات', 'Nutritional supplements', 'المكملات الغذائية', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Diabetes Care', 'رعاية السكري', 'Diabetes management products', 'منتجات إدارة السكري', 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Heart & Blood Pressure', 'القلب وضغط الدم', 'Cardiovascular medications', 'أدوية القلب والأوعية الدموية', 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Medical Devices', 'الأجهزة الطبية', 'Medical equipment and devices', 'المعدات والأجهزة الطبية', 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Baby Care', 'العناية بالطفل', 'Baby health products', 'منتجات صحة الطفل', 7),
  ('550e8400-e29b-41d4-a716-446655440008', 'Personal Care', 'العناية الشخصية', 'Personal hygiene products', 'منتجات النظافة الشخصية', 8);

-- Insert sample providers
INSERT INTO providers (id, name_en, name_ar, contact_phone, contact_email, address) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Cairo Pharma', 'كايرو فارما', '01001234567', 'contact@cairopharma.com', '123 Tahrir St, Cairo'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Giza Medical Supplies', 'مستلزمات الجيزة الطبية', '01009876543', 'info@gizamed.com', '456 Pyramids Rd, Giza'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Nile Health', 'صحة النيل', '01005551234', 'support@nilehealth.com', '789 Nile Corniche, Cairo');

-- Insert sample pickup locations
INSERT INTO pickup_locations (id, provider_id, name_en, name_ar, address_en, address_ar, city, governorate, phone, working_hours_en, working_hours_ar) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Tahrir Square Branch', 'فرع ميدان التحرير', '123 Tahrir Square, Cairo', '123 ميدان التحرير، القاهرة', 'Cairo', 'Cairo', '0223456789', 'Daily 9AM-10PM', 'يومياً 9ص-10م'),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Nasr City Branch', 'فرع مدينة نصر', '456 Abbas El Akkad St, Nasr City', '456 شارع عباس العقاد، مدينة نصر', 'Cairo', 'Cairo', '0224567890', 'Daily 8AM-11PM', 'يومياً 8ص-11م'),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'Dokki Branch', 'فرع الدقي', '789 Mosadak St, Dokki', '789 شارع مصدق، الدقي', 'Giza', 'Giza', '0233456789', 'Daily 9AM-9PM', 'يومياً 9ص-9م'),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'October City Branch', 'فرع مدينة 6 أكتوبر', '321 Central Axis, 6th October', '321 المحور المركزي، 6 أكتوبر', 'October', 'Giza', '0238901234', 'Daily 10AM-10PM', 'يومياً 10ص-10م'),
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'Heliopolis Branch', 'فرع مصر الجديدة', '555 El Nozha St, Heliopolis', '555 شارع النزهة، مصر الجديدة', 'Cairo', 'Cairo', '0226789012', 'Daily 8AM-10PM', 'يومياً 8ص-10م');

-- Insert sample products (medical products)
INSERT INTO products (sku, name_en, name_ar, description_en, description_ar, price, category_id, prescription_required, images, in_stock, quantity, provider_id, pickup_location_id) VALUES
  ('MED001', 'Paracetamol 500mg', 'باراسيتامول 500مج', 'Pain reliever and fever reducer - 20 tablets', 'مسكن للألم وخافض للحرارة - 20 قرص', 25.00, '550e8400-e29b-41d4-a716-446655440001', false, ARRAY['paracetamol.jpg'], true, 500, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'),
  ('MED002', 'Amoxicillin 500mg', 'أموكسيسيلين 500مج', 'Antibiotic for bacterial infections - 14 capsules', 'مضاد حيوي للعدوى البكتيرية - 14 كبسولة', 85.00, '550e8400-e29b-41d4-a716-446655440002', true, ARRAY['amoxicillin.jpg'], true, 200, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'),
  ('MED003', 'Vitamin D3 1000IU', 'فيتامين د3 1000', 'Vitamin D supplement - 30 tablets', 'مكمل فيتامين د - 30 قرص', 120.00, '550e8400-e29b-41d4-a716-446655440003', false, ARRAY['vitamind.jpg'], true, 300, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002'),
  ('MED004', 'Insulin Pen Needles', 'إبر قلم الأنسولين', 'Ultra-fine pen needles 32G - Box of 100', 'إبر قلم دقيقة جداً 32G - علبة 100', 180.00, '550e8400-e29b-41d4-a716-446655440004', false, ARRAY['insulin_needles.jpg'], true, 150, '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003'),
  ('MED005', 'Blood Pressure Monitor', 'جهاز قياس ضغط الدم', 'Digital automatic BP monitor with arm cuff', 'جهاز رقمي أوتوماتيكي لقياس الضغط مع رباط الذراع', 650.00, '550e8400-e29b-41d4-a716-446655440006', false, ARRAY['bp_monitor.jpg'], true, 50, '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003'),
  ('MED006', 'Atorvastatin 20mg', 'أتورفاستاتين 20مج', 'Cholesterol lowering medication - 30 tablets', 'دواء لخفض الكوليسترول - 30 قرص', 145.00, '550e8400-e29b-41d4-a716-446655440005', true, ARRAY['atorvastatin.jpg'], true, 100, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002'),
  ('MED007', 'Baby Formula Stage 1', 'حليب أطفال المرحلة 1', 'Infant formula 0-6 months - 400g', 'تركيبة للرضع 0-6 شهور - 400جم', 220.00, '550e8400-e29b-41d4-a716-446655440007', false, ARRAY['baby_formula.jpg'], true, 200, '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005'),
  ('MED008', 'Diabetes Test Strips', 'شرائط اختبار السكري', 'Blood glucose test strips - 50 strips', 'شرائط اختبار السكر في الدم - 50 شريط', 280.00, '550e8400-e29b-41d4-a716-446655440004', false, ARRAY['test_strips.jpg'], true, 120, '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440004'),
  ('MED009', 'Ibuprofen 400mg', 'إيبوبروفين 400مج', 'Anti-inflammatory pain reliever - 30 tablets', 'مضاد للالتهاب ومسكن للألم - 30 قرص', 45.00, '550e8400-e29b-41d4-a716-446655440001', false, ARRAY['ibuprofen.jpg'], true, 400, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'),
  ('MED010', 'Omega-3 Fish Oil', 'زيت السمك أوميجا-3', 'Heart health supplement - 60 capsules', 'مكمل لصحة القلب - 60 كبسولة', 195.00, '550e8400-e29b-41d4-a716-446655440003', false, ARRAY['omega3.jpg'], true, 250, '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005'),
  ('MED011', 'Metformin 500mg', 'ميتفورمين 500مج', 'Diabetes medication - 60 tablets', 'دواء السكري - 60 قرص', 65.00, '550e8400-e29b-41d4-a716-446655440004', true, ARRAY['metformin.jpg'], true, 180, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002'),
  ('MED012', 'Digital Thermometer', 'ميزان حرارة رقمي', 'Fast reading digital thermometer', 'ميزان حرارة رقمي سريع القراءة', 85.00, '550e8400-e29b-41d4-a716-446655440006', false, ARRAY['thermometer.jpg'], true, 100, '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003'),
  ('MED013', 'Antihistamine Tablets', 'أقراص مضاد الهيستامين', 'Allergy relief medication - 20 tablets', 'دواء لعلاج الحساسية - 20 قرص', 55.00, '550e8400-e29b-41d4-a716-446655440001', false, ARRAY['antihistamine.jpg'], true, 300, '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'),
  ('MED014', 'Calcium + Vitamin D', 'كالسيوم + فيتامين د', 'Bone health supplement - 60 tablets', 'مكمل لصحة العظام - 60 قرص', 135.00, '550e8400-e29b-41d4-a716-446655440003', false, ARRAY['calcium.jpg'], true, 200, '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005'),
  ('MED015', 'Hand Sanitizer 500ml', 'معقم اليدين 500مل', '70% alcohol hand sanitizer', 'معقم يدين كحول 70%', 35.00, '550e8400-e29b-41d4-a716-446655440008', false, ARRAY['sanitizer.jpg'], true, 500, '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440004');

-- Insert sample inventory lots for products
INSERT INTO inventory_lots (product_id, lot_number, batch_number, expiry_date, quantity, location) VALUES
  ((SELECT id FROM products WHERE sku = 'MED001'), 'LOT001', 'BATCH001', '2025-12-31', 100, 'Cairo Warehouse'),
  ((SELECT id FROM products WHERE sku = 'MED002'), 'LOT002', 'BATCH002', '2025-06-30', 50, 'Cairo Warehouse'),
  ((SELECT id FROM products WHERE sku = 'MED003'), 'LOT003', 'BATCH003', '2026-03-31', 75, 'Cairo Warehouse'),
  ((SELECT id FROM products WHERE sku = 'MED004'), 'LOT004', 'BATCH004', '2025-09-30', 40, 'Giza Warehouse'),
  ((SELECT id FROM products WHERE sku = 'MED005'), 'LOT005', 'BATCH005', '2027-12-31', 20, 'Giza Warehouse');

-- Insert sample coupons
INSERT INTO coupons (code, description_en, description_ar, discount_type, discount_value, minimum_order, valid_from, valid_until, usage_limit, is_active) VALUES
  ('WELCOME10', 'Welcome discount 10% off', 'خصم ترحيبي 10%', 'percentage', 10, 100, NOW(), NOW() + INTERVAL '3 months', 1000, true),
  ('SAVE50', 'Save 50 EGP on orders above 500', 'وفر 50 جنيه على الطلبات أكثر من 500', 'fixed', 50, 500, NOW(), NOW() + INTERVAL '1 month', 500, true),
  ('HEALTH20', '20% off on health devices', 'خصم 20% على الأجهزة الصحية', 'percentage', 20, 200, NOW(), NOW() + INTERVAL '2 months', 200, true);

-- Insert admin user (password: admin123 - should be hashed in production)
INSERT INTO admin_users (email, password_hash, name, role, permissions) VALUES
  ('admin@medicumegypt.com', '$2a$10$YourHashedPasswordHere', 'System Admin', 'super_admin', ARRAY['all']);