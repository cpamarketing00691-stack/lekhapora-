
import React, { useState } from 'react';
import { useLekhapora } from '../../contexts/LekhaporaContext';
import { Post } from '../../types';
import { LayoutGrid, FileText, Users, Activity, Plus, Search, ChevronRight, Edit3, Trash2, Globe, Lock } from 'lucide-react';
import CMSPostEditor from '../../components/cms/CMSPostEditor';

const CMSDashboard: React.FC = () => {
  const { state, dispatch } = useLekhapora();
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);
  const [search, setSearch] = useState('');

  const posts = state.cmsPosts || [];

  const handleSavePost = (post: Post) => {
    dispatch({ type: 'SAVE_POST', payload: post });
    setEditingPost(undefined);
  };

  const deletePost = (id: string) => {
    if (confirm("Permanently delete this article?")) {
      dispatch({ type: 'DELETE_POST', payload: id });
    }
  };

  if (editingPost !== undefined) {
    return <CMSPostEditor post={editingPost || undefined} onSave={handleSavePost} onClose={() => setEditingPost(undefined)} />;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black tracking-tighter leading-none mb-2 uppercase italic">Admin <span className="text-brand-primary">Command.</span></h2>
           <p className="text-brand-text-s font-medium text-sm tracking-tight">Content Ecosystem Management & Analytics</p>
        </div>
        <button 
          onClick={() => setEditingPost(null)}
          className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20}/> New Content
        </button>
      </header>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Content', val: posts.length, icon: FileText, color: 'text-brand-primary' },
           { label: 'Published', val: posts.filter(p => p.isPublished).length, icon: Globe, color: 'text-emerald-500' },
           { label: 'System Users', val: '12.4k', icon: Users, color: 'text-indigo-500' },
           { label: 'Uptime', val: '99.9%', icon: Activity, color: 'text-orange-500' }
         ].map((s, i) => (
           <div key={i} className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm group hover:border-brand-primary transition-all">
              <div className="flex items-center justify-between mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-bg shadow-inner ${s.color}`}>
                   <s.icon size={24} />
                 </div>
                 <ChevronRight size={16} className="text-brand-text-s opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{s.label}</p>
              <h4 className="text-2xl font-black text-brand-text-p">{s.val}</h4>
           </div>
         ))}
      </div>

      {/* Content Management Table */}
      <section className="bg-brand-surface rounded-[3.5rem] p-8 border border-brand-text-s/10 shadow-sm space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <h3 className="text-xl font-black flex items-center gap-3"><LayoutGrid className="text-brand-primary"/> Content Library</h3>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={16} />
              <input 
                placeholder="Search resources..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-bg rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase text-brand-text-s tracking-widest border-b border-brand-text-s/5">
                     <th className="px-4 py-4">Title & Slug</th>
                     <th className="px-4 py-4">Category</th>
                     <th className="px-4 py-4">Status</th>
                     <th className="px-4 py-4">Last Updated</th>
                     <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-brand-text-s/5">
                  {posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(post => (
                    <tr key={post.id} className="group hover:bg-brand-bg/40 transition-colors">
                       <td className="px-4 py-5">
                          <p className="text-sm font-black text-brand-text-p">{post.title}</p>
                          <p className="text-[9px] font-bold text-brand-text-s">/{post.slug}</p>
                       </td>
                       <td className="px-4 py-5">
                          <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[9px] font-black uppercase">{post.category}</span>
                       </td>
                       <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${post.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-brand-text-s'}`} />
                             <span className="text-[10px] font-black uppercase text-brand-text-s">{post.isPublished ? 'Live' : 'Draft'}</span>
                          </div>
                       </td>
                       <td className="px-4 py-5">
                          <span className="text-[10px] font-bold text-brand-text-s">{new Date(post.updatedAt).toLocaleDateString()}</span>
                       </td>
                       <td className="px-4 py-5 text-right space-x-2">
                          <button onClick={() => setEditingPost(post)} className="p-2.5 bg-brand-bg rounded-xl text-brand-text-s hover:text-brand-primary transition-all shadow-sm"><Edit3 size={14}/></button>
                          <button onClick={() => deletePost(post.id)} className="p-2.5 bg-brand-bg rounded-xl text-brand-text-s hover:text-rose-500 transition-all shadow-sm"><Trash2 size={14}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {posts.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                 <Lock size={48} className="text-brand-primary" />
                 <p className="text-xs font-black uppercase tracking-widest">Library is Empty. Secure Content Mode Active.</p>
              </div>
            )}
         </div>
      </section>
    </div>
  );
};

export default CMSDashboard;
