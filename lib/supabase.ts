import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycxbrcbweeuvizrgpnw.supabase.co';
// In production, these should ideally come from process.env, but hardcoded for the current environment.
const supabaseAnonKey = 'sb_publishable_AvaNpR5XsRFbhSu7A6uHhg_W2xzhkRx';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: SUPABASE CREDENTIALS MISSING');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'x-client-info': 'lekhapora-pwa-emergency-fix'
    }
  },
  db: {
    schema: 'public'
  }
});

/**
 * CRITICAL: Timeout wrapper for all Supabase calls.
 * Prevents the app from staying in a loading state if a request hangs.
 * Fix: Changed parameter type to PromiseLike to support Supabase's thenable builders.
 */
export const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number = 8000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

/**
 * Connection test to detect network issues early
 */
export const testConnection = async () => {
  try {
    // Fix: Explicitly cast withTimeout result to any to fix error property access errors.
    // The signature change to PromiseLike in withTimeout resolves the assignment error.
    const { error }: any = await withTimeout(
      supabase.from('user_data').select('count').limit(1)
    );
    if (error) return false;
    return true;
  } catch (err) {
    console.warn("Supabase connection check failed:", err);
    return false;
  }
};
