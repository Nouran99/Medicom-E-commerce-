import { Hono } from 'hono';
import { z } from 'zod';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { adminAuth } from '../middleware/auth';
import * as XLSX from 'xlsx';

export const importRoutes = new Hono<{ Bindings: Env }>();

type SpreadsheetRow = Record<string, unknown>;

const asString = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '');
const asOptionalString = (value: unknown): string | null => asString(value) || null;
const asBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  const normalized = asString(value).toLowerCase();
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return fallback;
};

const importedProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  description_en: z.string(),
  description_ar: z.string(),
  price: z.number().finite().nonnegative(),
  category_id: z.string().uuid().nullable(),
  prescription_required: z.boolean(),
  in_stock: z.boolean(),
  quantity: z.number().int().nonnegative(),
  provider_id: z.string().uuid().nullable(),
  pickup_location_id: z.string().uuid().nullable(),
});

const parseSpreadsheetRow = (row: SpreadsheetRow) => importedProductSchema.safeParse({
  sku: asString(row.SKU || row.sku),
  name_en: asString(row['Name EN'] || row.name_en),
  name_ar: asString(row['Name AR'] || row.name_ar || row['Name EN'] || row.name_en),
  description_en: asString(row['Description EN'] || row.description_en),
  description_ar: asString(row['Description AR'] || row.description_ar),
  price: Number(asString(row.Price || row.price || 0)),
  category_id: asOptionalString(row['Category ID'] || row.category_id),
  prescription_required: asBoolean(row.Prescription ?? row.prescription_required, false),
  in_stock: asBoolean(row['In Stock'] ?? row.in_stock, true),
  quantity: Number.parseInt(asString(row.Quantity || row.quantity || 0), 10),
  provider_id: asOptionalString(row['Provider ID'] || row.provider_id),
  pickup_location_id: asOptionalString(row['Pickup Location ID'] || row.pickup_location_id),
});

// Restrict management imports to authenticated admin users.
importRoutes.use('*', adminAuth);

// Import products from Excel/CSV.
importRoutes.post('/products', async (c) => {
  try {
    const formData = await c.req.formData();
    const uploaded = formData.get('file');
    if (!(uploaded instanceof File)) return c.json({ error: 'A spreadsheet file is required' }, 400);

    const buffer = await uploaded.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName || !workbook.Sheets[sheetName]) return c.json({ error: 'The spreadsheet does not contain a readable worksheet' }, 400);

    const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(workbook.Sheets[sheetName], { defval: '' });
    if (rows.length === 0) return c.json({ error: 'The spreadsheet does not contain product rows' }, 400);
    if (rows.length > 500) return c.json({ error: 'Import at most 500 products per file' }, 400);

    const products: z.infer<typeof importedProductSchema>[] = [];
    const invalidRows: Array<{ row: number; errors: string[] }> = [];

    rows.forEach((row, index) => {
      const parsed = parseSpreadsheetRow(row);
      if (parsed.success) {
        products.push(parsed.data);
      } else {
        invalidRows.push({
          row: index + 2,
          errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        });
      }
    });

    if (products.length === 0) {
      return c.json({ error: 'No valid products were found', invalidRows }, 400);
    }

    const supabase = getSupabaseAdmin(c);
    const { data: insertedProducts, error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' })
      .select();

    if (error) throw error;
    return c.json({ success: true, imported: insertedProducts?.length || 0, invalidRows, products: insertedProducts });
  } catch (error) {
    console.error('Import error:', error);
    return c.json({ error: 'Failed to import products' }, 500);
  }
});

// Download an import template.
importRoutes.get('/template', (c) => {
  const templateData = [{
    SKU: 'MED001',
    'Name EN': 'Product Name English',
    'Name AR': 'اسم المنتج بالعربية',
    'Description EN': 'Product description in English',
    'Description AR': 'وصف المنتج بالعربية',
    Price: 100,
    'Category ID': '',
    Prescription: 'No',
    'In Stock': 'Yes',
    Quantity: 50,
    'Provider ID': '',
    'Pickup Location ID': '',
  }];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  return c.body(buffer, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="products_template.xlsx"',
  });
});

// Create a product manually with server-side validation.
importRoutes.post('/product', async (c) => {
  try {
    const body = await c.req.json();
    const validated = importedProductSchema.parse(body);
    const supabase = getSupabaseAdmin(c);
    const { data, error } = await supabase.from('products').insert(validated).select().single();
    if (error) throw error;
    return c.json({ success: true, product: data }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid product data', details: error.issues }, 400);
    console.error('Manual product import error:', error);
    return c.json({ error: 'Failed to add product' }, 500);
  }
});
