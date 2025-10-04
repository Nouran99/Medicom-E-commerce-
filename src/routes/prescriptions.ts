import { Hono } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { jwtAuth } from '../middleware/auth';

export const prescriptionRoutes = new Hono<{ Bindings: Env }>();

// Upload prescription
prescriptionRoutes.post('/upload', jwtAuth, async c => {
  try {
    const payload = c.get('jwtPayload');
    const formData = await c.req.formData();
    const orderId = formData.get('order_id') as string;
    const orderItemId = formData.get('order_item_id') as string;
    const file = formData.get('file') as File;

    if (!file || !orderId || !orderItemId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // In production, upload to R2 or similar storage
    // For demo, we'll store a placeholder URL
    const fileUrl = `/prescriptions/${orderId}/${file.name}`;

    const supabase = getSupabaseAdmin(c);

    // Create prescription record
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        order_id: orderId,
        order_item_id: orderItemId,
        file_url: fileUrl,
        review_status: 'pending',
        refund_eligible_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
      })
      .select()
      .single();

    if (error) throw error;

    // Update order status
    await supabase.from('orders').update({ status: 'prescription_review' }).eq('id', orderId);

    return c.json({ success: true, prescription: data });
  } catch (error) {
    return c.json({ error: 'Failed to upload prescription' }, 500);
  }
});

// Get prescription status
prescriptionRoutes.get('/:id', jwtAuth, async c => {
  try {
    const prescriptionId = c.req.param('id');
    const supabase = getSupabaseAdmin(c);

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (error) throw error;

    return c.json({ prescription: data });
  } catch (error) {
    return c.json({ error: 'Prescription not found' }, 404);
  }
});

// Review prescription (admin only)
prescriptionRoutes.post('/:id/review', async c => {
  try {
    const prescriptionId = c.req.param('id');
    const { status, rejection_reason } = await c.req.json();

    const supabase = getSupabaseAdmin(c);

    const updateData: any = {
      review_status: status,
      review_date: new Date().toISOString(),
    };

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', prescriptionId)
      .select('*, order_id')
      .single();

    if (error) throw error;

    // Update order status
    const orderStatus = status === 'approved' ? 'prescription_approved' : 'prescription_rejected';
    await supabase.from('orders').update({ status: orderStatus }).eq('id', prescription.order_id);

    return c.json({ success: true, prescription });
  } catch (error) {
    return c.json({ error: 'Failed to review prescription' }, 500);
  }
});
