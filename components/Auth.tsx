
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

interface AuthProps {
  onAuthSuccess: () => void;
}

// Define specific messages for persistent 429 errors
const RETRY_EXHAUSTED_429_MESSAGE = "Persistent rate limiting detected. Please wait 5-10 minutes before trying again.";

// Helper for retry logic with specific 429 alert
const retryWithDelay = async (
  fn: () => Promise<AuthResponse>,
  retries = 3,
  delay = 2000,
): Promise<AuthResponse> => {
  let result = await fn();

  if (result.error && (result.error as any).status === 429) {
    alert("Too many attempts from this device/IP. Please wait a few minutes.");
    console.warn(`Auth.tsx: Rate limit hit (429). Retrying...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    for (let i = 1; i <= retries; i++) {
      result = await fn();
      if (!result.error || (result.error as any).status !== 429) return result;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return { data: { user: null, session: null }, error: new Error(RETRY_EXHAUSTED_429_MESSAGE) as any };
  }
  return result;
};

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign-In Function
  async function signInUser(email: string, password: string) {
    const { data, error } = await retryWithDelay(() => supabase.auth.signInWithPassword({ email, password }));
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        alert("Please check your email for a verification link to confirm your account.");
      } else {
        alert("Sign-in failed: " + error.message); 
      }
      return null; 
    }

    if (data.user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle(); 
      return { user: data.user, profile };
    }
    return null;
  }

  // Sign-Up Function
  async function signUpUser(email: string, password: string, fullName: string) {
    const { data, error } = await retryWithDelay(() => supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName
        }
      }
    }));

    if (error) {
      alert("Sign-up failed: " + error.message);
      return null;
    }

    if (data.user) {
      alert("Registration successful! Please check your email inbox for a confirmation link before signing in.");
      setMode('signin');
      return data.user;
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signInUser(email, password);
        if (result) onAuthSuccess();
      } else {
        await signUpUser(email, password, name);
      }
    } catch (err: any) {
      alert("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-brand-primary/10 border border-brand-text-s/10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-brand-primary italic">HSC TRACKER</h1>
          <p className="text-brand-text-s font-black uppercase tracking-widest text-[10px] mt-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create New Account'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name" 
                  required={mode === 'signup'}
                  className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
                />
              </div>
            </div>
          )}
          
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
                minLength={6}
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            {!loading && (mode === 'signin' ? <ArrowRight size={18} /> : <UserPlus size={18} />)}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s hover:text-brand-primary transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
