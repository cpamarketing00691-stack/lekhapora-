import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// VAPID keys should be stored in environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BOQS5jGeY1uyMDkK7BocruEAkQVcWx3sSPe7VBVvoj_UpNT5FZmr52hu9izrT9i6M5J2ScIJhOd6AYhzWHRiAyI';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

webpush.setVapidDetails(
  'mailto:support@hsc-tracker.com',
  publicVapidKey,
  privateVapidKey
);

export default async function handler(req: any, res: any) {
  // Logic to prevent unauthorized calls could be added here (e.g., secret token)
  
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // 1. Fetch due and untriggered reminders from the last 5 minutes
    const { data: reminders, error: reminderError } = await supabaseAdmin
      .from('reminders')
      .select('*, user_id')
      .eq('is_done', false)
      .eq('is_triggered', false)
      .lte('time', now)
      .gte('time', fiveMinutesAgo);

    if (reminderError) throw reminderError;

    if (!reminders || reminders.length === 0) {
      return res.status(200).json({ message: 'No reminders due.' });
    }

    const results = [];

    for (const reminder of reminders) {
      // 2. Fetch the user's push subscription
      const { data: subData } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', reminder.user_id)
        .maybeSingle();

      if (subData?.subscription) {
        try {
          const payload = JSON.stringify({
            title: 'পড়ার সময় হয়েছে!',
            body: reminder.title,
            url: '/?tab=dashboard'
          });

          await webpush.sendNotification(subData.subscription, payload);
          
          // 3. Mark reminder as triggered
          await supabaseAdmin
            .from('reminders')
            .update({ is_triggered: true })
            .eq('id', reminder.id);
            
          results.push({ id: reminder.id, status: 'sent' });
        } catch (err) {
          console.error(`Failed to send push to user ${reminder.user_id}:`, err);
          results.push({ id: reminder.id, status: 'failed', error: err });
        }
      }
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return res.status(500).json({ error: error.message });
  }
}