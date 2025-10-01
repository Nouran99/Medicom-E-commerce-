-- ============================================
-- MEDICUM EGYPT - COMPLETE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
-- Comment these lines if you want to keep existing data
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- CREATE CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code VARCHAR(100) UNIQUE,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  name_en VARCHAR(500) NOT NULL,
  name_ar VARCHAR(500),
  description_en TEXT,
  description_ar TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  brand VARCHAR(255),
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  price_per_unit DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 14,
  stock_quantity INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER DEFAULT 10,
  requires_prescription BOOLEAN DEFAULT false,
  active_ingredient TEXT,
  dosage_form VARCHAR(100),
  side_effects TEXT,
  contraindications TEXT,
  storage_conditions TEXT,
  delivery_method VARCHAR(50),
  delivery_days_min INTEGER DEFAULT 1,
  delivery_days_max INTEGER DEFAULT 3,
  delivery_fee DECIMAL(10, 2) DEFAULT 30,
  image_url TEXT,
  product_images JSONB,
  specifications JSONB,
  unit VARCHAR(50),
  unit_size VARCHAR(100),
  unit_item VARCHAR(50),
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_prescription ON products(requires_prescription);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================
-- INSERT CATEGORIES
-- ============================================
INSERT INTO categories (name_en, name_ar, slug, display_order) VALUES
  ('Pain Relief', 'مسكنات الألم', 'pain-relief', 1),
  ('Antibiotics', 'المضادات الحيوية', 'antibiotics', 2),
  ('Vitamins', 'الفيتامينات', 'vitamins', 3),
  ('Cold & Flu', 'البرد والأنفلونزا', 'cold-flu', 4),
  ('Digestive', 'الجهاز الهضمي', 'digestive', 5),
  ('Diabetes', 'السكري', 'diabetes', 6),
  ('Personal Care', 'العناية الشخصية', 'personal-care', 7),
  ('Heart & Blood Pressure', 'القلب وضغط الدم', 'heart-blood-pressure', 8);

-- ============================================
-- INSERT 20 MEDICAL PRODUCTS
-- ============================================
INSERT INTO products (
  product_code, sku, barcode, name_en, name_ar, description_en, description_ar,
  category, subcategory, brand, manufacturer, country_of_origin,
  price, price_per_unit, discount_percentage, tax_percentage,
  stock_quantity, min_order_quantity, max_order_quantity,
  requires_prescription, active_ingredient, dosage_form,
  side_effects, contraindications, storage_conditions,
  delivery_method, delivery_days_min, delivery_days_max, delivery_fee,
  image_url, unit, unit_size, is_featured, is_active
) VALUES
-- Pain Relief Products (1-3)
('MED-001-BRUF', 'BRUF-400-30T', '6221060000123', 
 'Brufen 400mg Tablets', 'بروفين 400 مجم أقراص',
 'Anti-inflammatory pain relief tablets. Effective for arthritis, dental pain, and fever reduction.',
 'أقراص مضادة للالتهابات لتخفيف الألم. فعال لالتهاب المفاصل وآلام الأسنان وخفض الحرارة.',
 'pain-relief', 'oral-medications', 'Abbott', 'Abbott Egypt', 'Egypt',
 32.50, 32.50, 5, 14, 450, 1, 10, false,
 'Ibuprofen 400mg', 'Tablet',
 'May cause stomach upset, heartburn. Take with food.',
 'Stomach ulcers, severe kidney or liver disease',
 'Store below 25°C in a dry place',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Brufen+400mg',
 'box', '30 tablets', true, true),

('MED-002-PAND', 'PAND-EXT-24T', '6221060000456',
 'Panadol Extra Tablets', 'بانادول إكسترا أقراص',
 'Advanced pain relief with paracetamol and caffeine. For headaches and strong pain.',
 'تسكين متقدم للألم مع الباراسيتامول والكافيين. للصداع والألم الشديد.',
 'pain-relief', 'oral-medications', 'GSK', 'GlaxoSmithKline Egypt', 'Egypt',
 28.00, 28.00, 10, 14, 600, 1, 15, false,
 'Paracetamol 500mg, Caffeine 65mg', 'Tablet',
 'Rare: nausea, insomnia due to caffeine',
 'Severe liver disease, caffeine sensitivity',
 'Store below 30°C',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Panadol+Extra',
 'box', '24 tablets', true, true),

