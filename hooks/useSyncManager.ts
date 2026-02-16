import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLekhapora } from '../contexts/LekhaporaContext';

export function useSyncManager() {
  const { state, dispatch } = useLekhapora();
  const syncTimerRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<string>('');

  // We stringify only the data parts to detect real changes 
  // and avoid loops caused by metadata (like lastSynced timestamp)
  const syncDataHash = JSON.stringify({
    subjects: state.subjects,
    history: state.studyHistory,
    tests: state.testHistory,
    tasks: state.tasks,
    profile: state.user.profile,
    settings: state.settings
  });

  useEffect(() => {
    if (!state.user.id || syncDataHash === lastSyncedRef.current) return;

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
          lastSyncedRef.current = syncDataHash;
          dispatch({ type: 'SYNC_COMPLETE', payload: Date.now() });
        }
      } catch (e) {
        console.error("Cloud Sync Failed", e);
      }
    }, 5000);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [syncDataHash, state.user.id, dispatch]);
}