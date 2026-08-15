import { Hono, type Context } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { jwtAuth } from '../middleware/auth';
import { createHash } from 'crypto';

export const paymentRoutes = new Hono<{ Bindings: Env }>();

// Process payment
paymentRoutes.post('/process', jwtAuth, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { order_id, payment_method } = await c.req.json();
    
    const supabase = getSupabaseAdmin(c);
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', payload.sub)
      .single();
    
    if (error || !order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    // Handle different payment methods
    let paymentResult;
    
    switch (payment_method) {
      case 'cod':
        // Cash on delivery - no immediate payment
        paymentResult = {
          success: true,
          transaction_id: `COD-${Date.now()}`,
          status: 'pending',
        };
        break;
        
      case 'fawry':
        // Fawry payment integration
        paymentResult = await processFawryPayment(c, order);
        break;
        
      case 'card':
        // Card payment would be integrated here
        paymentResult = {
          success: true,
          transaction_id: `CARD-${Date.now()}`,
          status: 'paid',
        };
        break;
        
      case 'wallet':
        // E-wallet payment
        paymentResult = {
          success: true,
          transaction_id: `WALLET-${Date.now()}`,
          status: 'paid',
        };
        break;
        
      default:
        return c.json({ error: 'Invalid payment method' }, 400);
    }
    
    if (paymentResult.success) {
      // Update order payment status
      await supabase
        .from('orders')
        .update({
          payment_status: paymentResult.status,
          status: paymentResult.status === 'paid' ? 'confirmed' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);
    }
    
    return c.json(paymentResult);
  } catch (error) {
    console.error('Payment processing error:', error);
    return c.json({ error: 'Payment processing failed' }, 500);
  }
});

// Fawry payment integration
async function processFawryPayment(c: Context<{ Bindings: Env }>, order: any) {
  try {
    const merchantCode = c.env.FAWRY_MERCHANT_CODE;
    const secretKey = c.env.FAWRY_SECRET_KEY;
    const sandboxUrl = c.env.FAWRY_SANDBOX_URL;
    
    // Prepare Fawry payment request
    const paymentData = {
      merchantCode,
      merchantRefNum: order.order_number,
      customerMobile: order.user?.phone || '01000000000',
      customerEmail: order.user?.email || 'customer@example.com',
      paymentAmount: order.total,
      currencyCode: 'EGP',
      description: `Order ${order.order_number}`,
      paymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      chargeItems: [
        {
          itemId: order.order_number,
          description: 'Medical Products',
          price: order.total,
          quantity: 1,
        },
      ],
    };
    
    // Generate signature (simplified for demo)
    const signature = createHash('sha256')
      .update(`${merchantCode}${order.order_number}${order.total}${secretKey}`)
      .digest('hex');
    
    // In production, make actual API call to Fawry
    // For demo, return mock response
    return {
      success: true,
      transaction_id: `FAWRY-${Date.now()}`,
      status: 'pending',
      payment_url: `https://atfawry.fawrystaging.com/pay/${order.order_number}`,
      reference_number: `FAW${Date.now()}`,
    };
  } catch (error) {
    console.error('Fawry payment error:', error);
    return {
      success: false,
      error: 'Fawry payment failed',
    };
  }
}

// Payment callback/webhook
paymentRoutes.post('/webhook/:provider', async (c) => {
  try {
    const provider = c.req.param('provider');
    const body = await c.req.json();
    
    // Handle webhook based on provider
    switch (provider) {
      case 'fawry':
        // Handle Fawry webhook
        break;
      case 'stripe':
        // Handle Stripe webhook
        break;
      default:
        return c.json({ error: 'Unknown provider' }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});