('MED-003-VOLT', 'VOLT-50-20T', '6221060000789',
 'Voltaren 50mg Tablets', 'فولتارين 50 مجم أقراص',
 'Diclofenac sodium for inflammation and pain. Effective for back pain and joint disorders.',
 'ديكلوفيناك الصوديوم للالتهاب والألم. فعال لآلام الظهر واضطرابات المفاصل.',
 'pain-relief', 'oral-medications', 'Novartis', 'Novartis Egypt', 'Egypt',
 45.00, 45.00, 0, 14, 350, 1, 8, true,
 'Diclofenac sodium 50mg', 'Enteric-coated tablet',
 'May cause stomach upset, dizziness. Take with food.',
 'Stomach ulcers, heart disease, pregnancy (3rd trimester)',
 'Store below 25°C',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/95E1D3/333333?text=Voltaren+50mg',
 'box', '20 tablets', false, true),

-- Antibiotics (4-6)
('MED-004-AUGM', 'AUGM-1G-14T', '6221060001234',
 'Augmentin 1g Tablets', 'أوجمنتين 1 جم أقراص',
 'Powerful antibiotic combination for bacterial infections. Treats respiratory and urinary infections.',
 'مزيج قوي من المضادات الحيوية للعدوى البكتيرية. يعالج التهابات الجهاز التنفسي والبولي.',
 'antibiotics', 'oral-medications', 'GSK', 'GlaxoSmithKline Egypt', 'Egypt',
 89.50, 89.50, 0, 14, 200, 1, 3, true,
 'Amoxicillin 875mg, Clavulanic acid 125mg', 'Film-coated tablet',
 'Diarrhea, nausea, skin rash. Take with food.',
 'Penicillin allergy, liver problems',
 'Store below 25°C in dry place',
 'standard', 1, 3, 30.00,
 'https://via.placeholder.com/400x300/F38181/FFFFFF?text=Augmentin+1g',
 'box', '14 tablets', false, true),

('MED-005-ZITH', 'ZITH-500-3T', '6221060001567',
 'Zithromax 500mg Tablets', 'زيثروماكس 500 مجم أقراص',
 'Azithromycin antibiotic for respiratory infections. Once daily dosing for convenience.',
 'أزيثروميسين مضاد حيوي لالتهابات الجهاز التنفسي. جرعة واحدة يومياً للراحة.',
 'antibiotics', 'oral-medications', 'Pfizer', 'Pfizer Egypt', 'Egypt',
 95.00, 95.00, 0, 14, 150, 1, 2, true,
 'Azithromycin 500mg', 'Film-coated tablet',
 'Stomach upset, diarrhea, headache',
 'Liver disease, heart rhythm problems',
 'Store below 30°C',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/AA96DA/FFFFFF?text=Zithromax+500mg',
 'box', '3 tablets', false, true),

('MED-006-CIPR', 'CIPR-500-10T', '6221060001890',
 'Ciprofar 500mg Tablets', 'سيبروفار 500 مجم أقراص',
 'Ciprofloxacin for urinary tract and respiratory infections. Broad spectrum antibiotic.',
 'سيبروفلوكساسين لالتهابات المسالك البولية والجهاز التنفسي. مضاد حيوي واسع الطيف.',
 'antibiotics', 'oral-medications', 'Pharco', 'Pharco Pharmaceuticals', 'Egypt',
 42.00, 42.00, 5, 14, 300, 1, 5, true,
 'Ciprofloxacin 500mg', 'Film-coated tablet',
 'Nausea, diarrhea, dizziness. Avoid sun exposure.',
 'Pregnancy, children under 18, tendon problems',
 'Store below 25°C',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/FCBAD3/333333?text=Ciprofar+500mg',
 'box', '10 tablets', false, true),

