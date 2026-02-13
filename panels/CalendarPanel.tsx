
import React from 'react';
import { UserState } from '../types';
import StudyCalendar from '../components/StudyCalendar';
import { useNavigate } from 'react-router-dom';

interface CalendarPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ userState, onUpdateState }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      <StudyCalendar 
        userState={userState} 
        onUpdateState={onUpdateState} 
        onTabChange={(tab) => navigate(`/app/${tab}`)} 
      />
    </div>
  );
};

export default CalendarPanel;
