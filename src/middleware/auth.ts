import type { Context, MiddlewareHandler, Next } from 'hono';
import { jwt } from 'hono/jwt';
import type { Env } from '../lib/supabase';

// JWT middleware for protected routes.
export const jwtAuth = (c: Context<{ Bindings: Env }>, next: Next) => {
  return jwt({ secret: c.env.JWT_SECRET })(c, next);
};

// Admin-only middleware. Authentication is evaluated before authorization.
export const adminAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authenticationResponse = await jwtAuth(c, async () => undefined);
  if (authenticationResponse) return authenticationResponse;

  const payload = c.get('jwtPayload') as { role?: string } | undefined;
  if (payload?.role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  await next();
};

// Get the authenticated user payload, if one exists.
export const getCurrentUser = (c: Context) => {
  return c.get('jwtPayload') || null;
};
