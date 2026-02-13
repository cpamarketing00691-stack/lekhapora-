
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-[2rem] border border-brand-text-s/10 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-brand-bg transition-colors"
      >
        <span className="text-lg font-black text-brand-text-p">{question}</span>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} className="text-brand-primary" />
        </div>
      </button>
      {isOpen && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-2">
          <p className="text-brand-text-s font-medium leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ: React.FC = () => {
  React.useEffect(() => {
    document.title = "FAQ - Lekhapora";
  }, []);

  const faqs = [
    { question: "How do I create an account?", answer: "Click on the 'Get Started' or 'Login' button in the navigation bar. Select 'Register Now' and fill in your details. You'll need to verify your email address to access all features." },
    { question: "Is Lekhapora really free?", answer: "Yes, our core study tracking and syllabus management features are free. We also offer a pro tier for advanced model exams and detailed AI analytics." },
    { question: "How are results calculated?", answer: "Your results are calculated based on MCQ accuracy and time taken. We use NCTB's official weighting system to simulate real HSC board marks." },
    { question: "Is my data secure?", answer: "We use Supabase's enterprise-grade infrastructure to encrypt and store your study data. We never share your personal progress with third parties." },
    { question: "Can I use Lekhapora on mobile?", answer: "Absolutely! Lekhapora is fully responsive. You can also install it as a PWA (Progressive Web App) on your Android or iOS home screen." }
  ];

  return (
    <div className="py-20 px-6 max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">HELP CENTER</h1>
        <p className="text-brand-text-s font-medium">Frequently asked questions about our platform.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <FAQItem key={idx} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
