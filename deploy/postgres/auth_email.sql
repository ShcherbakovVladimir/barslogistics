-- Auth email confirmation, password reset tokens, account approval status.
-- Default email_verified=TRUE so existing/admin-created accounts stay usable.
-- Self-registration explicitly inserts email_verified=FALSE and account_status='pending'.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirm_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirm_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (LOWER(email))
  WHERE email IS NOT NULL AND email <> '';
