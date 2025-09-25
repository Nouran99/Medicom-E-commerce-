import { Hono } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import bcryptjs from 'bcryptjs';
import { sign } from 'hono/jwt';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Admin login
adminRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    const supabase = getSupabaseAdmin(c);
    
    // Get admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !admin) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password (in production, use proper hash)
    // For demo, accept 'admin123' as password
    if (password !== 'admin123') {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate token
    const token = await sign(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      },
      c.env.JWT_SECRET
    );
    
    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);
    
    return c.json({ success: true, token, admin });
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Dashboard stats
adminRoutes.get('/dashboard/stats', async (c) => {
  try {
    const supabase = getSupabaseAdmin(c);
    
    // Get counts
    const [orders, products, users, revenue] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').eq('payment_status', 'paid'),
    ]);
    
    const totalRevenue = revenue.data?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;
    
    return c.json({
      totalOrders: orders.count || 0,
      totalProducts: products.count || 0,
      totalUsers: users.count || 0,
      totalRevenue,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Product management
adminRoutes.get('/products', async (c) => {
  const supabase = getSupabaseAdmin(c);
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), providers(*)')
    .order('created_at', { ascending: false });
  
  if (error) return c.json({ error: 'Failed to fetch products' }, 500);
  return c.json({ products: data });
});

// Add/Update product
adminRoutes.post('/products', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabaseAdmin(c);
  
  const { data, error } = await supabase
    .from('products')
    .upsert(body)
    .select()
    .single();
  
  if (error) return c.json({ error: 'Failed to save product' }, 500);
  return c.json({ success: true, product: data });
});

// Order management
adminRoutes.get('/orders', async (c) => {
  const supabase = getSupabaseAdmin(c);
  const { data, error } = await supabase
    .from('orders')
    .select('*, users(name, email, phone), order_items(*, products(name_en, name_ar))')
    .order('created_at', { ascending: false });
  
  if (error) return c.json({ error: 'Failed to fetch orders' }, 500);
  return c.json({ orders: data });
});

// Update order status
adminRoutes.put('/orders/:id/status', async (c) => {
  const orderId = c.req.param('id');
  const { status } = await c.req.json();
  const supabase = getSupabaseAdmin(c);
  
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  
  if (error) return c.json({ error: 'Failed to update order' }, 500);
  return c.json({ success: true });
});