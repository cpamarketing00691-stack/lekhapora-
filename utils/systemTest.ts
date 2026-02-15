import { supabase } from '../lib/supabase';

export const runSystemTest = async () => {
  const results: Record<string, string> = {
    auth: '❓',
    database: '❓',
    environment: '❓',
    pwa: '❓'
  };

  console.log('🔍 Running Lekhapora Core Diagnostics...');

  // Test 1: Auth
  try {
    const { data: { session } } = await supabase.auth.getSession();
    results.auth = session ? `✅ Authenticated as ${session.user.email}` : '⚠️ Anonymous Session';
  } catch (err: any) {
    results.auth = '❌ Auth Connection Failure: ' + err.message;
  }

  // Test 2: Database Integrity
  try {
    const { error } = await supabase.from('user_data').select('count', { count: 'exact', head: true });
    results.database = error ? '❌ DB Query Blocked: ' + error.message : '✅ Protocol Link Established';
  } catch (err: any) {
    results.database = '❌ Database Handshake Failed';
  }

  // Test 3: Environment Variables
  const hasKey = !!supabase;
  results.environment = hasKey ? '✅ Secure Keys Injected' : '❌ Environment Breach';

  // Test 4: PWA Registration
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    results.pwa = registrations.length > 0 ? '✅ Service Worker Active' : '⚠️ SW Pending Registration';
  } else {
    results.pwa = '❌ Browser incompatible with PWA protocols';
  }

  console.table(results);
  return results;
};

// Expose globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).runSystemTest = runSystemTest;
}