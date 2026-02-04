-- Create admin_settings table for storing configuration like Resend API key
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(admin_id, setting_key)
);

CREATE INDEX idx_admin_settings_admin ON admin_settings(admin_id);
CREATE INDEX idx_admin_settings_key ON admin_settings(setting_key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own settings
CREATE POLICY "Allow admins to view their own settings" 
  ON admin_settings FOR SELECT USING (true);

-- Only admins can update their own settings
CREATE POLICY "Allow admins to update their own settings" 
  ON admin_settings FOR UPDATE USING (true);

-- Only admins can insert settings
CREATE POLICY "Allow admins to insert settings" 
  ON admin_settings FOR INSERT WITH CHECK (true);

-- Add settings to admin_users table for name/other profile info
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
