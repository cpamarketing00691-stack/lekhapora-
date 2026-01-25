
import React, { useMemo } from 'react';
import { UserState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Smile, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    // 1. Study Time (Regular) - Max target 100 hours (6000 minutes)
    const regularStudyMinutes = userState.studyHistory
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const studyTimeFactor = Math.min(100, (regularStudyMinutes / 6000) * 100); 

    // 2. Target Completion - Percentage of chapters marked done
    const totalChapters = userState.subjects.reduce((acc, curr) => acc + curr.chapters.length, 0);
    const completedChapters = userState.subjects.reduce((acc, curr) => 
      acc + curr.chapters.filter(c => c.isCompleted).length, 0);
    const completionRate = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    // 3. Consistency - Based on a 30-day streak goal
    const consistencyFactor = Math.min(100, (userState.streaks / 30) * 100);
    
    // 4. Revision - Max target 20 hours (1200 minutes)
    const revisionMinutes = userState.studyHistory
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const revisionFactor = Math.min(100, (revisionMinutes / 1200) * 100);

    // STRICT NCTB FORMULA:
    // Score = (Study Time × 0.4) + (Target Completion × 0.3) + (Consistency × 0.2) + (Revision × 0.1)
    const finalScore = (studyTimeFactor * 0.4) + (completionRate * 0.3) + (consistencyFactor * 0.2) + (revisionFactor * 0.1);

    return {
      totalHours: ((regularStudyMinutes + revisionMinutes) / 60).toFixed(1),
      studyHours: (regularStudyMinutes / 60).toFixed(1),
      revisionHours: (revisionMinutes / 60).toFixed(1),
      completion: completionRate.toFixed(0),
      score: Math.round(finalScore),
      readinessLabel: finalScore > 85 ? t('চমৎকার', 'Excellent') : 
                      finalScore > 60 ? t('ভালো', 'Good') : 
                      finalScore > 30 ? t('চলমান', 'Steady') : t('শুরু', 'Starting'),
      factors: {
        study: Math.round(studyTimeFactor),
        completion: Math.round(completionRate),
        consistency: Math.round(consistencyFactor),
        revision: Math.round(revisionFactor)
      }
    };
  }, [userState, userState.language]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySessions = userState.studyHistory.filter(s => {
        const sDate = new Date(s.startTime).toISOString().split('T')[0];
        return sDate === date;
      });

      const study = daySessions.filter(s => !s.isRevision).reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
      const revision = daySessions.filter(s => s.isRevision).reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
      const dayName = new Date(date).toLocaleDateString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });

      return {
        name: dayName,
        study: parseFloat(study.toFixed(1)),
        revision: parseFloat(revision.toFixed(1)),
        fullDate: date
      };
    });
  }, [userState.studyHistory, userState.language]);

  const recentSessions = useMemo(() => {
    return [...userState.studyHistory]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 5);
  }, [userState.studyHistory]);

  const getSubjectName = (id: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('অজানা বিষয়', 'Unknown Subject');
  };

  const moodColor = {
    'Great': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    'Focused': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'Tired': 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    'Stressed': 'text-red-500 bg-red-50 dark:bg-red-900/20',
    'Burnt Out': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
  }[userState.currentMood || 'Great'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {userState.profile?.religion === 'Islam' ? t('আসসালামু আলাইকুম', 'Assalamu Alaikum') : t('হ্যালো', 'Hello')}, {userState.profile?.fullName}!
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">{t('তোমার HSC প্রস্তুতির বর্তমান চিত্র।', 'Your current HSC readiness overview.')}</p>
        </div>
        <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 shadow-sm ${moodColor}`}>
          <Activity size={20} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Readiness Dashboard */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">{t('প্রস্তুতি লেভেল', 'Readiness Level')}</h3>
              <div className="flex items-baseline gap-2">
                <h2 className="text-7xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stats.score}</h2>
                <span className="text-2xl font-bold text-slate-300">%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 mb-3 transform hover:scale-105 transition-transform cursor-default">
                <Target size={18} />
                <span className="text-sm font-black uppercase tracking-widest">{stats.readinessLabel}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{t('NCTB প্রোটোকল অনুযায়ী', 'NCTB Compliant Scoring')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 relative z-10">
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{t('পড়াশোনা (৪০%)', 'Study (40%)')}</span>
                <span className="text-emerald-500">{stats.factors.study}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" style={{ width: `${stats.factors.study}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{t('সিলেবাস (৩০%)', 'Syllabus (30%)')}</span>
                <span className="text-blue-500">{stats.factors.completion}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${stats.factors.completion}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{t('ধারাবাহিকতা (২০%)', 'Streak (20%)')}</span>
                <span className="text-orange-500">{stats.factors.consistency}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${stats.factors.consistency}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{t('রিভিশন (১০%)', 'Revision (10%)')}</span>
                <span className="text-purple-500">{stats.factors.revision}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-1000" style={{ width: `${stats.factors.revision}%` }} />
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center gap-4 relative z-10">
             <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
               <Info size={18} className="text-slate-400" />
             </div>
             <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic uppercase tracking-tighter">
               {t('ক্যালকুলেশন: (পড়া × ০.৪) + (টার্গেট × ০.৩) + (ধারাবাহিকতা × ০.২) + (রিভিশন × ০.১)', 'Logic: (Study × 0.4) + (Target × 0.3) + (Streak × 0.2) + (Revision × 0.1)')}
             </p>
          </div>
        </div>

        {/* Vertical Stat Cards */}
        <div className="space-y-8">
          <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-600/20 relative overflow-hidden group">
            <TrendingUp size={64} className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 mb-3">{t('মোট পড়াশোনা', 'Total Study')}</p>
              <h2 className="text-5xl font-black tracking-tighter">{stats.totalHours}</h2>
              <p className="text-xs font-bold opacity-60 mt-2 uppercase tracking-widest">{t('ঘণ্টা সমাপ্ত', 'Hours Logged')}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group">
            <RefreshCcw size={64} className="absolute -right-6 -top-6 text-purple-500 opacity-5 group-hover:rotate-180 transition-transform duration-1000" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{t('রিভিশন সময়', 'Revision Time')}</p>
              <h2 className="text-5xl font-black text-purple-600 tracking-tighter">{stats.revisionHours}</h2>
              <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-widest">{t('ঘণ্টা রিভিশন', 'Revision Hours')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h4 className="text-sm font-black text-slate-400 flex items-center gap-3 uppercase tracking-[0.2em]">
                <BarChart3 size={20} className="text-emerald-500" /> {t('সাপ্তাহিক কর্মতৎপরতা', 'Weekly Progress')}
              </h4>
              <p className="text-xs text-slate-400 mt-2 font-medium">{t('বিগত ৭ দিনের পড়াশোনার তুলনামূলক গ্রাফ।', 'Comparative study analysis for the last 7 days.')}</p>
            </div>
            <div className="flex gap-8 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('পড়া', 'Study')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/20"></div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('রিভিশন', 'Revision')}</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} 
                  unit="h" 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(16, 185, 129, 0.04)', radius: 10 }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', 
                    padding: '1.25rem',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: 'rgba(255, 255, 255, 0.98)'
                  }}
                  itemStyle={{ padding: '4px 0' }}
                />
                <Bar dataKey="study" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={44} />
                <Bar dataKey="revision" stackId="a" fill="#a855f7" radius={[12, 12, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <History size={20} className="text-blue-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('সাম্প্রতিক সেশন', 'Recent Activity')}</h4>
          </div>
          
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 max-h-[380px] scrollbar-hide">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <div key={session.id} className="group flex items-start gap-4 p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all hover:shadow-md">
                <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${session.isRevision ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {session.isRevision ? <RefreshCcw size={18} /> : <BookOpen size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-xs text-slate-800 dark:text-slate-100 truncate mb-1">
                    {getSubjectName(session.subjectId)}
                  </h5>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {session.durationMinutes} {t('মিনিট', 'Min')}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{new Date(session.startTime).toLocaleDateString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Activity size={32} className="text-slate-200 mb-4" />
                <p className="text-xs font-bold text-slate-400 italic">{t('এখনো কোনো সেশন নেই!', 'No activity logged yet!')}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
             <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <Smile size={18} className="text-emerald-500 shrink-0" />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black leading-tight">
                  {t(`${userState.profile?.aiName}: প্রতিদিন অন্তত ৩টি সেশন করার চেষ্টা করো!`, `${userState.profile?.aiName}: Aim for at least 3 sessions daily!`)}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Motivational Advisor */}
      <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/50 relative z-10 transition-all group-hover:rotate-12 group-hover:scale-110">
          <Smile size={52} strokeWidth={2.5} />
        </div>
        <div className="relative z-10 flex-1 text-center md:text-left space-y-3">
          <h4 className="font-black text-xs text-emerald-400 uppercase tracking-[0.4em] mb-2">{userState.profile?.aiName} {t('উপদেষ্টা', 'Academic Guide')}</h4>
          <p className="text-xl text-slate-100 font-bold leading-relaxed italic">
             {stats.score < 50 
               ? t('"আমাদের প্রস্তুতি এখনো শুরুর দিকে। প্রতিদিন ছোট ছোট লক্ষ্য সেট করো, আমি তোমার পাশে আছি!"', '"We are in the early stages of readiness. Set small daily targets, and remember I am right here with you!"') 
               : t('"দারুণ এনার্জি! রিভিশন সেশনগুলোতে তোমার ফোকাস অনেক বেড়েছে। এই ধারাবাহিকতা রাখলে A+ নিশ্চিত!"', '"Incredible energy! Your focus in revision sessions has improved significantly. Keep this up for a guaranteed A+!"')}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest">{t('ধারাবাহিকতা', 'Consistency')}: {userState.streaks} {t('দিন', 'Days')}</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest">{t('গ্রুপ', 'Group')}: {userState.profile?.group}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-[120px] transition-all group-hover:bg-emerald-500/10"></div>
      </div>
    </div>
  );
};

export default Dashboard;
