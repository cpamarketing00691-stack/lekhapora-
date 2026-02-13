
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import BackgroundGrid from '../components/BackgroundGrid';

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-brand-surface rounded-3xl border border-brand-text-s/10 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-brand-text-s/5 transition-colors"
      >
        <span className="text-lg font-black text-brand-text-p">{q}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
          <p className="text-brand-text-s font-medium leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const FAQ: React.FC = () => {
  useEffect(() => {
    document.title = "FAQ - Lekhapora";
  }, []);

  const faqs = [
    { q: "Is Lekhapora really free?", a: "Yes! Our core features including the Syllabus Tracker, Daily Tasks, and Focus Timer are completely free for all HSC students." },
    { q: "How do I create an account?", a: "Simply click the 'Login' or 'Get Started' button, enter your email and password, and confirm your email. You'll be ready to start in less than 2 minutes." },
    { q: "Are the exams based on NCTB?", a: "Absolutely. Our question bank and syllabus breakdown are strictly derived from the latest NCTB (National Curriculum and Textbook Board) guidelines for HSC." },
    { q: "Can I use it on my mobile phone?", a: "Yes, Lekhapora is a Progressive Web App (PWA). You can install it on your Android or iOS home screen for a full native-like experience even offline." },
    { q: "Is my data secure?", a: "We use Supabase, an industry-standard backend with enterprise-grade encryption, to ensure your study logs and profile data remain private and secure." }
  ];

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundGrid />
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-black text-brand-text-p mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-brand-text-s font-medium">Everything you need to know about the platform.</p>
        </div>
      </section>

      <section className="px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>
      
      <section className="pt-20 px-6">
        <div className="max-w-3xl mx-auto p-10 bg-brand-primary rounded-[2.5rem] text-center text-white">
          <HelpCircle className="mx-auto mb-4" size={32} />
          <h3 className="text-xl font-black mb-2">Still have questions?</h3>
          <p className="text-white/80 font-medium mb-6">Our support team is always here to help you.</p>
          <a href="/contact" className="inline-block px-8 py-3 bg-white text-brand-primary rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Contact Us</a>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
