import { Hono } from 'hono';
import { getSupabaseClient, type Env } from '../lib/supabase';
import { demoCategories, demoProducts, findDemoProducts } from '../lib/demo-catalog';

export const productsRoutes = new Hono<{ Bindings: Env }>();

const isDemoMode = (c: { env: Env }) => c.env.DEMO_MODE === 'true';

const parsePagination = (value: string | undefined, fallback: number, maximum: number) => {
  const parsed = Number.parseInt(value || String(fallback), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
};

// Get categories before the dynamic :id route so literal paths are never captured as IDs.
productsRoutes.get('/categories', async (c) => {
  if (isDemoMode(c)) {
    return c.json(demoCategories);
  }

  try {
    const supabase = getSupabaseClient(c);
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return c.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Search products before the dynamic :id route.
productsRoutes.get('/search', async (c) => {
  const searchQuery = c.req.query('q')?.trim();
  const lang = c.req.query('lang') || 'ar';

  if (!searchQuery) {
    return c.json({ error: 'Search query required' }, 400);
  }

  if (isDemoMode(c)) {
    const result = findDemoProducts({ offset: 0, limit: 20, search: searchQuery });
    return c.json({ products: result.products });
  }

  try {
    const supabase = getSupabaseClient(c);
    const sanitizedSearch = searchQuery.replace(/[%_,()]/g, '');
    const searchTerm = `%${sanitizedSearch}%`;
    const fields = lang === 'ar'
      ? `name_ar.ilike.${searchTerm},description_ar.ilike.${searchTerm},sku.ilike.${searchTerm}`
      : `name_en.ilike.${searchTerm},description_en.ilike.${searchTerm},sku.ilike.${searchTerm}`;

    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name_en, name_ar)')
      .eq('in_stock', true)
      .or(fields)
      .limit(20);

    if (error) throw error;
    return c.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// Get all products with filters.
productsRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const search = c.req.query('search');
  const prescription = c.req.query('prescription');
  const minPrice = c.req.query('min_price');
  const maxPrice = c.req.query('max_price');
  const limit = parsePagination(c.req.query('limit'), 20, 50);
  const offset = parsePagination(c.req.query('offset'), 0, 10_000);
  const lang = c.req.query('lang') || 'ar';

  if (isDemoMode(c)) {
    const result = findDemoProducts({ category, search, prescription, minPrice, maxPrice, offset, limit });
    return c.json({ ...result, limit, offset, mode: 'demo' });
  }

  try {
    const supabase = getSupabaseClient(c);
    let query = supabase
      .from('products')
      .select('*, categories(name_en, name_ar), providers(name_en, name_ar), pickup_locations(name_en, name_ar, address_en, address_ar)', { count: 'exact' })
      .eq('in_stock', true);

    if (category) query = query.eq('category_id', category);
    if (prescription === 'true') query = query.eq('prescription_required', true);
    if (prescription === 'false') query = query.eq('prescription_required', false);
    if (minPrice && Number.isFinite(Number(minPrice))) query = query.gte('price', Number(minPrice));
    if (maxPrice && Number.isFinite(Number(maxPrice))) query = query.lte('price', Number(maxPrice));

    if (search?.trim()) {
      const sanitizedSearch = search.trim().replace(/[%_,()]/g, '');
      const searchTerm = `%${sanitizedSearch}%`;
      const fields = lang === 'ar'
        ? `name_ar.ilike.${searchTerm},description_ar.ilike.${searchTerm}`
        : `name_en.ilike.${searchTerm},description_en.ilike.${searchTerm}`;
      query = query.or(fields);
    }

    const { data: products, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ products, total: count || 0, limit, offset, mode: 'live' });
  } catch (error) {
    console.error('Products fetch error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get one product.
productsRoutes.get('/:id', async (c) => {
  const productId = c.req.param('id');

  if (isDemoMode(c)) {
    const product = demoProducts.find((item) => item.id === productId);
    if (!product) return c.json({ error: 'Product not found' }, 404);
    return c.json({ product, reviews: [], mode: 'demo' });
  }

  try {
    const supabase = getSupabaseClient(c);
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(*), providers(*), pickup_locations(*), inventory_lots(*)')
      .eq('id', productId)
      .single();

    if (error || !product) return c.json({ error: 'Product not found' }, 404);

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) throw reviewsError;
    return c.json({ product, reviews: reviews || [], mode: 'live' });
  } catch (error) {
    console.error('Product fetch error:', error);
    return c.json({ error: 'Product not found' }, 404);
  }
});
