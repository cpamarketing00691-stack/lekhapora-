
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLekhapora } from '../contexts/LekhaporaContext';

export function useSyncManager() {
  const { state, dispatch } = useLekhapora();
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Prevent sync if no user is logged in
    if (!state.user.id) return;

    // Tier 3: Debounced Supabase Write (5s)
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({ 
            user_id: state.user.id, 
            state: state,
            updated_at: new Date().toISOString() 
          });

        if (!error) {
          dispatch({ type: 'SYNC_COMPLETE', payload: Date.now() });
        }
      } catch (e) {
        console.error("Cloud Sync Failed", e);
      }
    }, 5000);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [state, state.user.id, dispatch]);
}
