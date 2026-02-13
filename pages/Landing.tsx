
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, Shield, BookOpen, GraduationCap, Flame } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';

const Landing: React.FC = () => {
  useEffect(() => {
    document.title = "Lekhapora - Smart HSC Preparation Platform";
  }, []);

  return (
    <div className="relative min-h-screen">
      <BackgroundGrid />
      
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Flame size={14} className="animate-pulse" /> Over 10,000 Students Joined
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-brand-text-p tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Ace Your HSC <br />
            <span className="text-brand-primary">The Smart Way.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-brand-text-s font-medium mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Track your progress, manage your syllabus, and practice with model tests designed strictly following NCTB curriculum. All in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Link to="/register" className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Start Studying Free <ArrowRight size={20} />
            </Link>
            <Link to="/about" className="px-10 py-5 bg-brand-surface text-brand-text-p rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-surface/80 transition-all">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="text-orange-500" />, title: "Focus Tracker", desc: "Built-in study timer with break management to maximize your deep work sessions." },
            { icon: <BookOpen className="text-brand-primary" />, title: "NCTB Syllabus", desc: "Full chapter-wise breakdown of all groups: Science, Commerce, and Arts." },
            { icon: <Target className="text-emerald-500" />, title: "Daily Goals", desc: "Stay disciplined with task lists that keep you focused on your daily milestones." }
          ].map((f, i) => (
            <div key={i} className="p-10 bg-brand-surface rounded-[2.5rem] border border-brand-text-s/10 shadow-sm hover:border-brand-primary/30 transition-all">
              <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center mb-6 shadow-inner">{f.icon}</div>
              <h3 className="text-xl font-black text-brand-text-p mb-4">{f.title}</h3>
              <p className="text-brand-text-s font-medium text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-brand-primary p-12 md:p-20 rounded-[4rem] text-center text-white relative overflow-hidden">
          <GraduationCap size={200} className="absolute -right-10 -bottom-10 opacity-10" />
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to secure <br /> your A+?</h2>
          <p className="text-white/80 text-lg font-medium mb-12 max-w-xl mx-auto">Join thousands of students who are already using Lekhapora to stay ahead in their HSC preparation journey.</p>
          <Link to="/register" className="inline-flex px-12 py-6 bg-white text-brand-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
