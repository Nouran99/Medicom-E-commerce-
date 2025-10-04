import { Hono } from 'hono';
import { getSupabaseClient, type Env } from '../lib/supabase';

export const productsRoutes = new Hono<{ Bindings: Env }>();

// Get all products with filters
productsRoutes.get('/', async c => {
  try {
    const supabase = getSupabaseClient(c);

    // Parse query parameters
    const category = c.req.query('category');
    const search = c.req.query('search');
    const prescription = c.req.query('prescription');
    const minPrice = c.req.query('min_price');
    const maxPrice = c.req.query('max_price');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const lang = c.req.query('lang') || 'ar';

    // Build query
    let query = supabase
      .from('products')
      .select(
        '*, categories(name_en, name_ar), providers(name_en, name_ar), pickup_locations(name_en, name_ar, address_en, address_ar)'
      )
      .eq('in_stock', true);

    if (category) {
      query = query.eq('category_id', category);
    }

    if (prescription === 'true') {
      query = query.eq('prescription_required', true);
    } else if (prescription === 'false') {
      query = query.eq('prescription_required', false);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      if (lang === 'ar') {
        query = query.or(`name_ar.ilike.${searchTerm},description_ar.ilike.${searchTerm}`);
      } else {
        query = query.or(`name_en.ilike.${searchTerm},description_en.ilike.${searchTerm}`);
      }
    }

    // Execute query with pagination
    const {
      data: products,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({
      products,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get single product
productsRoutes.get('/:id', async c => {
  try {
    const productId = c.req.param('id');
    const supabase = getSupabaseClient(c);

    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(*), providers(*), pickup_locations(*), inventory_lots(*)')
      .eq('id', productId)
      .single();

    if (error) throw error;

    // Get reviews for this product
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    return c.json({
      product,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    return c.json({ error: 'Product not found' }, 404);
  }
});

// Get categories
productsRoutes.get('/categories', async c => {
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

// Search products
productsRoutes.get('/search', async c => {
  try {
    const query = c.req.query('q');
    const lang = c.req.query('lang') || 'ar';

    if (!query) {
      return c.json({ error: 'Search query required' }, 400);
    }

    const supabase = getSupabaseClient(c);
    const searchTerm = `%${query}%`;

    let dbQuery = supabase
      .from('products')
      .select('*, categories(name_en, name_ar)')
      .eq('in_stock', true);

    if (lang === 'ar') {
      dbQuery = dbQuery.or(
        `name_ar.ilike.${searchTerm},description_ar.ilike.${searchTerm},sku.ilike.${searchTerm}`
      );
    } else {
      dbQuery = dbQuery.or(
        `name_en.ilike.${searchTerm},description_en.ilike.${searchTerm},sku.ilike.${searchTerm}`
      );
    }

    const { data: products, error } = await dbQuery.limit(20);

    if (error) throw error;

    return c.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});
