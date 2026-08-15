import { Hono, type Context } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';

export const notificationRoutes = new Hono<{ Bindings: Env }>();

// Send notification
notificationRoutes.post('/send', async (c) => {
  try {
    const { user_id, type, channel, message } = await c.req.json();
    
    const supabase = getSupabaseAdmin(c);
    
    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    let recipient = '';
    let success = false;
    
    switch (channel) {
      case 'sms':
        recipient = user.phone;
        success = await sendSMS(c, recipient, message);
        break;
      case 'whatsapp':
        recipient = user.phone;
        success = await sendWhatsApp(c, recipient, message);
        break;
      case 'email':
        recipient = user.email;
        // Email sending would be implemented here
        success = true;
        break;
    }
    
    // Log notification
    await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        channel,
        recipient,
        message,
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
      });
    
    return c.json({ success });
  } catch (error) {
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

async function sendSMS(c: Context<{ Bindings: Env }>, phone: string, message: string): Promise<boolean> {
  try {
    const twilioAuth = btoa(`${c.env.TWILIO_ACCOUNT_SID}:${c.env.TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${c.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': phone,
          'From': c.env.TWILIO_PHONE_NUMBER,
          'Body': message,
        }),
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
}

async function sendWhatsApp(c: Context<{ Bindings: Env }>, phone: string, message: string): Promise<boolean> {
  try {
    const twilioAuth = btoa(`${c.env.TWILIO_ACCOUNT_SID}:${c.env.TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${c.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': `whatsapp:${phone}`,
          'From': c.env.TWILIO_WHATSAPP_NUMBER,
          'Body': message,
        }),
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return false;
  }
}