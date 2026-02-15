import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) throw new Error('No session');

        // Check if user_data exists
        const { data: userData } = await supabase
          .from('user_data')
          .select('state')
          .eq('user_id', session.user.id)
          .single();

        if (!userData) {
          // Initialize for new social user
          await supabase.from('user_data').insert({
            user_id: session.user.id,
            state: {
              isAuthenticated: true,
              profile: null,
              subjects: [],
              studyHistory: [],
              testHistory: [],
              dailyTasks: [],
              streaks: 0,
              language: 'bn'
            }
          });
          navigate('/onboarding');
        } else {
          navigate('/app/dashboard');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg gap-4">
      <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      <p className="text-sm font-bold text-brand-text-s uppercase tracking-widest">Finalizing Gateway...</p>
    </div>
  );
};