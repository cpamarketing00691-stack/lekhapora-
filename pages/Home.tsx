
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Target, Shield } from 'lucide-react';

const Home: React.FC = () => {
  React.useEffect(() => {
    document.title = "Lekhapora - Smart HSC Exam Platform";
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <h1 className="text-5xl md:text-8xl font-black text-brand-text-p tracking-tighter leading-none">
            ACE YOUR HSC <br />
            <span className="text-brand-primary">THE SMART WAY.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-text-s font-medium leading-relaxed">
            Lekhapora is Bangladesh's most advanced study tracker and mock exam platform designed strictly for the NCTB curriculum.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/register" 
              className="px-10 py-5 bg-brand-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/30 hover:scale-105 transition-all flex items-center gap-3"
            >
              Start Studying Free <ArrowRight size={20} />
            </Link>
            <Link 
              to="/about" 
              className="px-10 py-5 bg-white text-brand-text-p border border-brand-text-s/20 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-brand-bg transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-brand-surface/30 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <Clock size={28} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p">Focus Tracker</h3>
              <p className="text-brand-text-s font-medium">Built-in deep study timer with break management to optimize your cognitive performance.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <BookOpen size={28} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p">NCTB Syllabus</h3>
              <p className="text-brand-text-s font-medium">Every chapter from every subject for Science, Commerce, and Arts, tracked in one place.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-black text-brand-text-p">Mock Exams</h3>
              <p className="text-brand-text-s font-medium">Chapter-wise MCQ tests and full model exams designed by board toppers and educators.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
