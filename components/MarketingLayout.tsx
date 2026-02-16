import React, { useState, memo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, User, GraduationCap, ShieldCheck, HelpCircle, Mail } from 'lucide-react';
import BackgroundGrid from './BackgroundGrid';

interface Props {
  isAuthenticated: boolean;
}

export const MarketingLayout: React.FC<Props> = memo(({ isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'About', path: '/about', icon: <GraduationCap size={14}/> },
    { name: 'FAQ', path: '/faq', icon: <HelpCircle size={14}/> },
    { name: 'Contact', path: '/contact', icon: <Mail size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col relative overflow-x-hidden selection:bg-brand-primary/20">
      <BackgroundGrid />
      
      {/* Global Public Navbar */}
      <nav className="sticky top-0 z-[100] w-full bg-brand-bg/80 backdrop-blur-md border-b border-brand-text-s/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/about" className="text-2xl font-black text-brand-primary italic tracking-tight hover:scale-105 transition-transform flex items-center gap-2">
            LEKHAPORA
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  location.pathname === link.path ? 'text-brand-primary' : 'text-brand-text-s hover:text-brand-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <User size={14}/> Login
            </Link>
          </div>

          <button className="md:hidden p-2 text-brand-text-p hover:bg-brand-surface rounded-xl transition-all" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Responsive Mobile Overlay */}
        {isOpen && (
          <div className="md:hidden bg-brand-surface/95 backdrop-blur-xl border-b border-brand-text-s/10 p-8 space-y-6 animate-in slide-in-from-top-4 duration-500 absolute w-full top-20 shadow-2xl">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-4 text-xl font-black text-brand-text-p uppercase tracking-tighter italic border-b border-brand-text-s/5 pb-4"
              >
                {link.icon} {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              onClick={() => setIsOpen(false)} 
              className="block w-full py-5 bg-brand-primary text-white text-center rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/30"
            >
              Login
            </Link>
          </div>
        )}
      </nav>

      {/* Viewport Render Area */}
      <main className="flex-grow relative z-10 max-w-7xl mx-auto w-full px-6 overflow-visible pt-10">
        <Outlet />
      </main>

      {/* Global Public Footer */}
      <footer className="bg-brand-surface border-t border-brand-text-s/10 pt-24 pb-12 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-6 space-y-8">
            <h2 className="text-3xl font-black text-brand-primary italic tracking-tight">LEKHAPORA</h2>
            <p className="text-brand-text-s font-medium max-w-md text-sm leading-relaxed">
              Bangladesh's elite performance-tracking system for HSC candidates. Engineered to transform the NCTB curriculum into data-driven success.
            </p>
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-text-s/10 flex items-center justify-center text-brand-text-s hover:text-brand-primary transition-colors cursor-pointer"><GraduationCap size={18}/></div>
               <div className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-text-s/10 flex items-center justify-center text-brand-text-s hover:text-brand-primary transition-colors cursor-pointer"><ShieldCheck size={18}/></div>
            </div>
          </div>
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-black text-brand-text-p uppercase tracking-[0.3em] text-[10px] mb-8">Navigation</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-brand-text-s">
              <li><Link to="/about" className="hover:text-brand-primary transition-colors">About</Link></li>
              <li><Link to="/faq" className="hover:text-brand-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-brand-primary transition-colors">Login</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-black text-brand-text-p uppercase tracking-[0.3em] text-[10px] mb-8">Trust & Legal</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-brand-text-s">
              <li><Link to="/privacy-policy" className="hover:text-brand-primary transition-colors">Privacy Charter</Link></li>
              <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Service Terms</Link></li>
              <li><p className="opacity-50 select-none">HSC Protocol v2.4</p></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-brand-text-s/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s opacity-60">© 2026 LEKHAPORA SAAS • HANDCRAFTED FOR EXCELLENCE</p>
          <div className="flex gap-8 text-[9px] font-black text-brand-text-s/40 uppercase tracking-tighter">
             <span>NCTB Compatible</span>
             <span>AES-256 Secured</span>
             <span>PWA Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
});