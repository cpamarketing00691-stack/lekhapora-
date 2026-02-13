
import React, { useEffect } from 'react';
import { Target, Heart, Shield, GraduationCap, Users, Sparkles } from 'lucide-react';

const About: React.FC = () => {
  useEffect(() => {
    document.title = "About Us - Lekhapora";
  }, []);

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto space-y-32">
      <section className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-p tracking-tighter leading-none">
          EMPOWERING STUDENTS THROUGH <span className="text-brand-primary italic">DIGITAL LEARNING.</span>
        </h1>
        <p className="text-xl text-brand-text-s font-medium leading-relaxed">
          Lekhapora is a modern platform built for the next generation of Bangladeshi scholars. We combine academic precision with world-class technology.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-brand-surface p-14 rounded-[4rem] border border-brand-text-s/10 space-y-6">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
            <Target size={30} />
          </div>
          <h2 className="text-3xl font-black text-brand-text-p">Our Mission</h2>
          <p className="text-brand-text-s font-medium leading-loose text-lg">To provide every HSC student in Bangladesh with institutional-grade study tools, regardless of their location. We aim to bridge the gap between rural classrooms and premium coaching.</p>
        </div>
        <div className="bg-brand-primary p-14 rounded-[4rem] text-white space-y-6 shadow-2xl shadow-brand-primary/20 flex flex-col justify-end">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md mb-4">
            <Heart size={30} />
          </div>
          <h2 className="text-3xl font-black">Our Value</h2>
          <p className="text-white/80 font-medium leading-loose text-lg">We believe preparation should be structured, measurable, and accessible. Our closed-loop system ensures you never leave a chapter unmastered.</p>
        </div>
      </div>

      <section className="bg-brand-surface/40 p-16 rounded-[4rem] border border-brand-text-s/10 text-center space-y-10 relative overflow-hidden">
        <Sparkles className="absolute top-10 left-10 text-brand-primary/10" size={100} />
        <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-brand-primary shadow-xl">
          <GraduationCap className="text-brand-primary" size={48} />
        </div>
        <h2 className="text-4xl font-black italic text-brand-text-p leading-tight max-w-3xl mx-auto">"Education is the most powerful weapon which you can use to change the world."</h2>
        <p className="text-brand-text-s font-black uppercase tracking-[0.3em] text-xs">— The Lekhapora Collective</p>
      </section>
    </div>
  );
};

export default About;