-- Vitamins & Supplements (7-9)
('MED-007-VITD', 'VITD-5000-30C', '6221060002123',
 'Vitamin D3 5000 IU Capsules', 'فيتامين د3 5000 وحدة دولية كبسولات',
 'High strength Vitamin D3 for bone health and immunity. Essential for calcium absorption.',
 'فيتامين د3 عالي القوة لصحة العظام والمناعة. ضروري لامتصاص الكالسيوم.',
 'vitamins', 'supplements', 'Mepaco', 'Mepaco Egypt', 'Egypt',
 55.00, 55.00, 15, 14, 400, 1, 10, false,
 'Cholecalciferol 5000 IU', 'Soft gelatin capsule',
 'Rare: hypercalcemia with excessive doses',
 'Hypercalcemia, kidney stones',
 'Store below 25°C, protect from light',
 'standard', 1, 3, 30.00,
 'https://via.placeholder.com/400x300/FFFFD2/333333?text=Vitamin+D3',
 'box', '30 capsules', true, true),

('MED-008-OMEG', 'OMEG-1000-30C', '6221060002456',
 'Omega-3 Fish Oil 1000mg', 'أوميغا 3 زيت السمك 1000 مجم',
 'Premium omega-3 fatty acids for heart and brain health. Supports cardiovascular system.',
 'أحماض أوميغا 3 الدهنية الممتازة لصحة القلب والدماغ. يدعم نظام القلب والأوعية الدموية.',
 'vitamins', 'supplements', 'Sedico', 'Sedico Pharmaceuticals', 'Egypt',
 85.00, 85.00, 10, 14, 250, 1, 8, false,
 'Fish Oil 1000mg (EPA 180mg, DHA 120mg)', 'Soft gelatin capsule',
 'Fishy aftertaste, mild stomach upset',
 'Fish allergy, bleeding disorders',
 'Store below 25°C, refrigerate after opening',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/A8E6CF/333333?text=Omega-3',
 'box', '30 capsules', true, true),

('MED-009-CALC', 'CALC-600-30T', '6221060002789',
 'Calcium 600mg + Vitamin D3', 'كالسيوم 600 مجم + فيتامين د3',
 'Calcium with Vitamin D3 for strong bones and teeth. Prevents osteoporosis.',
 'الكالسيوم مع فيتامين د3 لعظام وأسنان قوية. يمنع هشاشة العظام.',
 'vitamins', 'supplements', 'Eva Pharma', 'Eva Pharma', 'Egypt',
 48.00, 48.00, 20, 14, 350, 1, 10, false,
 'Calcium carbonate 600mg, Vitamin D3 400 IU', 'Chewable tablet',
 'Constipation, gas, bloating',
 'Hypercalcemia, kidney disease',
 'Store below 30°C',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/FFD3B6/333333?text=Calcium+D3',
 'box', '30 tablets', false, true),

-- Cold & Flu (10-12)
('MED-010-CONG', 'CONG-20T', '6221060003123',
 'Congestal Cold & Flu Tablets', 'كونجستال أقراص للبرد والإنفلونزا',
 'Multi-symptom cold and flu relief. Reduces fever, relieves congestion and body aches.',
 'علاج متعدد الأعراض للبرد والإنفلونزا. يخفض الحرارة ويخفف الاحتقان وآلام الجسم.',
 'cold-flu', 'oral-medications', 'Sigma', 'Sigma Pharmaceuticals', 'Egypt',
 19.50, 19.50, 15, 14, 500, 1, 10, false,
 'Paracetamol 650mg, Pseudoephedrine 60mg, Chlorpheniramine 4mg', 'Tablet',
 'Drowsiness, dry mouth, dizziness',
 'High blood pressure, glaucoma, MAO inhibitors',
 'Store below 25°C',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/FFAAA5/FFFFFF?text=Congestal',
 'box', '20 tablets', true, true),

('MED-011-FLUM', 'FLUM-600-10S', '6221060003456',
 'Flumeucil 600mg Effervescent', 'فلوموسيل 600 مجم فوار',
 'Mucolytic for chest congestion. Helps clear mucus from airways.',
 'مذيب للبلغم لاحتقان الصدر. يساعد على إزالة المخاط من الشعب الهوائية.',
 'cold-flu', 'oral-medications', 'Zambon', 'Zambon Egypt', 'Egypt',
 65.00, 65.00, 5, 14, 200, 1, 5, false,
 'Acetylcysteine 600mg', 'Effervescent granules',
 'Nausea, vomiting, diarrhea',
 'Peptic ulcer, asthma',
 'Store below 25°C in dry place',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/FF8B94/FFFFFF?text=Flumeucil',
 'box', '10 sachets', false, true),

