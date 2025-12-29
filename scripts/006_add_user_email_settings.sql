-- Create user_email_settings table to store user's email configuration
CREATE TABLE IF NOT EXISTS user_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_provider VARCHAR(50) NOT NULL DEFAULT 'gmail', -- 'gmail', 'outlook', 'smtp'
  email_address VARCHAR(255) NOT NULL,
  email_password TEXT NOT NULL, -- Encrypted in production
  smtp_host VARCHAR(255), -- For custom SMTP
  smtp_port INTEGER DEFAULT 587, -- For custom SMTP
  smtp_secure BOOLEAN DEFAULT false, -- For custom SMTP
  from_name VARCHAR(255), -- Display name for emails
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email settings"
  ON user_email_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings"
  ON user_email_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings"
  ON user_email_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings"
  ON user_email_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_email_settings_updated_at
  BEFORE UPDATE ON user_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_email_settings_updated_at();
