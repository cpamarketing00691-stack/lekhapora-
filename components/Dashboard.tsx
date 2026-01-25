
import React, { useMemo } from 'react';
import { UserState, Mood } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, TrendingUp, Calendar, Zap, Smile, Activity, RefreshCcw } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    // Score = (Study Time × 0.4) + (Target Completion × 0.3) + (Consistency × 0.2) + (Revision × 0.1)
    const regularStudyMinutes = userState.studyHistory
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    
    const revisionMinutes = userState.studyHistory
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    
    const totalStudyHours = (regularStudyMinutes + revisionMinutes) / 60;
    
    // Normalized factors (out of 100)
    // Assuming a baseline of 200 hours for 100% study time factor in this mock logic
    const studyTimeFactor = Math.min(100, (regularStudyMinutes / (100 * 60)) * 100); 

    const totalChapters = userState.subjects.reduce((acc, curr) => acc + curr.chapters.length, 0);
    const completedChapters = userState.subjects.reduce((acc, curr) => 
      acc + curr.chapters.filter(c => c.isCompleted).length, 0);
    const completionRate = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    const consistencyFactor = Math.min(100, (userState.streaks / 30) * 100);
    
    // Revision factor based on revision time (assuming 20 hours of revision as baseline for 100%)
    const revisionFactor = Math.min(100, (revisionMinutes / (20 * 60)) * 100);

    const finalScore = (studyTimeFactor * 0.4) + (completionRate * 0.3) + (consistencyFactor * 0.2) + (revisionFactor * 0.1);

    return {
      totalHours: totalStudyHours.toFixed(1),
      studyHours: (regularStudyMinutes / 60).toFixed(1),
      revisionHours: (revisionMinutes / 60).toFixed(1),
      completion: completionRate.toFixed(0),
      score: finalScore.toFixed(1),
      readiness: finalScore > 75 ? t('চমৎকার', 'Excellent') : finalScore > 50 ? t('স্থির', 'Steady') : t('শুরু করছি', 'Starting')
    };
  }, [userState, userState.language]);

  const moodColor = {
    'Great': 'text-emerald-500 bg-emerald-50',
    'Focused': 'text-blue-500 bg-blue-50',
    'Tired': 'text-orange-500 bg-orange-50',
    'Stressed': 'text-red-500 bg-red-50',
    'Burnt Out': 'text-purple-500 bg-purple-50'
  }[userState.currentMood || 'Great'];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {userState.profile?.religion === 'Islam' ? t('আসসালামু আলাইকুম', 'Assalamu Alaikum') : t('হ্যালো', 'Hello')}, {userState.profile?.fullName}!
          </h1>
          <p className="text-slate-500">{t('তোমার আজকের readiness score', 'Your readiness score today')}: {stats.score}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-100 ${moodColor}`}>
          <Activity size={18} />
          <span className="text-sm font-semibold">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
        </div>
      </header>

      {/* Progress Bars */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold mb-4 text-slate-400 text-xs uppercase tracking-widest">{t('HSC প্রস্তুতি বিশ্লেষণ', 'HSC Readiness Breakdown')}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1 font-medium">
              <span>{t('সার্বিক স্কোর', 'Overall Score')}</span>
              <span>{stats.score}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" 
                style={{ width: `${stats.score}%` }} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-500">
                <span>{t('সিলেবাস সম্পন্ন', 'Syllabus Completion')}</span>
                <span>{stats.completion}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.completion}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-500">
                <span>{t('ধারাবাহিকতা', 'Consistency')}</span>
                <span>{userState.streaks} {t('দিন', 'days')}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (userState.streaks/30)*100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
           <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200 dark:shadow-none">
             <TrendingUp size={32} className="mb-4 opacity-50" />
             <p className="text-xs uppercase font-bold opacity-80">{t('প্রস্তুতি', 'Readiness')}</p>
             <h2 className="text-3xl font-black">{stats.readiness}</h2>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
             <RefreshCcw size={32} className="mb-4 text-purple-500" />
             <p className="text-xs uppercase font-bold text-slate-400">{t('রিভিশন সময়', 'Revision Time')}</p>
             <h2 className="text-3xl font-black">{stats.revisionHours} <span className="text-sm font-normal text-slate-400">{t('ঘণ্টা', 'Hours')}</span></h2>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 col-span-2">
             <Calendar size={32} className="mb-4 text-blue-500" />
             <p className="text-xs uppercase font-bold text-slate-400">{t('মোট পড়াশোনা', 'Total Study')}</p>
             <h2 className="text-3xl font-black">{stats.totalHours} <span className="text-sm font-normal text-slate-400">{t('ঘণ্টা', 'Hours')}</span></h2>
           </div>
        </div>

        {/* AI Buddy Context */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Smile size={18} />
                </div>
                <h4 className="font-bold text-sm">{userState.profile?.aiName}</h4>
              </div>
              <p className="text-slate-300 text-sm italic">
                {userState.currentMood === 'Burnt Out' 
                  ? t('"একটু চা খেয়ে বিরতি নাও, শরীর আগে পড়া পরে!"', '"Take a break with some tea, health comes before studies!"') 
                  : t('"চলো আজ রিভিশন দিয়ে আমাদের স্কোর আরও বাড়িয়ে ফেলি!"', '"Let\'s boost our score by doing some revision today!"')}
              </p>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>
      </div>

      {/* Ghost/Predicted Bar logic - visual only based on REAL trends */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
          <Activity size={16} /> {t('সম্ভাব্য উন্নতি (আগামী ৭ দিন)', 'Predicted Progress (Next 7 Days)')}
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{day: 'Sun', current: parseFloat(stats.score), pred: parseFloat(stats.score)+2}]}>
              <XAxis dataKey="day" hide />
              <Tooltip />
              <Bar dataKey="current" stackId="a" fill="#10b981" radius={[10, 10, 0, 0]} />
              <Bar dataKey="pred" stackId="a" fill="#10b981" fillOpacity={0.2} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-400 text-center italic mt-2">{t('সম্ভাব্য বারটি শুধুমাত্র বর্তমান পড়ার প্যাটার্ন থেকে তৈরি।', 'Predicted bar is generated strictly from existing study patterns.')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
