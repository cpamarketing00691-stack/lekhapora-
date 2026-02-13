
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2, UserPlus, Chrome, HelpCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

interface AuthProps {
  onAuthSuccess: () => void;
}

const RETRY_EXHAUSTED_429_MESSAGE = "Persistent rate limiting detected. Please wait 5-10 minutes before trying again.";

const retryWithDelay = async (
  fn: () => Promise<AuthResponse | any>,
  retries = 3,
  delay = 2000,
): Promise<any> => {
  let result = await fn();

  if (result.error && (result.error as any).status === 429) {
    console.warn(`Auth.tsx: Rate limit hit (429). Retrying...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    for (let i = 1; i <= retries; i++) {
      result = await fn();
      if (!result.error || (result.error as any).status !== 429) return result;
      await new Promise(resolve => setTimeout(resolve, delay * i));
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
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const getFriendlyErrorMessage = (error: any) => {
    if (!error) return null;
    const message = error.message || "";
    if (message.includes("Invalid login credentials")) return "Email বা পাসওয়ার্ড ভুল। আবার চেষ্টা করো।";
    if (message.includes("User already registered")) return "এই Email দিয়ে আগে থেকেই অ্যাকাউন্ট খোলা আছে।";
    if (message.includes("Email not confirmed")) return "দয়া করে তোমার Email ভেরিফাই করো। Inbox বা Spam চেক করো।";
    if (message.includes(RETRY_EXHAUSTED_429_MESSAGE)) return "অতিরিক্ত চেষ্টার জন্য ব্লক করা হয়েছে। ৫ মিনিট পর চেষ্টা করো।";
    return "ত্রুটি: " + message;
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setErrorMsg(getFriendlyErrorMessage(error));
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      setErrorMsg("সঠিক Email অ্যাড্রেস লিখো।");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(getFriendlyErrorMessage(error));
    } else {
      alert("পাসওয়ার্ড রিসেট লিঙ্ক তোমার Email-এ পাঠানো হয়েছে।");
      setMode('signin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg("সঠিক Email অ্যাড্রেস লিখো।");
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await retryWithDelay(() => supabase.auth.signInWithPassword({ email, password }));
        if (error) throw error;
        if (data.user) onAuthSuccess();
      } else if (mode === 'signup') {
        if (password.length < 6) throw new Error("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
        const { data, error } = await retryWithDelay(() => supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name }
          }
        }));
        if (error) throw error;
        if (data.user) {
          alert("অ্যাকাউন্ট তৈরি হয়েছে! দয়া করে Email কনফার্ম করো।");
          setMode('signin');
        }
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-brand-primary/10 border border-brand-text-s/10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-brand-primary italic">HSC TRACKER</h1>
          <p className="text-brand-text-s font-black uppercase tracking-widest text-[10px] mt-2">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create New Account' : 'Reset Password'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-xs font-bold">{errorMsg}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={mode === 'forgot' ? (e) => { e.preventDefault(); handleForgotPassword(); } : handleSubmit}>
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

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">Password</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[9px] font-black uppercase text-brand-primary tracking-tighter hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required={mode !== 'forgot'}
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-brand-text-s/10"></div>
              <span className="text-[8px] font-black uppercase text-brand-text-s tracking-widest">OR</span>
              <div className="flex-1 h-px bg-brand-text-s/10"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white dark:bg-brand-bg hover:scale-[1.02] active:scale-95 text-brand-text-p border border-brand-text-s/20 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
            >
              <Chrome size={18} className="text-brand-primary" />
              <span className="text-sm">Continue with Google</span>
            </button>
          </>
        )}

        <div className="mt-8 text-center flex flex-col gap-3">
          <button 
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(null); }}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s hover:text-brand-primary transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
          {mode === 'forgot' && (
            <button onClick={() => setMode('signin')} className="text-[9px] font-black uppercase text-brand-primary">Back to Sign In</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
