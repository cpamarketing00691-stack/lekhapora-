
import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, CheckCircle, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Contact Us - Lekhapora";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([formData]);
      if (error) throw error;
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <h1 className="text-5xl font-black text-brand-text-p mb-8 italic uppercase tracking-tighter">Get In Touch</h1>
          <p className="text-lg text-brand-text-s font-medium mb-12">Have a question about our model tests or need help with your account? Our team is here to support your HSC journey.</p>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-center">
              <div className="w-14 h-14 bg-brand-surface rounded-2xl flex items-center justify-center text-brand-primary shadow-sm"><Mail size={24} /></div>
              <div>
                <p className="text-xs font-black uppercase text-brand-text-s tracking-widest">Email Us</p>
                <p className="text-lg font-bold text-brand-text-p">support@lekhapora.app</p>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <div className="w-14 h-14 bg-brand-surface rounded-2xl flex items-center justify-center text-brand-primary shadow-sm"><Phone size={24} /></div>
              <div>
                <p className="text-xs font-black uppercase text-brand-text-s tracking-widest">Hotline</p>
                <p className="text-lg font-bold text-brand-text-p">+880 1234-567890</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-brand-text-s/10 shadow-xl">
          {success ? (
            <div className="text-center py-20 space-y-6 animate-in zoom-in-95">
              <CheckCircle size={60} className="text-emerald-500 mx-auto" />
              <h2 className="text-3xl font-black text-brand-text-p">Message Sent!</h2>
              <p className="text-brand-text-s font-medium">We've received your inquiry and will respond within 24 hours.</p>
              <button onClick={() => setSuccess(false)} className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-brand-bg rounded-2xl border-2 border-transparent focus:border-brand-primary outline-none font-bold transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-brand-bg rounded-2xl border-2 border-transparent focus:border-brand-primary outline-none font-bold transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Message</label>
                <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-4 bg-brand-bg rounded-2xl border-2 border-transparent focus:border-brand-primary outline-none font-bold transition-all resize-none" placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />} Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
