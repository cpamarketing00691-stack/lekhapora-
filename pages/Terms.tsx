
import React, { useEffect } from 'react';

const Terms: React.FC = () => {
  useEffect(() => {
    document.title = "Terms & Conditions - Lekhapora";
  }, []);

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto space-y-12">
      <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none space-y-10 text-brand-text-s font-medium leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">1. Acceptance of Terms</h2>
          <p>By accessing or using Lekhapora, you agree to be bound by these Terms of Service and all applicable laws and regulations in Bangladesh.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">2. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate information during profile setup and onboarding.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">3. Intellectual Property</h2>
          <p>All content, including MCQ banks, test algorithms, and UI designs, are the exclusive property of Lekhapora and are protected by copyright laws.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">4. Service Availability</h2>
          <p>Lekhapora is provided "as is". While we strive for 99.9% uptime, we do not guarantee uninterrupted service during board exam peak hours.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">5. Termination</h2>
          <p>We reserve the right to terminate accounts that engage in automated scraping, unauthorized sharing of test content, or violation of community standards.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
