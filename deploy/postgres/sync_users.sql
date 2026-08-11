-- Sync demo accounts to match deploy summary (idempotent).
-- Password for all accounts: DEFAULT_USER_PASSWORD from .env (min 12 characters, required).
-- New users copy password_hash from admin.

UPDATE users SET
  username = 'keyperson',
  name = 'Елена Смирнова',
  role = 'key_person',
  email = 'key@logistics.ru'
WHERE username IN ('analyst', 'keyperson') OR id IN ('u_analyst', 'u_key');

UPDATE users SET
  username = 'manager',
  name = 'Дмитрий Соколов',
  role = 'manager',
  email = 'manager@logistics.ru'
WHERE username IN ('dispatcher', 'manager') OR id IN ('u_disp', 'u_mgr');

UPDATE users SET
  username = 'employee',
  name = 'Иван Петров',
  role = 'local_employee',
  email = 'employee@logistics.ru',
  site_id = 'aQOWlcH4hpZYSUfRL1M0marke'
WHERE username IN ('viewer', 'employee') OR id IN ('u_viewer', 'u_local');

INSERT INTO users (id, username, name, role, email, notifications_enabled, password_hash, site_id, assigned_site_ids)
SELECT
  'u_site',
  'sitemanager',
  'Игорь Кузнецов',
  'site_manager',
  'site@logistics.ru',
  true,
  u.password_hash,
  'aQOWlcH4hpZYSUfRL1M0marke',
  '{}'
FROM users u
WHERE u.username = 'admin'
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  site_id = EXCLUDED.site_id,
  password_hash = EXCLUDED.password_hash;

-- Remove duplicate legacy rows if any remain
DELETE FROM users WHERE username IN ('analyst', 'dispatcher', 'viewer');
