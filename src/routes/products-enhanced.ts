import { Hono } from 'hono';
import { getSupabaseClient, type Env } from '../lib/supabase';

export const productsEnhancedRoutes = new Hono<{ Bindings: Env }>();

// Get all enhanced products with filters
productsEnhancedRoutes.get('/', async c => {
  try {
    const supabase = getSupabaseClient(c);

    // Parse query parameters
    const category = c.req.query('category');
    const seller = c.req.query('seller');
    const search = c.req.query('search');
    const minPrice = c.req.query('min_price');
    const maxPrice = c.req.query('max_price');
    const prescription = c.req.query('prescription');
    const featured = c.req.query('featured');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const lang = c.req.query('lang') || 'ar';

    // Build query
    let query = supabase
      .from('products_enhanced')
      .select(
        `
        *,
        seller:sellers(*),
        category:categories(name_en, name_ar)
      `
      )
      .eq('status', 'active');

    if (category) {
      query = query.eq('category_id', category);
    }

    if (seller) {
      query = query.eq('seller_id', seller);
    }

    if (prescription === 'true') {
      query = query.eq('prescription_required', true);
    } else if (prescription === 'false') {
      query = query.eq('prescription_required', false);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (minPrice) {
      query = query.gte('price_per_unit', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price_per_unit', parseFloat(maxPrice));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      if (lang === 'ar') {
        query = query.or(
          `name_ar.ilike.${searchTerm},active_ingredient.ilike.${searchTerm},product_code.ilike.${searchTerm}`
        );
      } else {
        query = query.or(
          `name_en.ilike.${searchTerm},active_ingredient.ilike.${searchTerm},product_code.ilike.${searchTerm}`
        );
      }
    }

    // Execute query with pagination
    const {
      data: products,
      error,
      count,
    } = await query
      .range(offset, offset + limit - 1)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Increment view count for each product (in background)
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      supabase
        .rpc('increment_view_count', { product_ids: productIds })
        .then(() => {})
        .catch(() => {});
    }

    return c.json({
      products,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Enhanced products fetch error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get single product with full details
productsEnhancedRoutes.get('/:code', async c => {
  try {
    const productCode = c.req.param('code');
    const supabase = getSupabaseClient(c);

    const { data: product, error } = await supabase
      .from('products_enhanced')
      .select(
        `
        *,
        seller:sellers(*),
        category:categories(*),
        questions:product_questions(
          *,
          user:users(name),
          seller:sellers(name_en, name_ar)
        )
      `
      )
      .eq('product_code', productCode)
      .single();

    if (error) throw error;

    // Get related products from same seller
    const { data: relatedProducts } = await supabase
      .from('products_enhanced')
      .select('*')
      .eq('seller_id', product.seller_id)
      .neq('id', product.id)
      .eq('status', 'active')
      .limit(4);

    // Get seller reviews
    const { data: sellerReviews } = await supabase
      .from('seller_reviews')
      .select('*, user:users(name)')
      .eq('seller_id', product.seller_id)
      .order('created_at', { ascending: false })
      .limit(5);

    return c.json({
      product,
      relatedProducts: relatedProducts || [],
      sellerReviews: sellerReviews || [],
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    return c.json({ error: 'Product not found' }, 404);
  }
});

// Get seller profile
productsEnhancedRoutes.get('/seller/:code', async c => {
  try {
    const sellerCode = c.req.param('code');
    const supabase = getSupabaseClient(c);

    const { data: seller, error } = await supabase
      .from('sellers')
      .select(
        `
        *,
        products:products_enhanced(count),
        reviews:seller_reviews(count)
      `
      )
      .eq('seller_code', sellerCode)
      .single();

    if (error) throw error;

    // Get seller's products
    const { data: products } = await supabase
      .from('products_enhanced')
      .select('*')
      .eq('seller_id', seller.id)
      .eq('status', 'active')
      .limit(20);

    return c.json({
      seller,
      products: products || [],
    });
  } catch (error) {
    console.error('Seller fetch error:', error);
    return c.json({ error: 'Seller not found' }, 404);
  }
});

// Ask question about product
productsEnhancedRoutes.post('/:id/question', async c => {
  try {
    const productId = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient(c);

    const { data, error } = await supabase
      .from('product_questions')
      .insert({
        product_id: productId,
        user_id: body.user_id,
        question: body.question,
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, question: data });
  } catch (error) {
    return c.json({ error: 'Failed to submit question' }, 500);
  }
});

// Check stock alerts
productsEnhancedRoutes.get('/alerts/low-stock', async c => {
  try {
    const supabase = getSupabaseClient(c);

    const { data: products, error } = await supabase
      .from('products_enhanced')
      .select('*, seller:sellers(name_en, name_ar, email)')
      .lt('quantity_available', 'stock_alert_level')
      .eq('status', 'active');

    if (error) throw error;

    return c.json({ products: products || [] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stock alerts' }, 500);
  }
});
