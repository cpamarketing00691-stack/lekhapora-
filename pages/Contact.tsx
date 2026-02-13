
import React, { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    document.title = "Contact - Lekhapora";
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
      alert("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-brand-text-p">CONTACT US</h1>
        <p className="text-brand-text-s font-medium">Have feedback or need technical help? We're here for you.</p>
      </div>

      <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-brand-text-s/10 shadow-xl">
        {success ? (
          <div className="text-center py-20 space-y-6 animate-in zoom-in-95">
            <CheckCircle size={60} className="text-emerald-500 mx-auto" />
            <h2 className="text-3xl font-black text-brand-text-p">Message Sent!</h2>
            <p className="text-brand-text-s font-medium">We've received your request and will get back to you shortly.</p>
            <button onClick={() => setSuccess(false)} className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs">Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Email</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">Message</label>
              <textarea 
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-6 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all resize-none"
                placeholder="How can we help?"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
