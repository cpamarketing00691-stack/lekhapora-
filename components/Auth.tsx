
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpUser = async () => {
    // 1. Supabase auth sign-up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error("Sign-up failed: User not created.");

    // 2. Save additional profile info in 'users' table
    const { error: insertError } = await supabase.from('users').insert([{
      id: data.user.id,
      full_name: fullName,
      email: email,
      created_at: new Date()
    }]);

    if (insertError) {
      console.error('Profile insertion error:', insertError.message);
      // We don't necessarily throw here if auth succeeded, but it's better to ensure profile is created
      throw new Error("Profile creation failed: " + insertError.message);
    }

    return data.user;
  };

  const signInUser = async () => {
    // 1. Supabase auth sign-in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) throw signInError;
    if (!data.user) throw new Error("Sign-in failed: User not found.");

    // 2. Fetch user profile info from 'users' table
    const { data: profile, error: profileError } = await supabase.from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
    }

    return { user: data.user, profile };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInUser();
      } else {
        await signUpUser();
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error('Auth Error:', err.message);
      
      // Specific Error Handling
      if (err.message.includes("Invalid login credentials")) {
        setError("ভুল ইমেইল বা পাসওয়ার্ড। দয়া করে আবার চেষ্টা করো। (Invalid email or password)");
      } else if (err.message.includes("email rate limit exceeded") || err.status === 429) {
        setError("অনেক বেশি চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করো। (Too many attempts, please wait)");
      } else if (err.message.includes("User already registered")) {
        setError("এই ইমেইল দিয়ে ইতিপূর্বেই অ্যাকাউন্ট খোলা হয়েছে। (Email already registered)");
      } else {
        setError(err.message || "সমস্যা হয়েছে। আবার চেষ্টা করো।");
      }
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[11px] font-bold animate-in shake duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Arif Ahmed" 
                    required={!isLogin}
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
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-brand-primary hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Sign Up')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
