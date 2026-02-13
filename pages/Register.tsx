
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BackgroundGrid from '../components/BackgroundGrid';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Join Lekhapora - Smart Preparation";
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signUp({ 
        email, password,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      alert("Registration successful! Check your email to confirm your account.");
      navigate('/login');
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative">
      <BackgroundGrid />
      <div className="w-full max-w-md bg-brand-surface p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-brand-text-s/10 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <Link to="/" className="text-3xl font-black text-brand-primary italic tracking-tight">LEKHAPORA</Link>
          <p className="text-brand-text-s font-black uppercase text-[10px] tracking-widest mt-3">Start Your A+ Journey</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 text-rose-600 rounded-2xl text-xs font-bold border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                placeholder="Sharif Ahmed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                placeholder="you@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
              <input 
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-brand-text-s/10 text-center">
          <p className="text-xs font-bold text-brand-text-s">
            Already registered? <Link to="/login" className="text-brand-primary hover:underline font-black ml-1">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
