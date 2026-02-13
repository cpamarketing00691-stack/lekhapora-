
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  React.useEffect(() => {
    document.title = "Privacy Policy - Lekhapora";
  }, []);

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto space-y-12">
      <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">PRIVACY POLICY</h1>
      
      <div className="prose prose-slate max-w-none space-y-10 text-brand-text-s font-medium leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">1. Information We Collect</h2>
          <p>We collect personal information that you provide to us such as your name, email address, and academic data. We also collect usage data automatically through our analytics partners and Supabase infrastructure.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">2. How We Use Information</h2>
          <p>Your information is used to provide exam services, personalize your study plan, and improve platform performance. We use your authentication data strictly for secure session management.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">3. Data Storage</h2>
          <p>All user data is stored securely using Supabase (PostgreSQL) in data centers that comply with international security standards. We do not sell your personal data to advertisers.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-brand-text-p uppercase tracking-widest">4. User Rights</h2>
          <p>You have the right to request access to your data, request corrections, or request complete account deletion at any time via the settings panel.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
