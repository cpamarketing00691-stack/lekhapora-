
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Target, CheckCircle, Flame, Shield, Zap } from 'lucide-react';

const Home: React.FC = () => {
  useEffect(() => {
    document.title = "Lekhapora - Bangladesh's Smart HSC Preparation Platform";
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="px-6 pt-24 pb-32 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-top-2 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
          </span>
          Trusted by 10,000+ HSC Students
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-brand-text-p tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          ACE YOUR HSC <br />
          <span className="text-brand-primary italic">ON AUTOPILOT.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-text-s font-medium leading-relaxed mb-12 animate-in fade-in duration-1000">
          The ultimate SaaS for Bangladeshi students. Track your NCTB syllabus progress, practice with thousand of board-accurate MCQs, and manage your focus sessions with AI-powered analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-3">
            Start Free Now <ArrowRight size={20} />
          </Link>
          <Link to="/about" className="w-full sm:w-auto px-10 py-5 bg-white text-brand-text-p border border-brand-text-s/20 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-bg transition-all">
            See the Platform
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-brand-surface/30 py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-12 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-6 hover:shadow-xl transition-all duration-500">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
              <Zap size={32} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">Precision Tracker</h3>
            <p className="text-brand-text-s font-medium leading-relaxed">Log every focus session and break. Our system calculates your cognitive load to recommend the perfect time to study.</p>
          </div>
          <div className="bg-white p-12 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-6 hover:shadow-xl transition-all duration-500">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <BookOpen size={32} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">Dynamic Syllabus</h3>
            <p className="text-brand-text-s font-medium leading-relaxed">Stay on top of your subjects with our interactive chapter manager. Mark completion and track mastery for every topic.</p>
          </div>
          <div className="bg-white p-12 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-6 hover:shadow-xl transition-all duration-500">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <Target size={32} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">Mock Assessment</h3>
            <p className="text-brand-text-s font-medium leading-relaxed">Test your knowledge with chapter-wise and full model tests. Get instant feedback and explanations to improve rapidly.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-brand-text-p mb-16 italic tracking-tight">The new gold standard for <span className="text-brand-primary underline decoration-brand-primary/20 underline-offset-8">HSC Success.</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Daily Active", value: "2.4k+" },
            { label: "Questions Solved", value: "1.2M" },
            { label: "Group Rankers", value: "850+" },
            { label: "Coverage", value: "100%" }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-4xl font-black text-brand-primary">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
