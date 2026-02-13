
import React, { useEffect } from 'react';
import BackgroundGrid from '../components/BackgroundGrid';

const Privacy: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Lekhapora";
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundGrid />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto bg-brand-surface p-12 md:p-16 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
          <h1 className="text-4xl font-black text-brand-text-p mb-8">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none space-y-8 text-brand-text-s font-medium leading-relaxed">
            <p>Last updated: June 2026</p>
            
            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">1. Information We Collect</h2>
              <p>We collect information that you provide directly to us when you create an account, update your profile, or use our services. This includes your name, email address, password, educational group (Science/Commerce/Arts), and your study progress data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide, maintain, and improve our services.</li>
                <li>To personalize your experience and provide relevant exam content.</li>
                <li>To track your study progress and provide historical reports.</li>
                <li>To communicate with you about updates or security issues.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">3. Data Storage and Security</h2>
              <p>Your data is stored securely using Supabase (PostgreSQL) which provides enterprise-grade encryption. We do not sell or share your personal data with third-party advertisers.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">4. Cookies</h2>
              <p>We use essential cookies to maintain your login session. You can manage cookie preferences in your browser settings, but some features may not work without them.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">5. Contact</h2>
              <p>If you have any questions about this policy, contact us at privacy@lekhapora.app.</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
