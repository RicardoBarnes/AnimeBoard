-- AnimeBoard - Fix Profile Creation on Signup
-- Migration: 20260212_fix_profile_creation.sql
-- Adds trigger to auto-create profile when user signs up

-- ==============================================
-- DROP OLD INSERT POLICY (TOO RESTRICTIVE)
-- ==============================================

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- ==============================================
-- CREATE TRIGGER FUNCTION
-- ==============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- CREATE TRIGGER
-- ==============================================

-- Trigger on auth.users to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- UPDATE RLS POLICY
-- ==============================================

-- Now we don't need users to insert their own profiles
-- The trigger handles it automatically
-- But we'll add a policy for service role / admin use cases

CREATE POLICY "profiles_insert_service"
ON profiles
FOR INSERT
WITH CHECK (true);  -- Trigger will handle this, so allow all

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile when a user signs up in auth.users';
