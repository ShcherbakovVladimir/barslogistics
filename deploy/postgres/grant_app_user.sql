-- Run once as postgres superuser when app user cannot ALTER tables:
--   sudo -u postgres psql -d barslogistics -f deploy/postgres/grant_app_user.sql
-- Or: npm run db:fix-ownership

DO $$
DECLARE
  app_user TEXT := current_setting('barslogistics.app_user', true);
  r RECORD;
BEGIN
  IF app_user IS NULL OR app_user = '' THEN
    app_user := 'barslogistics';
  END IF;

  EXECUTE format('GRANT ALL ON SCHEMA public TO %I', app_user);
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I', app_user);
  EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I', app_user);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', app_user);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', app_user);

  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', r.tablename, app_user);
  END LOOP;

  FOR r IN
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO %I', r.sequence_name, app_user);
  END LOOP;
END $$;
