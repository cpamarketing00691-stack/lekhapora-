
import React, { useEffect } from 'react';
import { Target, Heart, Shield, GraduationCap } from 'lucide-react';

const About: React.FC = () => {
  useEffect(() => {
    document.title = "About Us - Lekhapora";
  }, []);

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto space-y-32">
      <section className="text-center max-w-4xl mx-auto space-y-8">
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-p tracking-tighter">Empowering Students Through <span className="text-brand-primary italic">Smart Digital Learning.</span></h1>
        <p className="text-xl text-brand-text-s font-medium leading-relaxed">Lekhapora is more than just an exam platform; it's a comprehensive digital companion for the next generation of Bangladeshi scholars.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-brand-surface p-12 rounded-[3rem] border border-brand-text-s/10 space-y-6">
          <Target className="text-brand-primary" size={40} />
          <h2 className="text-3xl font-black">Our Mission</h2>
          <p className="text-brand-text-s font-medium leading-loose">To democratize quality education in Bangladesh by providing every HSC student with enterprise-grade preparation tools, regardless of their location or economic background.</p>
        </div>
        <div className="bg-brand-primary p-12 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-brand-primary/20">
          <Heart className="text-white" size={40} />
          <h2 className="text-3xl font-black">What We Offer</h2>
          <p className="text-white/80 font-medium leading-loose">From real-time study tracking to board-accurate model tests, we provide a closed-loop preparation system that ensures no chapter is left unmastered.</p>
        </div>
      </div>

      <section className="bg-white p-12 rounded-[3rem] border border-brand-text-s/10 text-center space-y-8">
        <div className="w-24 h-24 bg-brand-bg rounded-full mx-auto flex items-center justify-center border border-brand-text-s/10 shadow-inner">
          <GraduationCap className="text-brand-primary" size={40} />
        </div>
        <h2 className="text-3xl font-black italic">"Education is the most powerful weapon which you can use to change the world."</h2>
        <p className="text-brand-text-s font-black uppercase tracking-widest">— Lekhapora Team</p>
      </section>
    </div>
  );
};

export default About;
