
-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'editor')),
  is_active boolean DEFAULT true,
  granted_by uuid REFERENCES admin_users(id),
  granted_at timestamptz DEFAULT now(),
  last_login timestamptz,
  permissions jsonb DEFAULT '{"can_publish": true, "can_delete": true, "can_manage_admins": false}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- 2. Audit Logging
CREATE TABLE IF NOT EXISTS cms_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 3. Security Functions
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Admins can view all pages" ON cms_pages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage pages" ON cms_pages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Super admins manage admins" ON admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
);
