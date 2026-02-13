
import React from 'react';
import { Target, Heart, GraduationCap, Users } from 'lucide-react';

const About: React.FC = () => {
  React.useEffect(() => {
    document.title = "About - Lekhapora";
  }, []);

  return (
    <div className="space-y-32 py-20">
      {/* Hero */}
      <section className="px-6 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-p tracking-tighter">
          EMPOWERING STUDENTS THROUGH <span className="text-brand-primary">SMART LEARNING.</span>
        </h1>
        <p className="text-xl text-brand-text-s font-medium leading-relaxed">
          Lekhapora is more than an app; it's a digital companion for the next generation of Bangladeshi scholars.
        </p>
      </section>

      {/* Mission */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-brand-text-p">Our Mission</h2>
            <p className="text-lg text-brand-text-s font-medium leading-relaxed">
              We believe every student in Bangladesh deserves access to premium quality exam preparation, regardless of their background or location. Our mission is to democratize education through cutting-edge technology and structured learning frameworks.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-brand-primary">95%</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">Accuracy Rate</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-brand-primary">10k+</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">Daily Students</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface h-[400px] rounded-[3rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent"></div>
            <Users size={200} className="absolute bottom-[-50px] right-[-50px] text-brand-primary/10" />
          </div>
        </div>
      </section>

      {/* Team/Founder */}
      <section className="bg-brand-surface/30 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="w-32 h-32 bg-brand-primary/20 rounded-full mx-auto flex items-center justify-center">
            <Heart size={48} className="text-brand-primary" />
          </div>
          <h2 className="text-4xl font-black text-brand-text-p italic">"Education is the most powerful weapon which you can use to change the world."</h2>
          <p className="text-brand-text-s font-bold uppercase tracking-widest">— Lekhapora Team</p>
        </div>
      </section>
    </div>
  );
};

export default About;
