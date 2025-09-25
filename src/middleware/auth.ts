import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import type { Env } from '../lib/supabase';

// JWT middleware for protected routes
export const jwtAuth = (c: Context<{ Bindings: Env }>, next: Next) => {
  return jwt({ secret: c.env.JWT_SECRET })(c, next);
};

// Admin-only middleware
export const adminAuth = async (c: Context<{ Bindings: Env }>, next: Next) => {
  await jwtAuth(c, async () => {
    const payload = c.get('jwtPayload');
    if (payload?.role !== 'admin') {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403);
    }
    await next();
  });
};

// Get current user from JWT
export const getCurrentUser = (c: Context) => {
  const payload = c.get('jwtPayload');
  return payload || null;
};