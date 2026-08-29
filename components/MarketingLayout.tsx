import React, { useState, memo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, User, GraduationCap, ShieldCheck, HelpCircle, Mail, BookOpen, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-[#171717] flex flex-col relative overflow-x-hidden font-sans text-white selection:bg-purple-500/30">
      
      {/* Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Global Public Navbar - Tech / Cyber Vibe */}
      <nav className="sticky top-0 z-[100] w-full bg-[#171717]/80 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/about" className="text-2xl font-black text-white tracking-tight hover:scale-105 transition-transform flex items-center gap-2">
            <Shield className="text-purple-500" fill="currentColor" size={24} />
            LEKHAPORA<span className="text-purple-500">.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                  location.pathname === link.path || (link.path === '/blog' && location.pathname.startsWith('/blog')) ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
            >
              <User size={16}/> {isAuthenticated ? "Dashboard" : "Get Started"}
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-400 hover:text-white transition-all" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Responsive Mobile Overlay */}
        {isOpen && (
          <div className="md:hidden bg-[#171717] border-b border-white/10 p-6 space-y-4 absolute w-full top-20 shadow-2xl">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 text-lg font-medium text-gray-300 border-b border-white/5 pb-3"
              >
                {link.icon} {link.name}
              </Link>
            ))}
            <Link 
              to={isAuthenticated ? "/app/dashboard" : "/login"} 
              onClick={() => setIsOpen(false)} 
              className="block w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-center rounded-xl font-bold text-sm shadow-md"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        )}
      </nav>

      {/* Viewport Render Area */}
      <main className="flex-grow relative z-10 w-full overflow-visible">
        <Outlet />
      </main>

      {/* Global Public Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/10 pt-16 pb-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1 space-y-6">
            <Link to="/about" className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="text-purple-500" fill="currentColor" size={24} />
              LEKHAPORA
            </Link>
            <p className="text-gray-400 font-medium text-sm leading-relaxed">
              Reclaim your focus. Transform your HSC preparation with AI-driven insights and distraction-free study modes.
            </p>
          </div>
          
          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-6">Explore</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              <li><Link to="/about" className="hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link to="/blog" className="hover:text-purple-400 transition-colors">Blog & Articles</Link></li>
              <li><Link to="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-6">Legal</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              <li><Link to="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1 space-y-6">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-6">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">Join our newsletter for study hacks.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-500" />
              <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-purple-500 hover:text-white transition-colors">Join</button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm font-medium text-gray-500">© 2026 Lekhapora. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
             <span>NCTB Compatible</span>
             <span>AES-256 Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
});