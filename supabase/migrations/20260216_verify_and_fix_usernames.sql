-- AnimeBoard - Verify and Fix Username System
-- Migration: 20260216_verify_and_fix_usernames.sql
-- Created: 2026-02-16
-- Ensures usernames are properly captured from signup and never randomly assigned

-- ==============================================
-- 1) VERIFY PROFILES TABLE SCHEMA
-- ==============================================

-- Check if profiles table exists and has username column
DO $$
BEGIN
    -- Check if profiles table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'profiles table does not exist!';
    END IF;

    -- Check if username column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) THEN
        RAISE EXCEPTION 'username column does not exist in profiles table!';
    END IF;

    RAISE NOTICE 'profiles table and username column verified ✓';
END $$;

-- ==============================================
-- 2) FIX PROFILE CREATION TRIGGER
-- ==============================================

-- The issue: signup stores username in user_metadata (via options.data)
-- But the trigger was looking at raw_user_meta_data
-- Both should work, but we need to check the correct field

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_username TEXT;
BEGIN
    -- Try to get username from raw_user_meta_data (this is the correct field)
    -- Supabase stores options.data in raw_user_meta_data
    v_username := new.raw_user_meta_data->>'username';
    
    -- If no username found, raise an error - we should NEVER auto-generate
    IF v_username IS NULL OR v_username = '' THEN
        RAISE EXCEPTION 'Username is required during signup. No username found in user metadata for user %', new.id;
    END IF;

    -- Insert the profile with the username from metadata
    INSERT INTO public.profiles (id, username, role)
    VALUES (
        new.id,
        v_username,
        'user'
    );
    
    RAISE NOTICE 'Created profile for user % with username: %', new.id, v_username;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile with username from signup metadata. Raises error if username is missing.';

-- ==============================================
-- 3) ENSURE TRIGGER EXISTS
-- ==============================================

-- Drop and recreate trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates profile automatically when user signs up';

-- ==============================================
-- 4) VERIFY USERNAME CONSTRAINTS
-- ==============================================

-- Ensure username has proper constraints
DO $$
BEGIN
    -- Check if username is NOT NULL
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
        AND is_nullable = 'YES'
    ) THEN
        RAISE WARNING 'username column allows NULL values - this should be fixed';
        -- We can't easily change this in a migration if there are existing NULL values
        -- But new users should always have usernames with our updated trigger
    END IF;

    -- Verify UNIQUE constraint exists
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'profiles_username_key'
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        RAISE WARNING 'username column does not have UNIQUE constraint';
    ELSE
        RAISE NOTICE 'username UNIQUE constraint verified ✓';
    END IF;

    -- Verify length constraint exists
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'username_length'
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        RAISE WARNING 'username length constraint missing';
    ELSE
        RAISE NOTICE 'username length constraint verified ✓';
    END IF;
END $$;

-- ==============================================
-- 5) VERIFICATION QUERY
-- ==============================================

-- Query to check existing profiles and their usernames
-- Run this after migration to verify
-- SELECT 
--     id,
--     username,
--     created_at,
--     CASE 
--         WHEN username LIKE 'user_%' THEN 'AUTO-GENERATED (BAD)'
--         ELSE 'USER-CHOSEN (GOOD)'
--     END as username_source
-- FROM profiles
-- ORDER BY created_at DESC;

-- ==============================================
-- END OF MIGRATION
-- ==============================================
