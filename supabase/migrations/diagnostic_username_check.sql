-- Username System Diagnostic Script
-- Run this in the Supabase SQL Editor to check the current state of usernames

-- ==============================================
-- 1) CHECK PROFILES TABLE STRUCTURE
-- ==============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('id', 'username', 'avatar_url', 'bio', 'role')
ORDER BY ordinal_position;

-- ==============================================
-- 2) CHECK EXISTING PROFILES AND USERNAMES
-- ==============================================

SELECT 
    p.id,
    p.username,
    p.created_at,
    CASE 
        WHEN p.username LIKE 'user_%' THEN '⚠️ AUTO-GENERATED'
        ELSE '✓ USER-CHOSEN'
    END as username_type,
    a.raw_user_meta_data->>'username' as metadata_username,
    a.email
FROM profiles p
LEFT JOIN auth.users a ON a.id = p.id
ORDER BY p.created_at DESC
LIMIT 20;

-- ==============================================
-- 3) CHECK FOR DUPLICATE USERNAMES
-- ==============================================

SELECT 
    username,
    COUNT(*) as count
FROM profiles
GROUP BY username
HAVING COUNT(*) > 1;

-- ==============================================
-- 4) CHECK TRIGGER FUNCTION
-- ==============================================

SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ==============================================
-- 5) CHECK TRIGGER STATUS
-- ==============================================

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';

-- ==============================================
-- 6) CHECK USERNAME CONSTRAINTS
-- ==============================================

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%username%';
