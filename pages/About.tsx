import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, GraduationCap, Sparkles, ArrowRight, Zap, BookOpen, Flame, CheckCircle2, TrendingUp, ShieldCheck, Rocket, Brain, Shield } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { motion, useScroll, useSpring } from 'framer-motion';
import Lenis from 'lenis';

const About: React.FC = () => {
  const { state } = useLekhapora();
  const cmsContent = state.cmsPages['about']?.content;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    document.title = "About - Lekhapora";
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const features = [
    {
      icon: <Brain className="text-brand-primary" size={32} />,
      title: "AI-Powered Insights",
      description: "Our proprietary algorithms analyze your study patterns to predict exactly where you need focus.",
      color: "bg-brand-primary/10"
    },
    {
      icon: <Target className="text-emerald-500" size={32} />,
      title: "NCTB Precision",
      description: "Every chapter, every topic, and every MCQ is mapped directly to the latest Bangladesh curriculum.",
      color: "bg-emerald-500/10"
    },
    {
      icon: <Shield className="text-orange-500" size={32} />,
      title: "Strict Progress",
      description: "No more guessing. Our tracker ensures you cover 100% of the syllabus before your exams.",
      color: "bg-orange-500/10"
    }
  ];

  return (
    <div className="relative min-h-screen bg-brand-bg selection:bg-brand-primary/30 overflow-x-hidden scroll-smooth">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-primary z-50 origin-left"
        style={{ scaleX }}
      />
      <BackgroundGrid />
      
      <section className="relative px-6 pt-24 md:pt-36 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10"
          >
            <Flame size={14} className="animate-pulse" /> The Smart Choice for HSC 2025/26
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-9xl font-black text-brand-text-p tracking-tighter leading-[0.85] mb-10"
          >
            {cmsContent?.hero_title || "STRATEGIC STUDYING."}<br />
            <span className="text-brand-primary italic underline decoration-brand-primary/20 underline-offset-[12px]">PRECISE RESULTS.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl text-lg md:text-2xl text-brand-text-s font-medium mb-12 leading-relaxed"
          >
            {cmsContent?.hero_subtitle || "Lekhapora is the first intelligence-driven study platform built specifically for the Bangladesh NCTB curriculum."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <Link to="/register" className="px-12 py-6 bg-brand-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Join 10,000+ Students <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-24 bg-white/50 backdrop-blur-sm border-y border-brand-text-s/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="p-10 rounded-[3rem] bg-brand-surface border border-brand-text-s/5 hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-brand-text-s font-medium leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative px-6 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 italic uppercase">
              Our Mission: <span className="text-brand-primary">Democratizing</span> Excellence.
            </h2>
            <div className="space-y-6 text-lg text-brand-text-s font-medium leading-relaxed">
              <p>
                We believe that every student in Bangladesh deserves access to world-class study tools, regardless of their location or background.
              </p>
              <p>
                Lekhapora was founded by a team of educators and engineers who saw the gap between traditional coaching and modern technology. We're here to bridge that gap.
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="p-6 rounded-3xl bg-brand-primary/5 border border-brand-primary/10">
                <p className="text-4xl font-black text-brand-primary mb-1">98%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-s">Success Rate</p>
              </div>
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-4xl font-black text-emerald-500 mb-1">24/7</p>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-s">AI Support</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] bg-gradient-to-br from-brand-primary to-brand-secondary overflow-hidden shadow-2xl relative z-10">
              <img 
                src="https://picsum.photos/seed/study/800/800" 
                alt="Students studying" 
                className="w-full h-full object-cover mix-blend-overlay opacity-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Rocket size={120} className="text-white animate-bounce" />
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-secondary/20 rounded-full blur-3xl animate-pulse" />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto p-12 md:p-24 rounded-[4rem] bg-slate-900 text-white text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8">
              READY TO <span className="text-brand-primary italic">TRANSFORM</span> YOUR FUTURE?
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Join thousands of HSC candidates who are already using Lekhapora to dominate their exams.
            </p>
            <Link to="/register" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-slate-900 rounded-full font-black text-sm uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
              Get Started Now <Zap size={20} />
            </Link>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <BackgroundGrid />
          </div>
        </motion.div>
      </section>

      <footer className="px-6 py-12 text-center border-t border-brand-text-s/10">
        <p className="text-brand-text-s text-sm font-medium">
          © 2026 Lekhapora. Built with ❤️ for Bangladesh.
        </p>
      </footer>
    </div>
  );
};

export default About;
