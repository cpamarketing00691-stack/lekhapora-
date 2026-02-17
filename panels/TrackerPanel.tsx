import React, { memo } from 'react';
import Tracker from '../components/Tracker';

const TrackerPanel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <Tracker />
    </div>
  );
};

export default memo(TrackerPanel);