
import React from 'react';
import { UserState } from '../types';
import TestSection from '../components/TestSection';

interface ExamsPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const ExamsPanel: React.FC<ExamsPanelProps> = ({ userState, onUpdateState }) => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      <TestSection 
        userState={userState} 
        onUpdateState={onUpdateState} 
        initialContext={null} 
        clearContext={() => {}} 
      />
    </div>
  );
};

export default ExamsPanel;
