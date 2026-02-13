
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Auth from '../components/Auth';
import BackgroundGrid from '../components/BackgroundGrid';

interface LoginPageProps {
  mode: 'signin' | 'signup';
}

const LoginPage: React.FC<LoginPageProps> = ({ mode }) => {
  useEffect(() => {
    document.title = mode === 'signin' ? "Login - Lekhapora" : "Register - Lekhapora";
  }, [mode]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-brand-bg">
      <BackgroundGrid />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-black text-brand-primary italic tracking-tight">LEKHAPORA</Link>
          <p className="text-brand-text-s font-black uppercase tracking-[0.2em] text-[10px] mt-2">HSC Exam Preparation Hub</p>
        </div>
        
        {/* Pass dummy function to Auth as the parent App.tsx handles onAuthStateChange */}
        <Auth onAuthSuccess={() => {}} />
        
        <div className="text-center mt-8">
           <Link to="/" className="text-xs font-black uppercase tracking-widest text-brand-text-s hover:text-brand-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
