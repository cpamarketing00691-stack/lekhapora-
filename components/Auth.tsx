
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

interface AuthProps {
  onAuthSuccess: () => void;
}

// Define specific messages for persistent 429 errors
const RETRY_EXHAUSTED_429_MESSAGE_SIGNIN = "Sign-in attempts failed due to persistent rate limiting. Please wait a longer period (e.g., 5-10 minutes) before trying again.";

// Helper for retry logic with specific 429 alert on first occurrence and improved final message
const retryWithDelay = async (
  fn: () => Promise<AuthResponse>,
  retries = 3,
  delay = 2000, // 2 seconds
): Promise<AuthResponse> => {
  let result = await fn(); // First attempt

  if (result.error && (result.error as any).status === 429) {
    // Display the specific alert immediately on the first 429 error
    alert("Too many sign-in attempts from this device/IP. Please wait a few minutes before trying again.");
    console.warn(`Rate limit hit (429) on initial attempt. Retrying in ${delay / 1000}s... (Attempt 1/${retries + 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Subsequent retries
    for (let i = 1; i <= retries; i++) {
      result = await fn(); // Re-execute the function
      if (!result.error || (result.error as any).status !== 429) {
        // If successful, or a non-429 error, return this result
        return result; 
      }
      console.warn(`Rate limit hit (429). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    // If the loop finishes, all retries failed due to persistent 429
    // Return a specific error message to be handled by signInUser
    return { data: { user: null, session: null }, error: new Error(RETRY_EXHAUSTED_429_MESSAGE_SIGNIN) as any };
  } else {
    // Initial attempt was successful or had a non-429 error, so return its result directly
    return result;
  }
};

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign-In Function
  async function signInUser(email: string, password: string) {
    const { data, error } = await retryWithDelay(() => supabase.auth.signInWithPassword({ email, password }));
    
    if (error) { 
      // The retryWithDelay function already returns the most specific error message.
      // We directly alert it here, with a special case for unconfirmed email.
      if (error.message.includes('Email not confirmed')) {
        alert("Sign-in failed: Your email address has not been confirmed. Please check your inbox for a verification link and confirm your account.");
      }
      else {
        alert("Sign-in failed: " + error.message); 
      }
      return null; 
    }

    if (data.user) {
      // Fetch user profile info
      // Use maybeSingle to avoid throwing if profile doesn't exist (e.g., if signup failed on profile creation)
      const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle(); 
      
      if (profileError) {
        console.error("Error fetching user profile during sign-in:", profileError.message);
        alert("Sign-in successful, but could not fetch your profile data. Please ensure the 'users' table exists and has correct RLS policies for selects. You might need to complete onboarding. Error: " + profileError.message);
      } else if (!profile) {
        alert("Sign-in successful! Please complete your profile onboarding.");
      }
      else {
        alert("Sign-in successful!");
      }
      return { user: data.user, profile }; // profile can be null if not found
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await signInUser(email, password);
      if (result) {
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Runtime Auth Error:', err);
      alert("An unexpected error occurred during authentication: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-brand-primary/10 border border-brand-text-s/10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-brand-primary italic">HSC TRACKER</h1>
          <p className="text-brand-text-s font-bold uppercase tracking-widest text-[10px] mt-2">Professional Study Management</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" 
                required
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
