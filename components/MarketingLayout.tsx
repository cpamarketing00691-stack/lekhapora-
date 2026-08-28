import React, { useState, memo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, User, GraduationCap, ShieldCheck, HelpCircle, Mail, BookOpen } from 'lucide-react';
import BackgroundGrid from './BackgroundGrid';

interface Props {
  isAuthenticated: boolean;
}

export const MarketingLayout: React.FC<Props> = memo(({ isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/about', icon: <GraduationCap size={16}/> },
    { name: 'Blog', path: '/blog', icon: <BookOpen size={16}/> },
    { name: 'FAQ', path: '/faq', icon: <HelpCircle size={16}/> },
    { name: 'Contact', path: '/contact', icon: <Mail size={16}/> },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col relative overflow-x-hidden font-sans text-gray-900 selection:bg-brand-primary/20">
      {/* Global Public Navbar - Classic WP Style */}
      <nav className="sticky top-0 z-[100] w-full bg-white shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/about" className="text-2xl font-black text-gray-900 tracking-tight hover:text-brand-primary transition-colors flex items-center gap-2 font-serif">
            Lekhapora<span className="text-brand-primary">.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                  location.pathname === link.path || (link.path === '/blog' && location.pathname.startsWith('/blog')) ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/20 transition-all flex items-center gap-2"
            >
              <User size={16}/> {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Responsive Mobile Overlay */}
        {isOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 p-6 space-y-4 animate-in slide-in-from-top-2 duration-300 absolute w-full top-20 shadow-xl">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 text-lg font-medium text-gray-800 border-b border-gray-50 pb-3"
              >
                {link.icon} {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              onClick={() => setIsOpen(false)} 
              className="block w-full py-4 mt-4 bg-brand-primary text-white text-center rounded-xl font-bold text-sm shadow-md"
            >
              {isAuthenticated ? "Go to Dashboard" : "Sign In"}
            </Link>
          </div>
        )}
      </nav>

      {/* Viewport Render Area */}
      <main className="flex-grow relative z-10 w-full overflow-visible">
        <Outlet />
      </main>

      {/* Global Public Footer - Classic Blog Style */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1 space-y-6">
            <Link to="/about" className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 font-serif">
              Lekhapora<span className="text-brand-primary">.</span>
            </Link>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Bangladesh's elite performance-tracking system for HSC candidates. Engineered to transform the NCTB curriculum into data-driven success.
            </p>
          </div>
          
          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-6">Explore</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-500">
              <li><Link to="/about" className="hover:text-brand-primary transition-colors">Home</Link></li>
              <li><Link to="/blog" className="hover:text-brand-primary transition-colors">Blog & Articles</Link></li>
              <li><Link to="/faq" className="hover:text-brand-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-6">Legal</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-500">
              <li><Link to="/privacy-policy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-6">Stay Updated</h4>
            <p className="text-gray-500 text-sm mb-4">Get the latest HSC tips delivered to your inbox.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary" />
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-brand-primary transition-colors">Subscribe</button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm font-medium text-gray-400">© 2026 Lekhapora. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-400">
             <span>NCTB Compatible</span>
             <span>AES-256 Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
});