('MED-012-OTRI', 'OTRI-01-10ML', '6221060003789',
 'Otrivin Nasal Spray 0.1%', 'أوتريفين بخاخ أنف 0.1%',
 'Nasal decongestant spray for blocked nose. Fast relief from nasal congestion.',
 'بخاخ مزيل لاحتقان الأنف. راحة سريعة من احتقان الأنف.',
 'cold-flu', 'nasal-medications', 'GSK', 'GlaxoSmithKline Egypt', 'Egypt',
 28.00, 28.00, 10, 14, 400, 1, 6, false,
 'Xylometazoline HCl 0.1%', 'Nasal spray',
 'Burning sensation, dryness, rebound congestion with overuse',
 'Children under 12, narrow-angle glaucoma',
 'Store below 30°C',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/A8DADC/333333?text=Otrivin',
 'bottle', '10ml', false, true),

-- Digestive Health (13-15)
('MED-013-RANT', 'RANT-150-20T', '6221060004123',
 'Rantidine 150mg Tablets', 'رانتيدين 150 مجم أقراص',
 'For heartburn and acid reflux. Reduces stomach acid production.',
 'لحرقة المعدة وارتجاع الحمض. يقلل من إنتاج حمض المعدة.',
 'digestive', 'oral-medications', 'EIPICO', 'EIPICO Egypt', 'Egypt',
 22.00, 22.00, 15, 14, 350, 1, 8, false,
 'Ranitidine HCl 150mg', 'Film-coated tablet',
 'Headache, dizziness, constipation',
 'Kidney disease, porphyria',
 'Store below 25°C',
 'standard', 1, 3, 30.00,
 'https://via.placeholder.com/400x300/457B9D/FFFFFF?text=Rantidine',
 'box', '20 tablets', false, true),

('MED-014-LACT', 'LACT-120ML', '6221060004456',
 'Lactulose Syrup 667mg/ml', 'لاكتيولوز شراب 667 مجم/مل',
 'Gentle laxative for constipation relief. Safe for long-term use.',
 'ملين لطيف لعلاج الإمساك. آمن للاستخدام طويل الأمد.',
 'digestive', 'oral-medications', 'Amriya', 'Amriya Pharmaceuticals', 'Egypt',
 18.00, 18.00, 10, 14, 250, 1, 6, false,
 'Lactulose 667mg/ml', 'Syrup',
 'Bloating, gas, cramping',
 'Galactosemia, intestinal obstruction',
 'Store below 25°C, do not freeze',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/1D3557/FFFFFF?text=Lactulose',
 'bottle', '120ml', false, true),

('MED-015-ENTE', 'ENTE-10V', '6221060004789',
 'Enterogermina Probiotic', 'إنتيروجيرمينا بروبيوتيك',
 'Probiotic for digestive balance. Restores intestinal flora after antibiotics.',
 'بروبيوتيك لتوازن الجهاز الهضمي. يستعيد فلورا الأمعاء بعد المضادات الحيوية.',
 'digestive', 'probiotics', 'Sanofi', 'Sanofi Egypt', 'Egypt',
 75.00, 75.00, 5, 14, 150, 1, 5, false,
 'Bacillus clausii 2 billion spores', 'Oral suspension',
 'Very rare: skin rash',
 'Immunodeficiency',
 'Store below 30°C',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/F1FAEE/333333?text=Enterogermina',
 'box', '10 vials', true, true),

-- Diabetes Care (16-17)
('MED-016-GLUC', 'GLUC-500-30T', '6221060005123',
 'Glucophage 500mg Tablets', 'جلوكوفاج 500 مجم أقراص',
 'Metformin for type 2 diabetes. Controls blood sugar levels.',
 'ميتفورمين لمرض السكري من النوع 2. يتحكم في مستويات السكر في الدم.',
 'diabetes', 'oral-medications', 'Merck', 'Merck Egypt', 'Egypt',
 38.00, 38.00, 0, 14, 200, 1, 5, true,
 'Metformin HCl 500mg', 'Film-coated tablet',
 'Nausea, diarrhea, stomach upset. Take with meals.',
 'Kidney disease, metabolic acidosis',
 'Store below 25°C',
 'standard', 1, 3, 30.00,
 'https://via.placeholder.com/400x300/E63946/FFFFFF?text=Glucophage',
 'box', '30 tablets', false, true),

