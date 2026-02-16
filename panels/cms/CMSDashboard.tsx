import React, { useState, useEffect } from 'react';
import { useLekhapora } from '../../contexts/LekhaporaContext';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Post, CMSPage, Announcement } from '../../types';
import { 
  LayoutGrid, FileText, Users, Activity, Plus, Search, 
  ChevronRight, Edit3, Trash2, Globe, ShieldCheck, 
  Megaphone, AppWindow, Save, AlertCircle, Loader2
} from 'lucide-react';
import CMSPostEditor from '../../components/cms/CMSPostEditor';
import { supabase } from '../../lib/supabase';

const CMSDashboard: React.FC = () => {
  const { state, dispatch } = useLekhapora();
  const { admin, permissions } = useAdminAuth();
  const [tab, setTab] = useState<'posts' | 'pages' | 'broadcast'>('posts');
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'info' as any });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const pages = [
    { name: 'Landing', slug: 'landing' },
    { name: 'About', slug: 'about' },
    { name: 'FAQ', slug: 'faq' },
    { name: 'Contact', slug: 'contact' },
    { name: 'Home', slug: 'home' },
    { name: 'Login Content', slug: 'login' },
    { name: 'Register Content', slug: 'register' },
    { name: 'Privacy Policy', slug: 'privacy' },
    { name: 'Terms & Conditions', slug: 'terms' }
  ];

  const handleSavePost = async (post: Post) => {
    dispatch({ type: 'SAVE_POST', payload: post });
    setEditingPost(undefined);
    // Broadcast notification about new content
    sendBroadcast("Content Updated", `New study material added: ${post.title}`, 'info', false);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('cms_pages').upsert(editingPage);
      if (error) throw error;
      dispatch({ type: 'UPDATE_PAGE', payload: editingPage });
      setEditingPage(null);
      sendBroadcast("System Update", `The ${editingPage.slug} page has been updated.`, 'success', false);
    } catch (e) {
      alert("Page Save Failed");
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async (title: string, message: string, type: string, manual = true) => {
    try {
      const { error } = await supabase.from('announcements').insert({
        title, message, type, 
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      if (manual) {
        alert("Broadcast Published to all users.");
        setBroadcast({ title: '', message: '', type: 'info' });
      }
    } catch (e) {
      console.error("Broadcast failed", e);
    }
  };

  if (editingPost !== undefined) {
    return <CMSPostEditor post={editingPost || undefined} onSave={handleSavePost} onClose={() => setEditingPost(undefined)} />;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span className="text-[9px] font-black text-brand-text-s uppercase tracking-widest">Master Protocol: {admin?.role}</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter leading-none mb-2 uppercase italic">Admin <span className="text-brand-primary">Lekhapora.</span></h2>
           <div className="flex bg-brand-surface p-1 rounded-xl w-fit border border-brand-text-s/10 mt-4">
              {['posts', 'pages', 'broadcast'].map((t: any) => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s hover:text-brand-text-p'}`}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>
        {tab === 'posts' && (
          <button onClick={() => setEditingPost(null)} className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-brand-primary/20 flex items-center gap-3 hover:scale-105 transition-all">
            <Plus size={20}/> New Content
          </button>
        )}
      </header>

      {tab === 'posts' && (
        <section className="bg-brand-surface rounded-[3.5rem] p-8 border border-brand-text-s/10 shadow-sm space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black flex items-center gap-3"><FileText className="text-brand-primary"/> Study Content</h3>
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={16} />
                <input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-brand-bg rounded-xl font-bold text-xs outline-none" />
              </div>
           </div>
           <div className="divide-y divide-brand-text-s/5">
              {(state.cmsPosts || []).filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(post => (
                <div key={post.id} className="flex items-center justify-between p-4 hover:bg-brand-bg/50 rounded-2xl transition-all group">
                   <div>
                      <h4 className="font-black text-brand-text-p">{post.title}</h4>
                      <p className="text-[9px] font-bold text-brand-text-s uppercase">{post.category} • {post.isPublished ? 'Live' : 'Draft'}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setEditingPost(post)} className="p-2 bg-brand-bg rounded-xl text-brand-text-s hover:text-brand-primary"><Edit3 size={16}/></button>
                      <button className="p-2 bg-brand-bg rounded-xl text-brand-text-s hover:text-rose-500"><Trash2 size={16}/></button>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {tab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-brand-surface rounded-[3rem] p-8 border border-brand-text-s/10 shadow-sm space-y-4">
             <h3 className="text-lg font-black flex items-center gap-2"><AppWindow className="text-brand-primary" /> Public Repositories</h3>
             <div className="space-y-2">
                {pages.map(p => (
                  <button 
                    key={p.slug}
                    onClick={() => setEditingPage({ slug: p.slug, content: state.cmsPages[p.slug]?.content || { hero_title: '', hero_subtitle: '', sections: [] } })}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${editingPage?.slug === p.slug ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-brand-bg/50 border-transparent hover:border-brand-primary/20'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">{p.name}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
             </div>
          </section>

          <section className="lg:col-span-2 bg-brand-surface rounded-[3rem] p-8 border border-brand-text-s/10 shadow-sm">
             {editingPage ? (
               <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black uppercase">Editing: {editingPage.slug}</h3>
                    <button onClick={handleSavePage} disabled={loading} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
                      {loading ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Page
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">Main Headline</label>
                      <input 
                        value={editingPage.content.hero_title}
                        onChange={e => setEditingPage({ ...editingPage, content: { ...editingPage.content, hero_title: e.target.value } })}
                        className="w-full p-4 bg-brand-bg rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">Supportive Text</label>
                      <textarea 
                        rows={4}
                        value={editingPage.content.hero_subtitle}
                        onChange={e => setEditingPage({ ...editingPage, content: { ...editingPage.content, hero_subtitle: e.target.value } })}
                        className="w-full p-4 bg-brand-bg rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all resize-none"
                      />
                    </div>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <AppWindow size={64} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Select a public page to customize its content repository.</p>
               </div>
             )}
          </section>
        </div>
      )}

      {tab === 'broadcast' && (
        <section className="max-w-2xl mx-auto bg-brand-surface rounded-[4rem] p-12 border border-brand-text-s/10 shadow-2xl space-y-10 text-center">
           <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary mx-auto shadow-inner">
             <Megaphone size={40} className="animate-bounce" />
           </div>
           <div>
              <h3 className="text-3xl font-black text-brand-text-p uppercase tracking-tighter italic">Broadcast Center</h3>
              <p className="text-brand-text-s font-medium mt-2">Publish manual notifications to every student dashboard instantly.</p>
           </div>
           <div className="space-y-4 text-left">
              <input 
                placeholder="Alert Title (e.g. Critical Update)" 
                value={broadcast.title}
                onChange={e => setBroadcast({...broadcast, title: e.target.value})}
                className="w-full p-5 bg-brand-bg rounded-2xl font-black outline-none border-2 border-transparent focus:border-brand-primary transition-all"
              />
              <textarea 
                rows={5}
                placeholder="Message for all users..." 
                value={broadcast.message}
                onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                className="w-full p-5 bg-brand-bg rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                 {['info', 'warning', 'success'].map(type => (
                   <button 
                    key={type}
                    onClick={() => setBroadcast({...broadcast, type})}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${broadcast.type === type ? 'bg-brand-text-p text-white border-brand-text-p' : 'bg-brand-bg text-brand-text-s border-brand-text-s/10'}`}
                   >
                     {type}
                   </button>
                 ))}
              </div>
           </div>
           <button 
             onClick={() => sendBroadcast(broadcast.title, broadcast.message, broadcast.type)}
             disabled={!broadcast.title || !broadcast.message}
             className="w-full py-6 bg-brand-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-brand-primary/40 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
           >
             <Megaphone size={20}/> Publish to All
           </button>
        </section>
      )}
    </div>
  );
};

export default CMSDashboard;