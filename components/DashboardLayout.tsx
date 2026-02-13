
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { UserState } from '../types';

interface DashboardLayoutProps {
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userState, setUserState }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to tab ID for the existing Layout component
  const getActiveTab = () => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  };

  const handleTabChange = (tabId: string) => {
    navigate(`/${tabId}`);
  };

  return (
    <Layout 
      userProfile={userState.profile!} 
      activeTab={getActiveTab()} 
      onTabChange={handleTabChange} 
      language={userState.language} 
      userState={userState}
    >
      <Outlet />
    </Layout>
  );
};

export default DashboardLayout;
