
import React, { useMemo } from 'react';
import { UserState } from '../types';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieIcon, Zap } from 'lucide-react';

interface AnalyticsPanelProps {
  userState: UserState;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(d => ({ name: d, hours: 0 }));
    
    userState.studyHistory.forEach(s => {
      const date = new Date(s.startTime);
      const dayIdx = date.getDay();
      data[dayIdx].hours += s.durationSeconds / 3600;
    });

    return data;
  }, [userState.studyHistory]);

  const subjectDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    userState.studyHistory.forEach(s => {
      const subName = userState.subjects.find(sub => sub.id === s.subjectId)?.name || 'General';
      map[subName] = (map[subName] || 0) + (s.durationSeconds / 3600);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [userState.studyHistory, userState.subjects]);

  const COLORS = ['#5B7DBE', '#7EAE9E', '#A393EB', '#F59E0B', '#EF4444', '#10B981'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{t('পড়াশোনার এনালাইটিক্স', 'Study Analytics')}</h2>
           <p className="text-brand-text-s font-medium text-sm tracking-tight">{t('পড়াশোনার গাণিতিক বিশ্লেষণ।', 'Data-driven insights.')}</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 flex items-center gap-3">
             <Zap size={20} className="animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest">{t('স্মার্ট স্ক্যান', 'Deep Insights')}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 bg-brand-surface rounded-[3.5rem] p-10 border border-brand-text-s/10 shadow-sm space-y-10">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-3"><Activity className="text-brand-primary"/> {t('সাপ্তাহিক ধারাবাহিকতা', 'Weekly Consistency')}</h3>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={weeklyData}>
                    <defs>
                       <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: 'rgb(var(--brand-text-s))'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                      cursor={{stroke: 'var(--brand-primary)', strokeWidth: 2}}
                    />
                    <Area type="monotone" dataKey="hours" stroke="var(--brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" isAnimationActive={false} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>

        <section className="lg:col-span-4 bg-brand-surface rounded-[3.5rem] p-10 border border-brand-text-s/10 shadow-sm space-y-10">
           <h3 className="text-xl font-black flex items-center gap-3"><PieIcon className="text-brand-primary"/> {t('বিষয়ভিত্তিক ভারসাম্য', 'Subject Balance')}</h3>
           <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={subjectDistribution}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-2">
              {subjectDistribution.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                      <span className="text-[10px] font-bold text-brand-text-s uppercase">{s.name}</span>
                   </div>
                   <span className="text-xs font-black text-brand-text-p">{s.value.toFixed(1)}h</span>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
