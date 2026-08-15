export const demoCategories = [
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45101', name_en: 'Pain Relief', name_ar: 'تسكين الألم', display_order: 1 },
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45102', name_en: 'Vitamins', name_ar: 'الفيتامينات', display_order: 2 },
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45103', name_en: 'First Aid', name_ar: 'الإسعافات الأولية', display_order: 3 },
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45104', name_en: 'Devices', name_ar: 'الأجهزة الطبية', display_order: 4 },
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45105', name_en: 'Personal Care', name_ar: 'العناية الشخصية', display_order: 5 },
  { id: 'c3d38d32-1e36-4be8-8d99-19fe17a45106', name_en: 'Mother & Baby', name_ar: 'الأم والطفل', display_order: 6 },
];

export const demoProducts = [
  {
    id: 'd6711290-b732-4c89-b241-1681ec502101',
    sku: 'MED-PAR-500',
    name_en: 'Paracetamol 500mg',
    name_ar: 'باراسيتامول 500 مجم',
    description_en: 'Fast, everyday relief for mild to moderate pain and fever.',
    description_ar: 'مسكن يومي سريع للآلام الخفيفة إلى المتوسطة والحمى.',
    price: 35.5,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45101',
    prescription_required: false,
    in_stock: true,
    quantity: 120,
    categories: { name_en: 'Pain Relief', name_ar: 'تسكين الألم' },
  },
  {
    id: 'd6711290-b732-4c89-b241-1681ec502102',
    sku: 'MED-VITD-1000',
    name_en: 'Vitamin D3 1000 IU',
    name_ar: 'فيتامين د3 1000 وحدة دولية',
    description_en: 'Daily vitamin D3 support for bone and immune health.',
    description_ar: 'دعم يومي لصحة العظام والمناعة بفيتامين د3.',
    price: 89.99,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45102',
    prescription_required: false,
    in_stock: true,
    quantity: 96,
    categories: { name_en: 'Vitamins', name_ar: 'الفيتامينات' },
  },
  {
    id: 'd6711290-b732-4c89-b241-1681ec502103',
    sku: 'MED-THERMO-01',
    name_en: 'Digital Thermometer',
    name_ar: 'ترمومتر رقمي',
    description_en: 'A compact, easy-to-read digital thermometer for home care.',
    description_ar: 'ترمومتر رقمي صغير وسهل القراءة للرعاية المنزلية.',
    price: 165,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45104',
    prescription_required: false,
    in_stock: true,
    quantity: 34,
    categories: { name_en: 'Devices', name_ar: 'الأجهزة الطبية' },
  },
  {
    id: 'd6711290-b732-4c89-b241-1681ec502104',
    sku: 'MED-GAUZE-10',
    name_en: 'Sterile Gauze Pads',
    name_ar: 'شاش معقم',
    description_en: 'Ten sterile, individually wrapped gauze pads for first aid kits.',
    description_ar: 'عشر قطع شاش معقم مغلفة بشكل فردي لحقيبة الإسعافات.',
    price: 42,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45103',
    prescription_required: false,
    in_stock: true,
    quantity: 78,
    categories: { name_en: 'First Aid', name_ar: 'الإسعافات الأولية' },
  },
  {
    id: 'd6711290-b732-4c89-b241-1681ec502105',
    sku: 'MED-HAND-CARE',
    name_en: 'Antibacterial Hand Wash',
    name_ar: 'غسول يدين مضاد للبكتيريا',
    description_en: 'Gentle antibacterial hand wash suitable for everyday use.',
    description_ar: 'غسول يدين لطيف مضاد للبكتيريا ومناسب للاستخدام اليومي.',
    price: 58,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45105',
    prescription_required: false,
    in_stock: true,
    quantity: 65,
    categories: { name_en: 'Personal Care', name_ar: 'العناية الشخصية' },
  },
  {
    id: 'd6711290-b732-4c89-b241-1681ec502106',
    sku: 'MED-BABY-CARE',
    name_en: 'Baby Nasal Aspirator',
    name_ar: 'شفاط أنف للأطفال',
    description_en: 'A soft, safe nasal aspirator designed for infant care.',
    description_ar: 'شفاط أنف ناعم وآمن مصمم للعناية بالرضع.',
    price: 74.5,
    category_id: 'c3d38d32-1e36-4be8-8d99-19fe17a45106',
    prescription_required: false,
    in_stock: true,
    quantity: 41,
    categories: { name_en: 'Mother & Baby', name_ar: 'الأم والطفل' },
  },
];

export function findDemoProducts(options: { category?: string; search?: string; prescription?: string; minPrice?: string; maxPrice?: string; offset: number; limit: number }) {
  const search = options.search?.trim().toLowerCase();
  const filtered = demoProducts.filter((product) => {
    const matchesCategory = !options.category || product.category_id === options.category;
    const matchesPrescription = options.prescription === undefined || String(product.prescription_required) === options.prescription;
    const matchesMinPrice = !options.minPrice || product.price >= Number(options.minPrice);
    const matchesMaxPrice = !options.maxPrice || product.price <= Number(options.maxPrice);
    const searchable = `${product.name_en} ${product.name_ar} ${product.description_en} ${product.description_ar} ${product.sku}`.toLowerCase();
    const matchesSearch = !search || searchable.includes(search);
    return matchesCategory && matchesPrescription && matchesMinPrice && matchesMaxPrice && matchesSearch;
  });

  return {
    products: filtered.slice(options.offset, options.offset + options.limit),
    total: filtered.length,
  };
}
