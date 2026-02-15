
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AdminUser, AdminPermissions } from '../types';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);

  const checkAdminStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setIsAdmin(false);
        setAdmin(null);
        return;
      }

      // Strictly query the admin_users table which is protected by RLS
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, email, role, permissions, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        setIsAdmin(false);
        setAdmin(null);
        return;
      }

      setIsAdmin(true);
      setAdmin({
        id: user.id,
        user_id: adminData.user_id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions
      });
      setPermissions(adminData.permissions);
      
      // Log login event for audit
      await supabase.from('cms_audit_log').insert({
        admin_user_id: user.id,
        action: 'verify_session',
        entity_type: 'admin',
        entity_id: user.id
      });

    } catch (err) {
      console.error('Admin verification error:', err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdmin(null);
  };

  return { admin, isAdmin, isLoading, permissions, logout, refetch: checkAdminStatus };
};
