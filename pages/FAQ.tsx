
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-3xl border border-brand-text-s/10 overflow-hidden transition-all">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-brand-bg transition-colors">
        <span className="text-lg font-black text-brand-text-p">{q}</span>
        {isOpen ? <ChevronUp className="text-brand-primary" /> : <ChevronDown className="text-brand-text-s" />}
      </button>
      {isOpen && <div className="px-8 pb-8 animate-in slide-in-from-top-2"><p className="text-brand-text-s font-medium leading-relaxed">{a}</p></div>}
    </div>
  );
};

const FAQ: React.FC = () => {
  useEffect(() => {
    document.title = "FAQ - Lekhapora";
  }, []);

  const faqs = [
    { q: "How do I create an account?", a: "Simply click the 'Register' button, enter your details, and select your HSC group (Science/Commerce/Arts). You'll be ready to start tracking in under a minute." },
    { q: "Is Lekhapora really free?", a: "Yes, our core study tracker, syllabus manager, and daily tasks are completely free. We also offer a Pro tier for advanced model tests and AI analytics." },
    { q: "How are results calculated?", a: "Our mock exams use board-standard weighted scoring. You get instant feedback on your accuracy, speed, and chapter mastery." },
    { q: "Is my data secure?", a: "We use enterprise-grade encryption via Supabase and Vercel infrastructure to ensure your study progress and personal data remain private." },
    { q: "Can I use it on my mobile phone?", a: "Absolutely! Lekhapora is a fully responsive PWA. You can even install it on your home screen for a native app-like experience." }
  ];

  return (
    <div className="py-20 px-6 max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-6"><HelpCircle size={32} /></div>
        <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">Frequently Asked Questions</h1>
        <p className="text-lg text-brand-text-s font-medium">Everything you need to know about the platform.</p>
      </div>
      <div className="space-y-4">{faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}</div>
    </div>
  );
};

export default FAQ;
