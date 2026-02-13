
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, Shield, GraduationCap, Users, Sparkles, ArrowRight, Zap, BookOpen, Flame, CheckCircle2 } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';

const About: React.FC = () => {
  useEffect(() => {
    document.title = "Lekhapora - Bangladesh's #1 Study Tracker for HSC";
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Grid background is handled by the component */}
      
      {/* Hero Section */}
      <section className="relative px-6 pt-20 md:pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <Flame size={14} className="animate-pulse" /> The Smart Choice for HSC 2025/26
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-brand-text-p tracking-tighter leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            STRATEGIC STUDYING. <br />
            <span className="text-brand-primary italic underline decoration-brand-primary/20">PRECISE RESULTS.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-brand-text-s font-medium mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 leading-relaxed">
            Lekhapora is the first intelligence-driven study platform built specifically for the Bangladesh NCTB curriculum. Master every chapter with clinical precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Link to="/register" className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Join 10,000+ Students <ArrowRight size={20} />
            </Link>
            <Link to="/loging" className="px-10 py-5 bg-white text-brand-text-p border border-brand-text-s/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-bg transition-all">
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 bg-brand-surface/40 border-y border-brand-text-s/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-brand-text-s/10 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p leading-none">Deep Focus Tracker</h3>
              <p className="text-brand-text-s font-medium leading-relaxed">Scientific session logging with break management. We track your "Study Momentum" to ensure you're learning at peak cognitive hours.</p>
            </div>
            
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-brand-text-s/10 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p leading-none">Smart NCTB Syllabus</h3>
              <p className="text-brand-text-s font-medium leading-relaxed">Every chapter of Science, Arts, and Commerce mapped perfectly. Track mastery, difficulty, and completion in one unified dashboard.</p>
            </div>
            
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-brand-text-s/10 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p leading-none">Board Analytics</h3>
              <p className="text-brand-text-s font-medium leading-relaxed">Instant feedback on mock exams. See where you stand against the average and close the gaps in your knowledge automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-brand-text-p tracking-tight leading-none uppercase italic">Our Mission</h2>
            <p className="text-xl text-brand-text-s leading-relaxed font-medium">
              We started Lekhapora with a simple goal: To democratize high-end HSC preparation. No matter where you live in Bangladesh, you deserve a system that keeps you accountable, organized, and focused on your A+.
            </p>
            <div className="space-y-4 pt-6">
              {[
                "100% Free Core Features",
                "Built by Top University Students",
                "Mobile-First Experience (PWA)",
                "Secure & Private Data Encryption"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 font-black text-brand-text-p text-sm uppercase tracking-widest">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  {text}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-brand-primary p-14 rounded-[4rem] text-white space-y-8 shadow-2xl shadow-brand-primary/20 relative overflow-hidden">
             <Sparkles className="absolute -right-10 -top-10 opacity-20" size={200} />
             <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
               <Heart size={40} />
             </div>
             <h3 className="text-3xl font-black">Built with care for Bangladeshi scholars.</h3>
             <p className="text-white/80 font-medium leading-relaxed text-lg">
               We believe preparation should be structured, measurable, and accessible. Our closed-loop system ensures you never leave a chapter unmastered.
             </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 p-12 md:p-20 rounded-[4rem] text-center text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Ready to secure your <span className="text-brand-primary">Golden A+?</span></h2>
          <p className="text-white/60 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Stop studying hard, start studying smart. Join thousands of HSC candidates who have already unlocked their true potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-12 py-6 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/40">
              Get Started Free
            </Link>
            <Link to="/faq" className="px-12 py-6 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
