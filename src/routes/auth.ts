import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { z } from 'zod';

export const authRoutes = new Hono<{ Bindings: Env }>();

// Request OTP
authRoutes.post('/request-otp', async c => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      identifier: z.string(),
      type: z.enum(['sms', 'email']),
    });

    const validated = schema.parse(body);
    const authService = new AuthService(c);
    const result = await authService.requestOTP(validated.identifier, validated.type);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    return c.json({ success: false, message: 'Invalid request' }, 400);
  }
});

// Verify OTP
authRoutes.post('/verify-otp', async c => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      identifier: z.string(),
      otp: z.string().length(6),
    });

    const validated = schema.parse(body);
    const authService = new AuthService(c);
    const result = await authService.verifyOTP(validated.identifier, validated.otp);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    return c.json({ success: false, message: 'Invalid OTP' }, 400);
  }
});

// Update user profile
authRoutes.put('/profile', async c => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const authService = new AuthService(c);
    const payload = await authService.verifyToken(token);

    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const body = await c.req.json();
    const supabase = getSupabaseAdmin(c);

    const { data, error } = await supabase
      .from('users')
      .update({
        name: body.name,
        language: body.language,
        notification_preferences: body.notification_preferences,
      })
      .eq('id', payload.sub)
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, user: data });
  } catch (error) {
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get current user
authRoutes.get('/me', async c => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const authService = new AuthService(c);
    const payload = await authService.verifyToken(token);

    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const supabase = getSupabaseAdmin(c);
    const { data, error } = await supabase.from('users').select('*').eq('id', payload.sub).single();

    if (error) throw error;

    return c.json({ success: true, user: data });
  } catch (error) {
    return c.json({ error: 'Failed to get user' }, 500);
  }
});