('MED-017-TEST', 'TEST-GLU-50', '6221060005456',
 'Blood Glucose Test Strips', 'شرائط اختبار جلوكوز الدم',
 'Accurate blood glucose test strips. Compatible with most glucometers.',
 'شرائط دقيقة لاختبار جلوكوز الدم. متوافقة مع معظم أجهزة قياس السكر.',
 'diabetes', 'testing-supplies', 'Accu-Chek', 'Roche Egypt', 'Egypt',
 120.00, 120.00, 10, 14, 300, 1, 10, false,
 'N/A', 'Test strip',
 'N/A',
 'N/A',
 'Store in cool, dry place. Keep container closed.',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/F77F00/FFFFFF?text=Test+Strips',
 'box', '50 strips', true, true),

-- Personal Care (18-20)
('MED-018-PANT', 'PANT-SHA-400', '6221060005789',
 'Pantene Pro-V Shampoo 400ml', 'شامبو بانتين برو-في 400 مل',
 'Nourishing shampoo for healthy, shiny hair. With Pro-Vitamin formula.',
 'شامبو مغذي لشعر صحي ولامع. بتركيبة البرو-فيتامين.',
 'personal-care', 'hair-care', 'Pantene', 'P&G Egypt', 'Egypt',
 65.00, 65.00, 20, 14, 200, 1, 6, false,
 'Pro-Vitamin B5, Silk Protein', 'Shampoo',
 'Rare: scalp irritation in sensitive individuals',
 'Allergy to ingredients',
 'Store at room temperature',
 'standard', 2, 3, 30.00,
 'https://via.placeholder.com/400x300/EAE2B7/333333?text=Pantene',
 'bottle', '400ml', false, true),

('MED-019-SENS', 'SENS-75ML', '6221060006123',
 'Sensodyne Toothpaste 75ml', 'معجون أسنان سنسوداين 75 مل',
 'Toothpaste for sensitive teeth. Provides 24/7 protection.',
 'معجون أسنان للأسنان الحساسة. يوفر حماية على مدار الساعة.',
 'personal-care', 'oral-care', 'Sensodyne', 'GSK Egypt', 'Egypt',
 45.00, 45.00, 15, 14, 350, 1, 8, false,
 'Potassium Nitrate 5%, Sodium Fluoride 0.254%', 'Toothpaste',
 'N/A',
 'Children under 12 without supervision',
 'Store below 30°C',
 'standard', 1, 3, 30.00,
 'https://via.placeholder.com/400x300/FCBAD3/333333?text=Sensodyne',
 'tube', '75ml', false, true),

('MED-020-DETT', 'DETT-500ML', '6221060006456',
 'Dettol Antiseptic Liquid 500ml', 'سائل ديتول المطهر 500 مل',
 'Multi-purpose antiseptic for wound cleaning and household disinfection.',
 'مطهر متعدد الأغراض لتنظيف الجروح وتطهير المنزل.',
 'personal-care', 'antiseptics', 'Dettol', 'Reckitt Egypt', 'Egypt',
 58.00, 58.00, 10, 14, 400, 1, 10, false,
 'Chloroxylenol 4.8%', 'Liquid',
 'Skin irritation if undiluted',
 'Do not use undiluted on skin',
 'Store below 30°C, keep away from children',
 'express', 1, 2, 35.00,
 'https://via.placeholder.com/400x300/003D5B/FFFFFF?text=Dettol',
 'bottle', '500ml', true, true);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (Optional)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access on categories" 
  ON categories FOR SELECT 
  USING (true);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Products imported:' as status, COUNT(*) as count FROM products;
SELECT 'Categories created:' as status, COUNT(*) as count FROM categories;

-- Show sample products
SELECT product_code, name_en, name_ar, price, requires_prescription 
FROM products 
LIMIT 5;