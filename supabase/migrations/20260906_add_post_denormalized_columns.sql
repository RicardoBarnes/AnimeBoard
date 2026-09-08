-- AnimeBoard Performance Uplift - Denormalized post columns
-- Migration: 20260906_add_post_denormalized_columns.sql
-- Created: 2026-09-06
--
-- Eliminates N+1 query fan-out on the home feed/trending sections by
-- caching a vote count and cover image directly on `posts`, instead of
-- computing them per-post at read time.

-- ==============================================
-- 1) NEW COLUMNS
-- ==============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ==============================================
-- 2) BACKFILL EXISTING ROWS
-- ==============================================

UPDATE posts p
SET vote_count = (
    SELECT count(*) FROM votes WHERE votes.post_id = p.id
);

UPDATE posts p
SET cover_image_url = COALESCE(
    (
        SELECT i.public_url
        FROM slides s
        JOIN images i ON i.id = s.single_image_id
        WHERE s.post_id = p.id AND s.slide_order = 0 AND s.slide_type = 'single'
    ),
    (
        SELECT i.public_url
        FROM slides s
        JOIN slide_items si ON si.slide_id = s.id
        JOIN images i ON i.id = si.image_id
        WHERE s.post_id = p.id AND s.slide_order = 0 AND s.slide_type = 'collage' AND si.frame_index = 0
    )
)
WHERE cover_image_url IS NULL;

-- ==============================================
-- 3) TRIGGER: KEEP vote_count IN SYNC
-- ==============================================
-- SECURITY DEFINER is required because a voter is rarely the post's owner,
-- and the `posts_update_own` RLS policy would otherwise block their vote
-- from updating another user's post row. Mirrors the get_vote_counts()
-- pattern already used in 20260212_patch_schema_v4.sql.

CREATE OR REPLACE FUNCTION sync_post_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

ALTER FUNCTION sync_post_vote_count() OWNER TO postgres;

DROP TRIGGER IF EXISTS votes_sync_post_vote_count ON votes;

CREATE TRIGGER votes_sync_post_vote_count
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION sync_post_vote_count();

COMMENT ON FUNCTION sync_post_vote_count IS 'Keeps posts.vote_count in sync so trending sort avoids a per-post COUNT(*) query';

-- ==============================================
-- 4) INDEX FOR TRENDING SORT
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON posts(vote_count DESC) WHERE removed_at IS NULL;

COMMENT ON COLUMN posts.vote_count IS 'Denormalized count of votes, maintained by votes_sync_post_vote_count trigger';
COMMENT ON COLUMN posts.cover_image_url IS 'Denormalized public_url of slide_order=0''s image, set at post-creation time';
