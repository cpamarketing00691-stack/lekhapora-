
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import BackgroundGrid from './BackgroundGrid';

interface MarketingLayoutProps {
  isAuthenticated: boolean;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ isAuthenticated }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col relative overflow-x-hidden">
      <BackgroundGrid />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] w-full bg-brand-bg/80 backdrop-blur-md border-b border-brand-text-s/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-brand-primary italic tracking-tight">
            LEKHAPORA
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-bold transition-colors ${location.pathname === link.path ? 'text-brand-primary' : 'text-brand-text-s hover:text-brand-primary'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/dashboard" : "/login"} 
              className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isAuthenticated ? 'Dashboard' : 'Login'}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-brand-text-p p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-brand-surface border-b border-brand-text-s/10 p-6 space-y-4 animate-in slide-in-from-top-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-lg font-bold text-brand-text-p"
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/dashboard" : "/login"} 
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-4 bg-brand-primary text-white text-center rounded-2xl font-black uppercase tracking-widest"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-surface border-t border-brand-text-s/10 pt-20 pb-10 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h2 className="text-3xl font-black text-brand-primary italic">LEKHAPORA</h2>
            <p className="text-brand-text-s font-medium max-w-sm">
              Empowering students in Bangladesh through smart digital preparation and structured study plans for the HSC exams.
            </p>
          </div>
          <div>
            <h4 className="font-black text-brand-text-p uppercase tracking-widest text-xs mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-bold text-brand-text-s">
              <li><Link to="/about" className="hover:text-brand-primary">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-brand-primary">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-brand-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-brand-text-p uppercase tracking-widest text-xs mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-brand-text-s">
              <li><Link to="/privacy-policy" className="hover:text-brand-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-primary">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-brand-text-s/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">
            © 2026 LEKHAPORA. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
