import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, GraduationCap, Sparkles, ArrowRight, Zap, BookOpen, Flame, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';
import { useLekhapora } from '../contexts/LekhaporaContext';

const About: React.FC = () => {
  const { state } = useLekhapora();
  const cmsContent = state.cmsPages['about']?.content;

  useEffect(() => {
    document.title = "About - Lekhapora";
  }, []);

  return (
    <div className="relative min-h-screen bg-brand-bg selection:bg-brand-primary/30 overflow-x-hidden">
      <BackgroundGrid />
      
      <section className="relative px-6 pt-24 md:pt-36 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Flame size={14} className="animate-pulse" /> The Smart Choice for HSC 2025/26
          </div>
          
          <h1 className="text-5xl md:text-9xl font-black text-brand-text-p tracking-tighter leading-[0.85] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {cmsContent?.hero_title || "STRATEGIC STUDYING."}<br />
            <span className="text-brand-primary italic underline decoration-brand-primary/20 underline-offset-[12px]">PRECISE RESULTS.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-2xl text-brand-text-s font-medium mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 leading-relaxed">
            {cmsContent?.hero_subtitle || "Lekhapora is the first intelligence-driven study platform built specifically for the Bangladesh NCTB curriculum."}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Link to="/register" className="px-12 py-6 bg-brand-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Join 10,000+ Students <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Sections would follow, potentially mapped from cmsContent.sections */}
    </div>
  );
};

export default About;