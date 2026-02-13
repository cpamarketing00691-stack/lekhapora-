
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, GraduationCap, Sparkles, ArrowRight, 
  Zap, BookOpen, Flame, CheckCircle2, TrendingUp, 
  ShieldCheck, Info, Github, Globe, Mail
} from 'lucide-react';

interface AboutPanelProps {
  userState?: any;
  isAppPanel?: boolean;
}

const AboutPanel: React.FC<AboutPanelProps> = ({ userState, isAppPanel = false }) => {
  // Fix: use userState.language instead of literal string comparison
  const t = (bn: string, en: string) => userState?.language === 'bn' ? bn : en;

  const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-brand-surface/50 p-8 sm:p-10 rounded-[2.5rem] border border-brand-text-s/10 space-y-6 hover:shadow-xl transition-all duration-500 group">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <h3 className="text-xl font-black text-brand-text-p leading-none mb-3">{title}</h3>
        <p className="text-brand-text-s font-medium leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-16 animate-in fade-in duration-1000 ${!isAppPanel && 'pt-12'}`}>
      
      {/* Hero / Header */}
      <section className="text-center space-y-6 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-4">
          <Info size={14} /> Modular Core v2.4.1
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-p tracking-tighter leading-[0.9] italic">
          THE FUTURE OF <br />
          <span className="text-brand-primary">HSC TRACKING.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-brand-text-s font-medium text-lg md:text-xl leading-relaxed">
          Lekhapora is an elite performance-tracking system engineered specifically for the NCTB curriculum. We turn complex syllabuses into executable study chains.
        </p>
        
        {!isAppPanel && (
          <div className="flex justify-center pt-6">
            <Link to="/register" className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              Join 10k+ Scholars <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Zap} color="bg-orange-500/10 text-orange-600" 
          title="Cognitive Logging" 
          desc="Precision time-tracking with 'Focus Recovery' logic to prevent burnout and maximize long-term retention."
        />
        <FeatureCard 
          icon={BookOpen} color="bg-brand-primary/10 text-brand-primary" 
          title="Smart Syllabus" 
          desc="Full digital twin of the NCTB curriculum. Track mastery levels for every chapter across Science, Arts, and Commerce."
        />
        <FeatureCard 
          icon={Target} color="bg-emerald-500/10 text-emerald-600" 
          title="Mock Assessment" 
          desc="High-fidelity model tests designed following the latest board formats with instant AI analytics."
        />
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-brand-surface/20 py-20 px-8 rounded-[4rem] border border-brand-text-s/5 grid grid-cols-2 md:grid-cols-4 gap-12">
        {[
          { label: "Active Users", val: "10.4k+", icon: <Sparkles size={16}/> },
          { label: "Practice Mins", val: "3.2M", icon: <TrendingUp size={16}/> },
          { label: "Chapters Tracked", val: "100%", icon: <CheckCircle2 size={16}/> },
          { label: "Data Security", val: "AES-256", icon: <ShieldCheck size={16}/> }
        ].map((s, i) => (
          <div key={i} className="text-center space-y-1">
             <div className="flex items-center justify-center gap-2 text-brand-primary mb-2 opacity-60">
               {s.icon}
               <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
             </div>
             <p className="text-4xl font-black text-brand-text-p">{s.val}</p>
          </div>
        ))}
      </section>

      {/* Developer / Credits */}
      <section className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-xs font-black text-brand-primary uppercase tracking-[0.4em] mb-4">Behind the Architecture</h2>
          <h3 className="text-3xl font-black text-brand-text-p italic uppercase tracking-tight">Mission & Developer</h3>
        </div>
        
        <div className="bg-brand-surface p-10 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm flex flex-col md:flex-row gap-12 items-center">
          <div className="w-40 h-40 bg-brand-bg rounded-[3rem] shrink-0 flex items-center justify-center border-4 border-brand-primary/10 shadow-inner group overflow-hidden relative">
             <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-10 transition-opacity" />
             <GraduationCap size={64} className="text-brand-primary" />
          </div>
          <div className="space-y-6 flex-1 text-center md:text-left">
            <p className="text-brand-text-s font-medium leading-relaxed italic">
              "Lekhapora was built on the philosophy that structure breeds excellence. Our mission is to democratize elite study habits for every Bangladeshi student through superior digital tools."
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <button className="flex items-center gap-3 px-5 py-2.5 bg-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-text-s/10 hover:border-brand-primary transition-all">
                 <Github size={14}/> Github
               </button>
               <button className="flex items-center gap-3 px-5 py-2.5 bg-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-text-s/10 hover:border-brand-primary transition-all">
                 <Globe size={14}/> Portfolio
               </button>
               <button className="flex items-center gap-3 px-5 py-2.5 bg-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-text-s/10 hover:border-brand-primary transition-all">
                 <Mail size={14}/> Contact
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Meta */}
      <footer className="pt-20 border-t border-brand-text-s/5 text-center">
         <p className="text-[9px] font-black text-brand-text-s uppercase tracking-[0.3em] opacity-40">
           Handcrafted in Bangladesh • © 2026 Lekhapora SaaS • Version 2.4.1
         </p>
      </footer>
    </div>
  );
};

export default AboutPanel;
