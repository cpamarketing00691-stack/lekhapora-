import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Zap, Brain, Rocket, Lock, ArrowRight, Activity, Crosshair } from 'lucide-react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const { state } = useLekhapora();
  const cmsContent = state.cmsPages['about']?.content;

  useEffect(() => {
    document.title = "Lekhapora | Reclaim Your Focus & Crush HSC";
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: <Brain className="text-purple-500" size={32} />,
      title: "AI-Powered Insights",
      description: "Our proprietary algorithms analyze your study patterns to predict exactly where you need focus.",
      glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
    },
    {
      icon: <Crosshair className="text-cyan-500" size={32} />,
      title: "Prime Focus Mode",
      description: "Lock out distractions with our rigorous timer. Build deep work habits required for HSC success.",
      glow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
    },
    {
      icon: <Activity className="text-emerald-500" size={32} />,
      title: "Progress Analytics",
      description: "Track your performance against the NCTB curriculum in real-time. Know your weak points instantly.",
      glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
    }
  ];

  return (
    <div className="w-full bg-[#171717] min-h-screen text-white font-sans selection:bg-purple-500/30">
      
      {/* Hero Section */}
      <section className="relative px-6 pt-32 md:pt-48 pb-32 overflow-hidden flex flex-col items-center text-center">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/30 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-purple-400 font-bold text-xs uppercase tracking-widest mb-8 backdrop-blur-md"
          >
            <Shield size={14} className="text-cyan-400" /> AI-Powered HSC Tracker
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8"
          >
            Reclaim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">Focus.</span><br/>
            Dominate HSC.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 font-medium mb-12 leading-relaxed"
          >
            {cmsContent?.hero_subtitle || "Lekhapora is the first intelligence-driven study platform built specifically to eliminate distractions and accelerate your NCTB curriculum preparation."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-purple-500 hover:text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all text-center">
              View Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative px-6 py-24 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Engineered for <span className="text-purple-500">Deep Work</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Stop doomscrolling and start studying. Our tools are designed to build unbreakable focus.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-8 rounded-3xl bg-[#171717] border border-white/5 transition-all duration-300 group ${feature.glow}`}
              >
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#171717] to-[#0a0a0a] z-0" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-white/5 border border-white/10 text-center relative z-10 backdrop-blur-xl"
        >
          <Lock className="w-16 h-16 text-purple-500 mx-auto mb-6" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Future.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of HSC candidates breaking free from digital distractions. Reclaim hours of lost time every day.
          </p>
          <Link to="/register" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-105 transition-all">
            Get Lekhapora Now <Zap size={18} />
          </Link>
        </motion.div>
      </section>
      
    </div>
  );
};

export default About;
