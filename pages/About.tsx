
import React, { useEffect } from 'react';
import BackgroundGrid from '../components/BackgroundGrid';
import { ShieldCheck, Target, Heart, GraduationCap } from 'lucide-react';

const About: React.FC = () => {
  useEffect(() => {
    document.title = "About Us - Lekhapora";
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundGrid />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-brand-text-p tracking-tight mb-8">
            Our Mission is <span className="text-brand-primary">Student Success.</span>
          </h1>
          <p className="text-xl text-brand-text-s font-medium leading-relaxed">
            Lekhapora was built out of a simple observation: Bangladesh's students have the talent, but often lack the structured digital tools needed to excel in the competitive HSC landscape.
          </p>
        </div>
      </section>

      <section className="px-6 space-y-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="p-12 bg-brand-surface rounded-[3rem] border border-brand-text-s/10">
            <h2 className="text-3xl font-black text-brand-text-p mb-6 flex items-center gap-3">
              <Target className="text-brand-primary" /> What We Offer
            </h2>
            <p className="text-brand-text-s font-medium leading-loose">
              We provide a comprehensive ecosystem for HSC students. From intelligent study timers that sync with your progress, to a full-fledged exam system that simulates board conditions, we've digitized the entire preparation journey.
            </p>
          </div>
          <div className="p-12 bg-brand-primary text-white rounded-[3rem] shadow-2xl shadow-brand-primary/30">
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <Heart className="text-white" /> Why Choose Us
            </h2>
            <p className="text-white/80 font-medium leading-loose">
              Unlike generic productivity apps, Lekhapora is built specifically for the NCTB curriculum. Our database is tuned to the exact requirements of Dhaka, Chittagong, Rajshahi, and other boards, ensuring your practice is always relevant.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center p-12 bg-brand-surface rounded-[3rem] border border-brand-text-s/10">
           <GraduationCap size={48} className="mx-auto text-brand-primary mb-6" />
           <h3 className="text-2xl font-black text-brand-text-p mb-4">Founder's Message</h3>
           <p className="text-brand-text-s italic font-medium">
             "Our goal is to ensure every student, regardless of their location, has access to premium-quality preparation tools. Technology should be a bridge to education, not a barrier."
           </p>
        </div>
      </section>
    </div>
  );
};

export default About;
