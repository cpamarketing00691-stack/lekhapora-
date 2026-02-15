import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseAnonKey = 'sb_publishable_AvaNpR5XsRFbhSu7A6uHhg_W2xzhkRx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'x-client-info': 'lekhapora-pwa'
    }
  },
  realtime: {
    timeout: 10000
  }
});

/**
 * Connection test to detect network issues early
 */
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('user_data').select('count').limit(1);
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
};

export const createQuery = (table: string) => {
  return supabase.from(table).select('*');
};