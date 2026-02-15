
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<Props> = ({ children }) => {
  const { isAdmin, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg gap-4">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-text-s animate-pulse">
          Authenticating Admin Secure Protocol
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    // If not admin, we force them out to the standard login or landing
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
