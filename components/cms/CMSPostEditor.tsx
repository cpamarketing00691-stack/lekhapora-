
import React, { useState, useCallback } from 'react';
import { Post, PostBlock } from '../../types';
import { Plus, Trash2, GripVertical, Save, Eye, Layout, Type, Image as ImageIcon, CheckCircle, FileText, ChevronLeft } from 'lucide-react';

interface Props {
  post?: Post;
  onSave: (post: Post) => void;
  onClose: () => void;
}

const CMSPostEditor: React.FC<Props> = ({ post, onSave, onClose }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [blocks, setBlocks] = useState<PostBlock[]>(post?.blocks || []);
  const [category, setCategory] = useState(post?.category || 'Physics');

  const addBlock = (type: PostBlock['type']) => {
    const newBlock: PostBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'mcq' ? { question: '', options: ['', '', '', ''], correct: 0 } : ''
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleSave = () => {
    onSave({
      id: post?.id || `post-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/ /g, '-'),
      category,
      blocks,
      isPublished: post?.isPublished || false,
      authorId: 'admin',
      createdAt: post?.createdAt || Date.now(),
      updatedAt: Date.now()
    });
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg animate-in slide-in-from-right duration-500 overflow-hidden">
      <header className="h-20 bg-brand-surface border-b border-brand-text-s/10 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-xl text-brand-text-s transition-all">
            <ChevronLeft />
          </button>
          <div>
            <h2 className="text-xl font-black text-brand-text-p">{post ? 'Edit Content' : 'New Study Material'}</h2>
            <p className="text-[10px] font-bold text-brand-text-s uppercase tracking-widest">NCTB CMS Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-brand-bg text-brand-text-p rounded-xl font-black text-[10px] uppercase tracking-widest border border-brand-text-s/10 flex items-center gap-2">
            <Eye size={14} /> Preview
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 flex items-center gap-2">
            <Save size={14} /> Save Draft
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
          <div className="space-y-4">
             <input 
               type="text" 
               placeholder="Article Title..." 
               value={title}
               onChange={e => setTitle(e.target.value)}
               className="w-full text-4xl md:text-6xl font-black bg-transparent border-none outline-none placeholder:text-brand-text-s/20 text-brand-text-p tracking-tighter"
             />
             <select 
               value={category}
               onChange={e => setCategory(e.target.value)}
               className="bg-brand-surface px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-brand-text-s/10 outline-none"
             >
               <option>Physics</option>
               <option>Chemistry</option>
               <option>Biology</option>
               <option>English</option>
             </select>
          </div>

          <div className="space-y-6">
             {blocks.map((block, idx) => (
               <div key={block.id} className="group relative bg-brand-surface/40 p-8 rounded-[2.5rem] border border-transparent hover:border-brand-primary/20 transition-all">
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 text-brand-text-s cursor-grab"><GripVertical size={20}/></div>
                  </div>
                  <button 
                    onClick={() => deleteBlock(block.id)}
                    className="absolute -right-3 -top-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition-all"
                  >
                    <Trash2 size={14}/>
                  </button>

                  {block.type === 'heading' && (
                    <input 
                      value={block.content}
                      onChange={e => updateBlock(block.id, e.target.value)}
                      placeholder="Section Heading..."
                      className="w-full text-2xl font-black bg-transparent border-none outline-none text-brand-text-p"
                    />
                  )}

                  {block.type === 'paragraph' && (
                    <textarea 
                      value={block.content}
                      onChange={e => updateBlock(block.id, e.target.value)}
                      placeholder="Write your explanation here..."
                      className="w-full min-h-[100px] bg-transparent border-none outline-none text-brand-text-s font-medium leading-relaxed resize-none"
                    />
                  )}

                  {block.type === 'mcq' && (
                    <div className="space-y-4">
                      <input 
                        value={block.content.question}
                        onChange={e => updateBlock(block.id, { ...block.content, question: e.target.value })}
                        placeholder="MCQ Question..."
                        className="w-full font-black text-lg bg-transparent outline-none mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {block.content.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-3 bg-brand-bg p-3 rounded-xl border border-brand-text-s/5">
                            <button 
                              onClick={() => updateBlock(block.id, { ...block.content, correct: oIdx })}
                              className={`w-5 h-5 rounded-full border-2 ${block.content.correct === oIdx ? 'bg-brand-primary border-brand-primary shadow-sm' : 'border-brand-text-s/20'}`}
                            />
                            <input 
                              value={opt}
                              onChange={e => {
                                const newOpts = [...block.content.options];
                                newOpts[oIdx] = e.target.value;
                                updateBlock(block.id, { ...block.content, options: newOpts });
                              }}
                              className="bg-transparent border-none outline-none text-sm font-bold w-full"
                              placeholder={`Option ${String.fromCharCode(65+oIdx)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             ))}

             <div className="pt-8 flex flex-wrap items-center justify-center gap-4">
                <button onClick={() => addBlock('heading')} className="flex items-center gap-2 px-6 py-4 bg-brand-surface rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand-primary/40 border border-brand-text-s/5 transition-all"><Type size={16}/> Heading</button>
                <button onClick={() => addBlock('paragraph')} className="flex items-center gap-2 px-6 py-4 bg-brand-surface rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand-primary/40 border border-brand-text-s/5 transition-all"><FileText size={16}/> Text</button>
                <button onClick={() => addBlock('mcq')} className="flex items-center gap-2 px-6 py-4 bg-brand-surface rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand-primary/40 border border-brand-text-s/5 transition-all"><CheckCircle size={16}/> MCQ</button>
                <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-6 py-4 bg-brand-surface rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand-primary/40 border border-brand-text-s/5 transition-all"><ImageIcon size={16}/> Media</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSPostEditor;
