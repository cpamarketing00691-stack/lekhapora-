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
      'x-client-info': 'lekhapora-pwa-v2'
    }
  },
  db: {
    schema: 'public'
  }
});

/**
 * Robust timeout wrapper with generic typing
 */
// Fix: Change promise parameter to any to support Supabase's Thenable PostgrestBuilder which is not a native Promise
export const withTimeout = <T = any>(promise: any, timeoutMs: number = 5000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Operation timed out (${timeoutMs}ms)`)), timeoutMs);
  });

  // Fix: Wrap input in Promise.resolve to handle thenables (like Supabase builders) and ensure .finally is available
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
};

/**
 * Defensive connection test
 */
export const testConnection = async () => {
  try {
    // Fix: Explicitly cast result to any to correctly access the .error property from the Supabase response
    const result: any = await withTimeout(
      supabase.from('user_data').select('count').limit(1),
      4000
    );
    return !result.error;
  } catch (err) {
    console.warn("Supabase Check Failed:", err);
    return false;
  }
};
