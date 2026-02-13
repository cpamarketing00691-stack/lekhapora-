
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Lock, Mail, ArrowRight, Loader2, 
  Chrome, AlertCircle, Eye, EyeOff, CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BackgroundGrid from '../components/BackgroundGrid';

interface AuthPanelProps {
  mode: 'signin' | 'signup' | 'forgot';
}

const AuthPanel: React.FC<AuthPanelProps> = ({ mode: initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [mode]);

  const validateEmail = (email: string) => {
    return email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const getFriendlyErrorMessage = (error: any) => {
    if (!error) return null;
    const message = error.message || "";
    if (message.includes("Invalid login credentials")) return "ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করো।";
    if (message.includes("User already registered")) return "এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট খোলা আছে।";
    if (message.includes("Email not confirmed")) return "দয়া করে তোমার ইমেইল ভেরিফাই করো। ইনবক্স বা স্প্যাম চেক করো।";
    if (message.includes("rate_limit")) return "অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। একটু পর আবার চেষ্টা করো।";
    return message;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg("সঠিক ইমেইল অ্যাড্রেস লিখো।");
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Navigation handled by App.tsx onAuthStateChange
      } else if (mode === 'signup') {
        if (password.length < 6) throw new Error("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
        if (!name.trim()) throw new Error("দয়া করে তোমার নাম লিখো।");
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setSuccessMsg("অ্যাকাউন্ট তৈরি হয়েছে! দয়া করে তোমার ইমেইল ভেরিফাই করো।");
        setMode('signin');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg("পাসওয়ার্ড রিসেট লিঙ্ক তোমার ইমেইলে পাঠানো হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-md bg-brand-surface rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-brand-text-s/10 relative overflow-hidden">
        
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-secondary/5 blur-3xl -z-10 rounded-full" />

        <header className="text-center mb-10">
          <Link to="/about" className="inline-flex items-center gap-2 mb-4 text-brand-text-s hover:text-brand-primary transition-colors font-black text-[10px] uppercase tracking-widest">
            <ChevronLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-3xl font-black text-brand-primary italic tracking-tight">LEKHAPORA</h1>
          <p className="text-brand-text-s font-bold uppercase tracking-widest text-[10px] mt-2">
            {mode === 'signin' ? 'Sign in to your workspace' : mode === 'signup' ? 'Join the scholar circle' : 'Recover your account'}
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-xs font-bold">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <p className="text-xs font-bold">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
                  placeholder="e.g. Sharif Ahmed"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
                placeholder="you@university.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">Password</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[9px] font-black uppercase text-brand-primary hover:underline">Forgot Password?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-s hover:text-brand-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <div className="mt-8">
            <div className="relative flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-brand-text-s/10" />
              <span className="text-[8px] font-black uppercase text-brand-text-s tracking-widest">Social Gateway</span>
              <div className="flex-1 h-px bg-brand-text-s/10" />
            </div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 bg-white dark:bg-brand-bg text-brand-text-p border border-brand-text-s/20 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-brand-bg/50 active:scale-95 shadow-sm disabled:opacity-50"
            >
              <Chrome size={20} className="text-brand-primary" />
              <span className="text-sm">Continue with Google</span>
            </button>
          </div>
        )}

        <footer className="mt-10 text-center">
          {mode === 'signin' ? (
            <p className="text-xs font-bold text-brand-text-s">
              New to Lekhapora? <button onClick={() => setMode('signup')} className="text-brand-primary hover:underline font-black ml-1 uppercase text-[10px]">Create Free Account</button>
            </p>
          ) : (
            <button onClick={() => setMode('signin')} className="text-xs font-bold text-brand-primary hover:underline uppercase text-[10px] tracking-widest font-black">Back to Sign In</button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AuthPanel;
