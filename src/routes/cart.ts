import { Hono } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { jwtAuth } from '../middleware/auth';
import { z } from 'zod';

export const cartRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all cart routes
cartRoutes.use('*', jwtAuth);

// Get cart
cartRoutes.get('/', async c => {
  try {
    const payload = c.get('jwtPayload');
    const supabase = getSupabaseAdmin(c);

    const { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return c.json(cart || { items: [], total: 0 });
  } catch (error) {
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

// Add to cart
cartRoutes.post('/add', async c => {
  try {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();

    const schema = z.object({
      product_id: z.string().uuid(),
      quantity: z.number().min(1),
    });

    const validated = schema.parse(body);
    const supabase = getSupabaseAdmin(c);

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', validated.product_id)
      .single();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ user_id: payload.sub, items: [] })
        .select()
        .single();
      cart = newCart;
    }

    // Add or update item
    const items = cart.items || [];
    const existingItem = items.find((item: any) => item.product_id === validated.product_id);

    if (existingItem) {
      existingItem.quantity += validated.quantity;
    } else {
      items.push({
        product_id: validated.product_id,
        quantity: validated.quantity,
        price: product.price,
        prescription_required: product.prescription_required,
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Update cart
    const { data: updatedCart, error } = await supabase
      .from('carts')
      .update({
        items,
        subtotal,
        total: subtotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, cart: updatedCart });
  } catch (error) {
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

// Update cart item
cartRoutes.put('/item/:productId', async c => {
  try {
    const payload = c.get('jwtPayload');
    const productId = c.req.param('productId');
    const body = await c.req.json();

    const schema = z.object({
      quantity: z.number().min(0),
    });

    const validated = schema.parse(body);
    const supabase = getSupabaseAdmin(c);

    // Get cart
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (!cart) {
      return c.json({ error: 'Cart not found' }, 404);
    }

    // Update or remove item
    let items = cart.items || [];

    if (validated.quantity === 0) {
      items = items.filter((item: any) => item.product_id !== productId);
    } else {
      const item = items.find((item: any) => item.product_id === productId);
      if (item) {
        item.quantity = validated.quantity;
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Update cart
    const { data: updatedCart, error } = await supabase
      .from('carts')
      .update({
        items,
        subtotal,
        total: subtotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, cart: updatedCart });
  } catch (error) {
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

// Clear cart
cartRoutes.delete('/clear', async c => {
  try {
    const payload = c.get('jwtPayload');
    const supabase = getSupabaseAdmin(c);

    const { error } = await supabase
      .from('carts')
      .update({
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        delivery_fee: 0,
        total: 0,
        coupon_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', payload.sub);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to clear cart' }, 500);
  }
});

// Apply coupon
cartRoutes.post('/coupon', async c => {
  try {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();

    const schema = z.object({
      code: z.string(),
    });

    const validated = schema.parse(body);
    const supabase = getSupabaseAdmin(c);

    // Get cart
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (!cart) {
      return c.json({ error: 'Cart not found' }, 404);
    }

    // Validate coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', validated.code)
      .eq('is_active', true)
      .single();

    if (!coupon) {
      return c.json({ error: 'Invalid coupon code' }, 400);
    }

    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom || now > validUntil) {
      return c.json({ error: 'Coupon has expired' }, 400);
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return c.json({ error: 'Coupon usage limit reached' }, 400);
    }

    if (cart.subtotal < coupon.minimum_order) {
      return c.json({ error: `Minimum order amount is ${coupon.minimum_order} EGP` }, 400);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart.subtotal * coupon.discount_value) / 100;
      if (coupon.maximum_discount && discount > coupon.maximum_discount) {
        discount = coupon.maximum_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    // Update cart
    const { data: updatedCart, error } = await supabase
      .from('carts')
      .update({
        coupon_code: validated.code,
        discount,
        total: cart.subtotal - discount + cart.tax + cart.delivery_fee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, cart: updatedCart, discount });
  } catch (error) {
    return c.json({ error: 'Failed to apply coupon' }, 500);
  }
});
