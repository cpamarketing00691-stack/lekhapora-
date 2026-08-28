import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state } = useLekhapora();
  
  const post = state.cmsPosts.find(p => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} - Lekhapora`;
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-8">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 font-serif">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={() => navigate('/blog')} className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-primary mb-8 font-sans font-medium transition-colors">
          <ArrowLeft size={16} /> Back to Articles
        </button>

        <article className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <header className="mb-10 text-center border-b pb-10">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-sans mb-6 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-brand-primary font-bold">{post.category || 'Uncategorized'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">{post.title}</h1>
            <div className="flex items-center justify-center gap-3 font-sans text-gray-600">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Admin</p>
                <p className="text-xs">Content Editor</p>
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none text-gray-700 font-sans">
            {post.blocks.map((block, idx) => {
              if (block.type === 'heading') return <h2 key={idx} className="text-3xl font-bold text-gray-900 mt-8 mb-4 font-serif">{block.content}</h2>;
              if (block.type === 'paragraph') return <p key={idx} className="mb-6 leading-relaxed">{block.content}</p>;
              if (block.type === 'image') return <img key={idx} src={block.content.url} alt={block.content.caption || ''} className="w-full rounded-xl my-8 shadow-sm" />;
              if (block.type === 'divider') return <hr key={idx} className="my-10 border-gray-200" />;
              return null;
            })}
          </div>

          <footer className="mt-12 pt-8 border-t flex flex-wrap gap-2 font-sans">
             <span className="flex items-center gap-2 text-gray-500 mr-4 font-medium"><Tag size={16}/> Tags:</span>
             {['HSC', 'Preparation', post.category || 'General'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-50 border text-sm text-gray-600 rounded-full">{tag}</span>
             ))}
          </footer>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
