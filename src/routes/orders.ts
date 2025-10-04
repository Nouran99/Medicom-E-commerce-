import { Hono } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { jwtAuth } from '../middleware/auth';
import { z } from 'zod';

export const ordersRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
ordersRoutes.use('*', jwtAuth);

// Create order
ordersRoutes.post('/create', async c => {
  try {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();

    const schema = z.object({
      delivery_method: z.enum(['courier', 'pickup']),
      delivery_address: z
        .object({
          name: z.string(),
          phone: z.string(),
          street: z.string(),
          building: z.string(),
          floor: z.string().optional(),
          apartment: z.string().optional(),
          city: z.string(),
          governorate: z.string(),
        })
        .optional(),
      pickup_location_id: z.string().uuid().optional(),
      payment_method: z.enum(['cod', 'fawry', 'card', 'wallet']),
      notes: z.string().optional(),
    });

    const validated = schema.parse(body);
    const supabase = getSupabaseAdmin(c);

    // Get cart
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (!cart || !cart.items || cart.items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // Generate order number
    const orderNumber = `ORD${Date.now()}`;

    // Calculate delivery fee
    const deliveryFee = validated.delivery_method === 'courier' ? 30 : 0;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: payload.sub,
        order_number: orderNumber,
        status: 'pending',
        subtotal: cart.subtotal,
        tax: cart.tax || 0,
        delivery_fee: deliveryFee,
        discount: cart.discount || 0,
        total: cart.subtotal - (cart.discount || 0) + (cart.tax || 0) + deliveryFee,
        currency: 'EGP',
        delivery_method: validated.delivery_method,
        delivery_address: validated.delivery_address,
        pickup_location_id: validated.pickup_location_id,
        payment_method: validated.payment_method,
        payment_status: validated.payment_method === 'cod' ? 'pending' : 'pending',
        coupon_id: cart.coupon_code ? null : null, // Would need to lookup coupon ID
        notes: validated.notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cart.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      prescription_required: item.prescription_required,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear cart
    await supabase
      .from('carts')
      .update({
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        coupon_code: null,
      })
      .eq('user_id', payload.sub);

    return c.json({ success: true, order });
  } catch (error) {
    console.error('Order creation error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get user orders
ordersRoutes.get('/', async c => {
  try {
    const payload = c.get('jwtPayload');
    const supabase = getSupabaseAdmin(c);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name_en, name_ar))')
      .eq('user_id', payload.sub)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ orders });
  } catch (error) {
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get single order
ordersRoutes.get('/:id', async c => {
  try {
    const payload = c.get('jwtPayload');
    const orderId = c.req.param('id');
    const supabase = getSupabaseAdmin(c);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*)), prescriptions(*), pickup_locations(*)')
      .eq('id', orderId)
      .eq('user_id', payload.sub)
      .single();

    if (error) throw error;

    return c.json({ order });
  } catch (error) {
    return c.json({ error: 'Order not found' }, 404);
  }
});

// Cancel order
ordersRoutes.post('/:id/cancel', async c => {
  try {
    const payload = c.get('jwtPayload');
    const orderId = c.req.param('id');
    const supabase = getSupabaseAdmin(c);

    // Check if order can be cancelled
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.sub)
      .single();

    if (fetchError || !order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return c.json({ error: 'Order cannot be cancelled' }, 400);
    }

    // Cancel order
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to cancel order' }, 500);
  }
});
