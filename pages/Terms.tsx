
import React from 'react';

const Terms: React.FC = () => {
  React.useEffect(() => {
    document.title = "Terms & Conditions - Lekhapora";
  }, []);

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto space-y-12">
      <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">TERMS & CONDITIONS</h1>
      
      <div className="prose prose-slate max-w-none space-y-10 text-brand-text-s font-medium leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">1. Acceptance</h2>
          <p>By accessing Lekhapora, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">2. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to engage in any automated scraping, reverse engineering, or prohibited commercial use of our test data.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">3. Intellectual Property</h2>
          <p>All content on Lekhapora including MCQs, study trackers, and UI design are the intellectual property of Lekhapora and are protected by copyright laws.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">4. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate our community guidelines or intellectual property rights without prior notice.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
