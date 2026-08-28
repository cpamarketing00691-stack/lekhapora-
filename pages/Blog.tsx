import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { ChevronRight, Calendar, User, Search, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const Blog: React.FC = () => {
  const { state } = useLekhapora();
  const publishedPosts = state.cmsPosts.filter(p => p.isPublished).sort((a, b) => b.createdAt - a.createdAt);

  useEffect(() => {
    document.title = "Blog - Lekhapora";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 font-serif">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          <header className="mb-12 border-b pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Latest Articles</h1>
            <p className="text-lg text-gray-600 mt-4 font-sans">Insights, updates, and study tips for HSC candidates.</p>
          </header>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-sans">No articles published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {publishedPosts.map((post, idx) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 text-sm text-gray-500 font-sans mb-4">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-brand-primary font-medium bg-brand-primary/10 px-2 py-1 rounded-md">{post.category || 'Uncategorized'}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 hover:text-brand-primary transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6 font-sans">
                    {/* Simple excerpt extractor from blocks */}
                    {post.blocks.find(b => b.type === 'paragraph')?.content?.substring(0, 150) || 'Click to read more...'}...
                  </p>
                  <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-brand-primary font-semibold font-sans hover:underline">
                    Read Article <ChevronRight size={16} />
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* Classic Sidebar */}
        <aside className="lg:col-span-4 space-y-8 font-sans">
          {/* Search Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search</h3>
            <div className="relative">
              <input type="text" placeholder="Search articles..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all" />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Categories Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Categories</h3>
            <ul className="space-y-3">
              {['HSC Tips', 'Subject Guides', 'Updates', 'Student Stories'].map(cat => (
                <li key={cat}>
                  <Link to="#" className="text-gray-600 hover:text-brand-primary flex items-center justify-between">
                    <span>{cat}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{Math.floor(Math.random() * 10)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['Physics', 'Chemistry', 'Study Hacks', 'NCTB', 'Routine', 'Motivation'].map(tag => (
                <Link key={tag} to="#" className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-colors">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Blog;
