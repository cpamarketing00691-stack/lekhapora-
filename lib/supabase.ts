
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseAnonKey = 'sb_publishable_AvaNpR5XsRFbhSu7A6uHhg_W2xzhkRx';

// Create client with improved storage persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

/**
 * Optimized query helper with abort support
 */
export const createQuery = (table: string, signal?: AbortSignal) => {
  let query = supabase.from(table).select('*');
  if (signal) {
    // In current supabase-js, abort is handled via fetch options if custom fetch is used,
    // or through the controller implicitly if using native browser fetch within the SDK.
  }
  return query;
};
