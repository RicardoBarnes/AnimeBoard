-- AnimeBoard - User Profiles Enhancement
-- Migration: 20260216_add_user_profiles.sql
-- Created: 2026-02-16
-- Adds bio field and user statistics function

-- ==============================================
-- 1) ADD BIO FIELD TO PROFILES
-- ==============================================

-- Add bio column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Drop constraint if exists, then add it (makes migration idempotent)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS bio_length;
ALTER TABLE profiles
ADD CONSTRAINT bio_length 
CHECK (bio IS NULL OR (char_length(bio) >= 1 AND char_length(bio) <= 160));

COMMENT ON COLUMN profiles.bio IS 'Optional user bio (1-160 characters)';

-- ==============================================
-- 2) USER STATISTICS FUNCTION
-- ==============================================

-- Function to get user statistics (posts, votes received)
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE(
    post_count bigint,
    agree_votes_received bigint,
    disagree_votes_received bigint,
    total_votes_received bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id) AS post_count,
        COALESCE(SUM(CASE WHEN v.vote_type = 'agree' THEN 1 ELSE 0 END), 0) AS agree_votes_received,
        COALESCE(SUM(CASE WHEN v.vote_type = 'disagree' THEN 1 ELSE 0 END), 0) AS disagree_votes_received,
        COUNT(v.id) AS total_votes_received
    FROM posts p
    LEFT JOIN votes v ON v.post_id = p.id
    WHERE p.user_id = p_user_id
    AND p.removed_at IS NULL
    GROUP BY p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_stats(uuid) TO anon, authenticated;

COMMENT ON FUNCTION get_user_stats IS 'Returns user statistics: post count and votes received (agree/disagree/total)';

-- ==============================================
-- END OF MIGRATION
-- ==============================================
