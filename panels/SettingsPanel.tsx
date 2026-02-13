
import React from 'react';
import { UserState } from '../types';
import Settings from '../components/Settings';

interface SettingsPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onLogout: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ userState, onUpdateState, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <Settings userState={userState} onUpdateState={onUpdateState} onLogout={onLogout} />
    </div>
  );
};

export default SettingsPanel;
