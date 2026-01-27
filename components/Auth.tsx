
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
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

  // 2️⃣ Sign-Up Function: Using requested logic
  async function signUpUser(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) { 
      alert("Sign-up failed: " + error.message); 
      return null; 
    }

    if (data.user) {
      // Save additional user info in 'users' table
      const { error: dbError } = await supabase.from('users').insert([{ 
        id: data.user.id, 
        full_name: fullName, 
        email: email, 
        created_at: new Date() 
      }]);
      
      if (dbError) {
        console.error("Profile creation error:", dbError.message);
        // Explicitly alert the user about the profile creation failure and potential causes.
        // The user is authenticated, even if their custom profile data isn't saved yet.
        alert("Sign-up successful, but failed to create user profile. Please ensure the 'users' table exists in Supabase and has correct RLS policies for insertion. Error: " + dbError.message);
        return data.user; // Return user to allow onAuthSuccess to proceed, App.tsx has fallback for missing profile.
      } else {
        alert("Sign-up successful!");
      }
      return data.user;
    }
    return null;
  }

  // 3️⃣ Sign-In Function: Using requested logic
  async function signInUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      alert("Sign-in failed: " + error.message); 
      return null; 
    }

    if (data.user) {
      // Fetch user profile info
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
      alert("Sign-in successful!");
      return { user: data.user, profile };
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInUser(email, password);
        if (result) {
          onAuthSuccess();
        }
      } else {
        const user = await signUpUser(email, password, fullName);
        if (user) {
          // If signUpUser returns a user (even if profile creation had issues), proceed to auth success.
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error('Runtime Auth Error:', err);
      // Catch any unexpected runtime errors during the auth process
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
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Sign Up')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
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