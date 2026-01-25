
import React, { useMemo } from 'react';
import { UserState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Smile, Activity, RefreshCcw, BarChart3, Info } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    // 1. Study Time (Regular) - Max target 100 hours
    const regularStudyMinutes = userState.studyHistory
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const studyTimeFactor = Math.min(100, (regularStudyMinutes / (100 * 60)) * 100); 

    // 2. Target Completion - Percentage of chapters marked done
    const totalChapters = userState.subjects.reduce((acc, curr) => acc + curr.chapters.length, 0);
    const completedChapters = userState.subjects.reduce((acc, curr) => 
      acc + curr.chapters.filter(c => c.isCompleted).length, 0);
    const completionRate = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    // 3. Consistency - Based on a 30-day streak goal
    const consistencyFactor = Math.min(100, (userState.streaks / 30) * 100);
    
    // 4. Revision - Max target 20 hours
    const revisionMinutes = userState.studyHistory
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const revisionFactor = Math.min(100, (revisionMinutes / (20 * 60)) * 100);

    // Strict Formula: (Study Time × 0.4) + (Target Completion × 0.3) + (Consistency × 0.2) + (Revision × 0.1)
    const finalScore = (studyTimeFactor * 0.4) + (completionRate * 0.3) + (consistencyFactor * 0.2) + (revisionFactor * 0.1);

    return {
      totalHours: ((regularStudyMinutes + revisionMinutes) / 60).toFixed(1),
      studyHours: (regularStudyMinutes / 60).toFixed(1),
      revisionHours: (revisionMinutes / 60).toFixed(1),
      completion: completionRate.toFixed(0),
      score: Math.round(finalScore),
      readinessLabel: finalScore > 80 ? t('চমৎকার প্রস্তুতি', 'Excellent Readiness') : 
                      finalScore > 50 ? t('মাঝারি প্রস্তুতি', 'Steady Progress') : 
                      t('প্রস্তুতি শুরু হচ্ছে', 'Just Starting'),
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
      };
    });
  }, [userState.studyHistory, userState.language]);

  const moodColor = {
    'Great': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    'Focused': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'Tired': 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    'Stressed': 'text-red-500 bg-red-50 dark:bg-red-900/20',
    'Burnt Out': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
  }[userState.currentMood || 'Great'];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {userState.profile?.religion === 'Islam' ? t('আসসালামু আলাইকুম', 'Assalamu Alaikum') : t('হ্যালো', 'Hello')}, {userState.profile?.fullName}!
          </h1>
          <p className="text-slate-500">{t('আজকের প্রস্তুতি রিপোর্ট', 'Today\'s Readiness Report')}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-100 dark:border-slate-800 ${moodColor}`}>
          <Activity size={18} />
          <span className="text-sm font-semibold">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
        </div>
      </header>

      {/* Main Score and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('সার্বিক প্রস্তুতি স্কোর', 'Overall Readiness Score')}</h3>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white">{stats.score}<span className="text-2xl text-slate-300">/100</span></h2>
            </div>
            <div className="text-right">
              <span className="inline-block px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase mb-2">
                {stats.readinessLabel}
              </span>
              <p className="text-xs text-slate-400 font-medium">{t('NCTB সিলেবাস অনুযায়ী', 'Based on NCTB Syllabus')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">{t('পড়াশোনার সময় (৪০%)', 'Study Time (40%)')}</span>
                  <span>{stats.factors.study}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.factors.study}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">{t('সিলেবাস সম্পন্ন (৩০%)', 'Syllabus (30%)')}</span>
                  <span>{stats.factors.completion}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.factors.completion}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">{t('ধারাবাহিকতা (২০%)', 'Consistency (20%)')}</span>
                  <span>{stats.factors.consistency}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.factors.consistency}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">{t('রিভিশন (১০%)', 'Revision (10%)')}</span>
                  <span>{stats.factors.revision}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.factors.revision}%` }} />
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
               <Info size={14} className="text-slate-300 mt-0.5" />
               <p className="text-[10px] text-slate-400 italic">
                 {t('এই স্কোরটি তোমার পড়া, রিভিশন এবং সিলেবাস শেষ করার গতির উপর ভিত্তি করে একটি গাণিতিক হিসাব।', 'This score is a mathematical calculation based on your study, revision, and syllabus progress.')}
               </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/10 flex flex-col justify-between min-h-[160px]">
            <TrendingUp size={32} className="opacity-40" />
            <div>
              <p className="text-[10px] uppercase font-black opacity-80 mb-1">{t('মোট পড়া', 'Total Study')}</p>
              <h2 className="text-4xl font-black">{stats.totalHours} <span className="text-lg font-bold opacity-60">Hrs</span></h2>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[160px]">
            <RefreshCcw size={32} className="text-purple-500 opacity-40" />
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{t('রিভিশন সময়', 'Revision Time')}</p>
              <h2 className="text-4xl font-black text-purple-600">{stats.revisionHours} <span className="text-lg font-bold text-slate-300">Hrs</span></h2>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly History Chart */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
              <BarChart3 size={16} /> {t('সাপ্তাহিক কর্মতৎপরতা', 'Weekly Activity')}
            </h4>
            <p className="text-xs text-slate-300 mt-1">{t('গত ৭ দিনের পড়াশোনার তথ্য', 'Your study data from the last 7 days')}</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t('পড়া', 'Study')}</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> {t('রিভিশন', 'Revision')}</div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} unit="h" />
              <Tooltip 
                cursor={{ fill: 'rgba(16, 185, 129, 0.03)' }}
                contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
              />
              <Bar dataKey="study" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} />
              <Bar dataKey="revision" stackId="a" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Smile size={32} />
        </div>
        <div className="relative z-10">
          <h4 className="font-bold mb-1 text-emerald-400">{userState.profile?.aiName} {t('থেকে পরামর্শ', 'Advisor')}</h4>
          <p className="text-sm text-slate-300 italic">
             {stats.score < 40 
               ? t('"পড়াশোনার সময় একটু বাড়িয়ে দিলে আমাদের স্কোর খুব দ্রুত বাড়বে!"', '"Increasing our study time a bit will boost our score very quickly!"') 
               : t('"দারুণ করছো! রিভিশন সেশনগুলো চালিয়ে যাও, এটাই আসল সাফল্যের চাবিকাঠি।"', '"Great job! Keep the revision sessions going, that\'s the key to success."')}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>
    </div>
  );
};

export default Dashboard;
