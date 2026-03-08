-- USERNAME FIX - SQL Editor Safe Version
-- Run this in Supabase SQL Editor to update the username handling function
-- This ONLY updates the function, not the trigger (which should already exist)

-- ==============================================
-- UPDATE THE PROFILE CREATION FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_username TEXT;
BEGIN
    -- Get username from raw_user_meta_data
    -- This is where Supabase stores the data from options.data during signup
    v_username := new.raw_user_meta_data->>'username';
    
    -- CRITICAL: Error if no username found - never auto-generate
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

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile with username from signup metadata. Raises error if username is missing - never auto-generates.';

-- ==============================================
-- VERIFY THE TRIGGER EXISTS
-- ==============================================

-- Check if trigger already exists (it should from previous migration)
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
            AND event_object_table = 'users'
            AND trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger "on_auth_user_created" already exists - function updated successfully!';
    ELSE
        RAISE WARNING '⚠ Trigger "on_auth_user_created" does NOT exist! You need to create it via Dashboard → Database → Triggers';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================

-- Run this to check existing profiles
SELECT 
    p.id,
    p.username,
    p.created_at,
    CASE 
        WHEN p.username LIKE 'user_%' THEN '⚠️ AUTO-GENERATED (OLD)'
        ELSE '✓ USER-CHOSEN (CORRECT)'
    END as status,
    au.raw_user_meta_data->>'username' as metadata_username,
    au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;
