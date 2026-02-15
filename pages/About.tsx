import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, GraduationCap, Sparkles, ArrowRight, Zap, BookOpen, Flame, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';

const About: React.FC = () => {
  useEffect(() => {
    document.title = "Lekhapora - Bangladesh's #1 Study Tracker for HSC";
  }, []);

  return (
    <div className="relative min-h-screen bg-brand-bg selection:bg-brand-primary/30 overflow-x-hidden">
      <BackgroundGrid />
      
      {/* Premium Hero Section */}
      <section className="relative px-6 pt-24 md:pt-36 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Flame size={14} className="animate-pulse" /> The Smart Choice for HSC 2025/26
          </div>
          
          <h1 className="text-5xl md:text-9xl font-black text-brand-text-p tracking-tighter leading-[0.85] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            STRATEGIC STUDYING.<br />
            <span className="text-brand-primary italic underline decoration-brand-primary/20 underline-offset-[12px]">PRECISE RESULTS.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-2xl text-brand-text-s font-medium mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 leading-relaxed">
            Lekhapora is the first intelligence-driven study platform built specifically for the Bangladesh NCTB curriculum. Master every chapter with clinical precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Link to="/register" className="px-12 py-6 bg-brand-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Join 10,000+ Students <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="px-12 py-6 bg-brand-surface text-brand-text-p border border-brand-text-s/10 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-brand-surface/80 hover:scale-105 active:scale-95 transition-all">
              Login to Account
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-brand-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </section>

      {/* Features Bento-style Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
             <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.4em]">The Platform</h2>
             <h3 className="text-4xl md:text-6xl font-black text-brand-text-p tracking-tight leading-none uppercase italic">Everything you need to <span className="text-brand-primary">Win.</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-surface/50 backdrop-blur-xl p-12 rounded-[3.5rem] border border-brand-text-s/10 space-y-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <Zap size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-text-p leading-none mb-4">Deep Focus Tracker</h3>
                <p className="text-brand-text-s font-medium leading-relaxed">Scientific session logging with break management. We track your "Study Momentum" to ensure you're learning at peak cognitive hours.</p>
              </div>
            </div>
            
            <div className="bg-brand-surface/50 backdrop-blur-xl p-12 rounded-[3.5rem] border border-brand-text-s/10 space-y-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                <BookOpen size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-text-p leading-none mb-4">NCTB Smart Syllabus</h3>
                <p className="text-brand-text-s font-medium leading-relaxed">Every chapter of Science, Arts, and Commerce mapped perfectly. Track mastery, difficulty, and completion in one unified dashboard.</p>
              </div>
            </div>
            
            <div className="bg-brand-surface/50 backdrop-blur-xl p-12 rounded-[3.5rem] border border-brand-text-s/10 space-y-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Target size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-text-p leading-none mb-4">Board Analytics</h3>
                <p className="text-brand-text-s font-medium leading-relaxed">Instant feedback on mock exams. See where you stand against the average and close the gaps in your knowledge automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 border-y border-brand-text-s/5 bg-brand-surface/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: "Active Scholars", value: "10.4k+", icon: <Sparkles size={16} /> },
            { label: "Practice Minutes", value: "2.8M+", icon: <TrendingUp size={16} /> },
            { label: "Syllabus Chapters", value: "100%", icon: <CheckCircle2 size={16} /> },
            { label: "Verified Safe", value: "256-bit", icon: <ShieldCheck size={16} /> }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-brand-primary mb-2">
                {stat.icon}
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">{stat.label}</p>
              </div>
              <p className="text-4xl md:text-6xl font-black text-brand-text-p tracking-tighter leading-none">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative">
        <div className="max-w-5xl mx-auto bg-slate-900 p-12 md:p-24 rounded-[4rem] text-center text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
          
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">Ready to secure your <br /> <span className="text-brand-primary">Golden A+?</span></h2>
            <p className="text-white/60 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
              Stop studying hard, start studying smart. Join thousands of HSC candidates who have already unlocked their true potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/register" className="px-14 py-7 bg-brand-primary text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/40">
                Get Started Free
              </Link>
              <Link to="/faq" className="px-14 py-7 bg-white/5 text-white border border-white/10 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                Read the FAQ
              </Link>
            </div>
          </div>

          <GraduationCap size={300} className="absolute -right-20 -bottom-20 opacity-[0.03] text-white rotate-12" />
        </div>
      </section>

      {/* Local Footer */}
      <footer className="py-12 px-6 border-t border-brand-text-s/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-text-s">Lekhapora &copy; 2026. Handcrafted for Bangladesh.</p>
      </footer>
    </div>
  );
};

export default About;