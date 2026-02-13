
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Target, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  useEffect(() => {
    document.title = "Lekhapora - Smart HSC Preparation Platform";
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="px-6 pt-24 pb-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-widest mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
          </span>
          Trusted by 50,000+ HSC Students
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-brand-text-p tracking-tighter leading-none mb-8">
          MASTER YOUR HSC <br />
          <span className="text-brand-primary italic">DIGITALLY.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-text-s font-medium leading-relaxed mb-12">
          Lekhapora is Bangladesh's premier SaaS for HSC preparation. Track your syllabus, practice chapter-wise MCQs, and monitor your progress with AI insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-3">
            Get Started Free <ArrowRight size={20} />
          </Link>
          <Link to="/about" className="w-full sm:w-auto px-10 py-5 bg-white text-brand-text-p border border-brand-text-s/20 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-bg transition-all">
            See How it Works
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-brand-surface/30 py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <Clock size={28} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">Study Tracker</h3>
            <p className="text-brand-text-s font-medium">Log focus sessions and breaks using our precision timer designed for HSC students.</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <BookOpen size={28} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">NCTB Syllabus</h3>
            <p className="text-brand-text-s font-medium">Full chapter breakdown of all Science, Commerce, and Arts subjects at your fingertips.</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <Target size={28} />
            </div>
            <h3 className="text-2xl font-black text-brand-text-p">Mock Exams</h3>
            <p className="text-brand-text-s font-medium">Attempt thousands of board-standard MCQs and get instant results with explanations.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-brand-text-p mb-16">The gold standard for <span className="text-brand-primary italic">HSC success.</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Users", value: "50k+" },
            { label: "Questions", value: "100k+" },
            { label: "Success Rate", value: "94%" },
            { label: "Board Coverage", value: "100%" }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-3xl font-black text-brand-primary">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
