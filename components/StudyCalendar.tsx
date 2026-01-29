
import React, { useState, useMemo } from 'react';
import { UserState, StudySession, Reminder } from '../types';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Download, Share2, Plus, Clock, BookOpen, 
  CheckCircle2, AlertCircle, Sparkles, X, 
  Target, Zap, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyCalendarProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ userState, onUpdateState }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showSyncOptions, setShowSyncOptions] = useState(false);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  // Calendar Logic
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long' });

  // Study Data Mapping
  const studyDaysMap = useMemo(() => {
    const map: Record<number, StudySession[]> = {};
    userState.studyHistory.forEach(session => {
      const date = new Date(session.startTime);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const d = date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(session);
      }
    });
    return map;
  }, [userState.studyHistory, month, year]);

  const remindersMap = useMemo(() => {
    const map: Record<number, Reminder[]> = {};
    (userState.reminders || []).forEach(rem => {
      const date = new Date(rem.time);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const d = date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(rem);
      }
    });
    return map;
  }, [userState.reminders, month, year]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HSC Study Tracker//NCTB//EN\n";
    
    userState.studyHistory.forEach(session => {
      const start = new Date(session.startTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const end = new Date(session.endTime || session.startTime + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const subject = userState.subjects.find(s => s.id === session.subjectId)?.name || "Study Session";
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:HSC Study: ${subject}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `DESCRIPTION:Duration: ${formatDuration(session.durationSeconds)}. Mood: ${session.mood}\n`;
      icsContent += "END:VEVENT\n";
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `study_schedule_${month + 1}_${year}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalLink = () => {
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent("HSC Study Session");
    const details = encodeURIComponent("Tracked via HSC Study Tracker");
    return `${baseUrl}&text=${title}&details=${details}`;
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedDayData = selectedDay ? studyDaysMap[selectedDay] || [] : [];
  const selectedDayReminders = selectedDay ? remindersMap[selectedDay] || [] : [];

  const today = new Date();
  const isDateInPast = (d: number) => {
    const target = new Date(year, month, d);
    return target < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand-text-p">{t('পড়াশোনার ক্যালেন্ডার', 'Study Calendar')}</h2>
          <p className="text-brand-text-s text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('তোমার সাফল্যের দিনলিপি', 'Chronicles of your progress')}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowSyncOptions(true)}
             className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl border border-brand-primary/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
           >
             <Share2 size={14} />
             {t('সিঙ্ক করো', 'Sync Device')}
           </button>
           <div className="px-4 py-2 bg-orange-500/10 text-orange-600 rounded-xl border border-orange-500/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
             <Flame size={14} className="animate-pulse" />
             {userState.streaks} {t('দিন', 'Days')}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid Section */}
        <section className="lg:col-span-8 bg-brand-surface rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-brand-text-s/10">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-black text-brand-text-p flex items-center gap-3">
              <CalendarIcon className="text-brand-primary" size={20} />
              {monthName} {year}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-brand-bg rounded-xl transition-all"><ChevronLeft size={20}/></button>
              <button onClick={nextMonth} className="p-2 hover:bg-brand-bg rounded-xl transition-all"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[10px] font-black text-brand-text-s uppercase tracking-widest pb-4">{d}</div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const isStudied = studyDaysMap[day]?.length > 0;
              const hasReminder = remindersMap[day]?.length > 0;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isPast = isDateInPast(day);
              const isSelected = selectedDay === day;

              let glowClass = "";
              if (isStudied) glowClass = "shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
              else if (isPast) glowClass = "bg-rose-500/5 border-rose-500/10 text-rose-300 dark:text-rose-900/50";
              else glowClass = "bg-brand-bg/50 border-transparent text-brand-text-s";

              if (isSelected) glowClass += " border-2 border-brand-primary scale-105 z-10 shadow-lg";

              return (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center transition-all border ${glowClass}`}
                >
                  <span className={`text-xs sm:text-sm font-black ${isToday ? 'text-brand-primary underline decoration-2 underline-offset-4' : ''}`}>{day}</span>
                  {hasReminder && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-sm animate-pulse-slow" />
                  )}
                  {isStudied && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-emerald-500 rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Detail Panel */}
        <section className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-brand-surface rounded-[2.5rem] p-8 border border-brand-text-s/10 shadow-xl h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সেশন বিবরণী', 'Session Details')}</h4>
                  <p className="text-xl font-black text-brand-text-p">{selectedDay} {monthName}</p>
                </div>
                <div className="p-3 bg-brand-bg rounded-2xl text-brand-primary">
                  <Zap size={24} />
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
                {selectedDayData.length > 0 ? selectedDayData.map(session => (
                  <div key={session.id} className="p-4 bg-brand-bg rounded-2xl border border-emerald-500/10 group">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                         {session.isRevision ? 'Revision' : 'Study'}
                       </span>
                       <span className="text-[10px] font-bold text-brand-text-s">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm font-black text-brand-text-p truncate">
                      {userState.subjects.find(s => s.id === session.subjectId)?.name || 'General Study'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                       <div className="flex items-center gap-1 text-[10px] font-bold text-brand-text-s">
                         <Clock size={10} /> {formatDuration(session.durationSeconds)}
                       </div>
                       <div className="flex items-center gap-1 text-[10px] font-bold text-brand-text-s">
                         <Sparkles size={10} className="text-orange-400" /> {session.mood}
                       </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center space-y-3 opacity-30">
                     <AlertCircle size={32} className="mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-widest">{t('পড়াশোনা হয়নি', 'No logs found')}</p>
                  </div>
                )}

                {selectedDayReminders.length > 0 && (
                  <div className="pt-4 border-t border-brand-text-s/10 mt-4 space-y-3">
                    <h5 className="text-[9px] font-black text-brand-text-s uppercase tracking-widest">{t('রিমাইন্ডার', 'Reminders')}</h5>
                    {selectedDayReminders.map(rem => (
                      <div key={rem.id} className="flex items-center gap-3 p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                        <Target size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-brand-text-p truncate">{rem.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => onUpdateState(prev => ({ ...prev, activeTab: 'tracker' } as any))}
                className="mt-8 w-full py-4 bg-brand-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus size={16} />
                {t('পড়া শুরু করো', 'Start Study')}
              </button>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncOptions && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] shadow-2xl border border-brand-text-s/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black text-brand-text-p italic">Sync & Export</h4>
                <button onClick={() => setShowSyncOptions(false)} className="p-2 bg-brand-bg rounded-xl text-brand-text-s"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleExportICS}
                  className="w-full p-6 bg-brand-bg rounded-[2rem] border border-brand-text-s/10 flex items-center gap-5 hover:border-brand-primary transition-all group"
                >
                   <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                      <Download size={24} />
                   </div>
                   <div className="text-left">
                      <p className="font-black text-sm text-brand-text-p">{t('iCal / Outlook এক্সপোর্ট', 'iCal Export')}</p>
                      <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('.ics ফাইল ডাউনলোড করো', 'Download .ics file')}</p>
                   </div>
                </button>

                <a 
                  href={getGoogleCalLink()} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full p-6 bg-brand-bg rounded-[2rem] border border-brand-text-s/10 flex items-center gap-5 hover:border-brand-secondary transition-all group"
                >
                   <div className="w-12 h-12 bg-brand-secondary/10 rounded-2xl flex items-center justify-center text-brand-secondary group-hover:scale-110 transition-transform">
                      <CalendarIcon size={24} />
                   </div>
                   <div className="text-left">
                      <p className="font-black text-sm text-brand-text-p">{t('Google ক্যালেন্ডার', 'Google Calendar')}</p>
                      <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('সরাসরি অ্যাড করো', 'Direct Sync')}</p>
                   </div>
                </a>
              </div>

              <p className="mt-8 text-center text-[9px] font-black uppercase text-brand-text-s tracking-widest opacity-50">
                {t('অফলাইন ব্যবহারের জন্য সিঙ্ক করো', 'Optimized for offline & mobile widgets')}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyCalendar;
