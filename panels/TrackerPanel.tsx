
import React from 'react';
import { UserState } from '../types';
import Tracker from '../components/Tracker';

interface TrackerPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const TrackerPanel: React.FC<TrackerPanelProps> = ({ userState, onUpdateState }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <Tracker userState={userState} onUpdateState={onUpdateState} />
    </div>
  );
};

export default TrackerPanel;
