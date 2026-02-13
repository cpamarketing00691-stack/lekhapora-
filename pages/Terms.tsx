
import React, { useEffect } from 'react';
import BackgroundGrid from '../components/BackgroundGrid';

const Terms: React.FC = () => {
  useEffect(() => {
    document.title = "Terms of Service - Lekhapora";
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundGrid />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto bg-brand-surface p-12 md:p-16 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
          <h1 className="text-4xl font-black text-brand-text-p mb-8">Terms of Service</h1>
          <div className="prose prose-slate max-w-none space-y-8 text-brand-text-s font-medium leading-relaxed">
            <p>Last updated: June 2026</p>
            
            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using Lekhapora, you agree to be bound by these Terms of Service and all applicable laws and regulations in Bangladesh.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">2. User Responsibilities</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use the service only for lawful educational purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">3. Intellectual Property</h2>
              <p>The content, features, and functionality of the Lekhapora platform are the exclusive property of Lekhapora and are protected by international copyright and trademark laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">4. Limitation of Liability</h2>
              <p>Lekhapora is provided "as is" without warranty of any kind. We do not guarantee that the service will be uninterrupted or error-free. We are not liable for any study results or board exam outcomes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-text-p mb-4">5. Termination</h2>
              <p>We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users.</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
