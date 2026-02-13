
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription data' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({ 
        user_id: userId, 
        subscription, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Push Subscribe Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
