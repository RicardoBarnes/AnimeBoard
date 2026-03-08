-- AnimeBoard MVP - Schema Patch v3
-- Migration: 20260212_patch_schema_v3.sql
-- Created: 2026-02-12
-- Fixes: Comment cascades, vote privacy (RPC), slide_items leaks, removed content interactions, reports structure (safe enum migration)

-- ==============================================
-- 1) FIX COMMENTS PARENT DELETION BEHAVIOR
-- ==============================================
-- Change parent_comment_id FK from CASCADE to SET NULL
-- This preserves replies when parent is deleted

ALTER TABLE comments
    DROP CONSTRAINT IF EXISTS comments_parent_comment_id_fkey,
    ADD CONSTRAINT comments_parent_comment_id_fkey
        FOREIGN KEY (parent_comment_id)
        REFERENCES comments(id)
        ON DELETE SET NULL;

-- ==============================================
-- 2) VOTE PRIVACY - SECURE RPC APPROACH
-- ==============================================
-- Drop the existing public read policy
DROP POLICY IF EXISTS "votes_select_all" ON votes;

-- Users can only see their own votes
CREATE POLICY "votes_select_own" ON votes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can see all votes
CREATE POLICY "votes_select_admin" ON votes
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create SECURITY DEFINER function for public vote counts
-- This bypasses RLS but only returns aggregate data, not individual votes
CREATE OR REPLACE FUNCTION get_vote_counts(p_post_id uuid)
RETURNS TABLE(agree_count bigint, disagree_count bigint, total_votes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE vote_type = 'agree') AS agree_count,
        COUNT(*) FILTER (WHERE vote_type = 'disagree') AS disagree_count,
        COUNT(*) AS total_votes
    FROM votes
    WHERE post_id = p_post_id;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_vote_counts(uuid) TO anon, authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_vote_counts IS 'Returns aggregate vote counts for a post without exposing individual voter identities';

-- ==============================================
-- 3) FIX SLIDE_ITEMS PUBLIC LEAK
-- ==============================================
-- Replace overly permissive policy with proper checks

DROP POLICY IF EXISTS "slide_items_select_public" ON slide_items;

CREATE POLICY "slide_items_select_valid" ON slide_items
    FOR SELECT
    USING (
        -- Slide belongs to a non-removed post
        EXISTS (
            SELECT 1
            FROM slides
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id
            AND posts.removed_at IS NULL
        )
        AND
        -- Referenced image is not removed
        EXISTS (
            SELECT 1
            FROM images
            WHERE images.id = slide_items.image_id
            AND images.removed_at IS NULL
        )
    );

-- ==============================================
-- 4) PREVENT INTERACTIONS ON REMOVED CONTENT
-- ==============================================

-- 4a) VOTES - Cannot vote on removed posts (INSERT + UPDATE)
DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;

CREATE POLICY "votes_insert_on_active_posts" ON votes
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = votes.post_id
            AND posts.removed_at IS NULL
        )
    );

CREATE POLICY "votes_update_on_active_posts" ON votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = votes.post_id
            AND posts.removed_at IS NULL
        )
    );

-- 4b) COMMENTS - Cannot comment on removed posts (INSERT + UPDATE)
DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;

CREATE POLICY "comments_insert_on_active_posts" ON comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = comments.post_id
            AND posts.removed_at IS NULL
        )
    );

CREATE POLICY "comments_update_on_active_posts" ON comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND removed_at IS NULL
        AND
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = comments.post_id
            AND posts.removed_at IS NULL
        )
    );

-- 4c) SLIDES - Cannot add/update slides to/on removed posts (INSERT + UPDATE)
DROP POLICY IF EXISTS "slides_insert_own_post" ON slides;
DROP POLICY IF EXISTS "slides_update_own_post" ON slides;

CREATE POLICY "slides_insert_on_active_posts" ON slides
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = slides.post_id
            AND posts.user_id = auth.uid()
            AND posts.removed_at IS NULL
        )
    );

CREATE POLICY "slides_update_on_active_posts" ON slides
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = slides.post_id
            AND posts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = slides.post_id
            AND posts.user_id = auth.uid()
            AND posts.removed_at IS NULL
        )
    );

-- 4d) SLIDE_ITEMS - Cannot reference removed images or removed posts
DROP POLICY IF EXISTS "slide_items_insert_own" ON slide_items;

CREATE POLICY "slide_items_insert_active_content" ON slide_items
    FOR INSERT
    WITH CHECK (
        -- User owns the slide's post AND post is not removed
        EXISTS (
            SELECT 1 FROM slides
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id
            AND posts.user_id = auth.uid()
            AND posts.removed_at IS NULL
        )
        AND
        -- Referenced image is not removed
        EXISTS (
            SELECT 1 FROM images
            WHERE images.id = slide_items.image_id
            AND images.removed_at IS NULL
        )
    );

-- ==============================================
-- 5) IMPROVE REPORTS STRUCTURE - SAFE ENUM MIGRATION
-- ==============================================

-- 5a) Create new report_reason enum
DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM (
        'copyright',
        'spam',
        'nsfw',
        'harassment',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5b) Add new columns to reports table
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reason_code report_reason DEFAULT 'other'::report_reason NOT NULL,
    ADD COLUMN IF NOT EXISTS reason_text TEXT;

-- 5c) Migrate existing 'reason' data to 'reason_text' safely
-- Only if reason column exists and reason_text is NULL
UPDATE reports
SET reason_text = reason
WHERE reason_text IS NULL
AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'reason'
);

-- Update constraints for reason_text
ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS reason_length,
    ADD CONSTRAINT reason_text_length
    CHECK (reason_text IS NULL OR (char_length(reason_text) >= 10 AND char_length(reason_text) <= 500));

-- 5d) SAFE enum migration for report_status
-- Create new enum type with expanded values
DO $$ BEGIN
    CREATE TYPE report_status_v2 AS ENUM (
        'pending',
        'reviewed',
        'removed',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add temporary column with new enum type
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS status_v2 report_status_v2;

-- Migrate data from old status to new status_v2
-- Map: pending->pending, reviewed->reviewed, dismissed->rejected
UPDATE reports
SET status_v2 = CASE
    WHEN status::text = 'pending' THEN 'pending'::report_status_v2
    WHEN status::text = 'reviewed' THEN 'reviewed'::report_status_v2
    WHEN status::text = 'dismissed' THEN 'rejected'::report_status_v2
    ELSE 'pending'::report_status_v2
END
WHERE status_v2 IS NULL;

-- Make new column NOT NULL with default
ALTER TABLE reports
    ALTER COLUMN status_v2 SET NOT NULL,
    ALTER COLUMN status_v2 SET DEFAULT 'pending'::report_status_v2;

-- Drop old status column (this will NOT cascade to the type)
ALTER TABLE reports DROP COLUMN IF EXISTS status;

-- Rename new column to status
ALTER TABLE reports RENAME COLUMN status_v2 TO status;

-- Now it's safe to drop the old enum type (no columns reference it)
DROP TYPE IF EXISTS report_status;

-- Rename new type to the proper name
ALTER TYPE report_status_v2 RENAME TO report_status;

-- 5e) Drop old 'reason' column after migration
ALTER TABLE reports DROP COLUMN IF EXISTS reason;

-- 5f) Update reports RLS policies for better control

-- Drop existing policies
DROP POLICY IF EXISTS "reports_select_own" ON reports;
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
DROP POLICY IF EXISTS "reports_insert_authenticated" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;
DROP POLICY IF EXISTS "reports_update_admin_only" ON reports;

-- Users can SELECT only their own reports
CREATE POLICY "reports_select_own" ON reports
    FOR SELECT
    USING (auth.uid() = reporter_id);

-- Admins can SELECT all reports
CREATE POLICY "reports_select_admin" ON reports
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can INSERT reports (for their own user_id)
CREATE POLICY "reports_insert_authenticated" ON reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Only admins can UPDATE reports (change status, add notes, etc.)
CREATE POLICY "reports_update_admin_only" ON reports
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ==============================================
-- COMMENTS & DOCUMENTATION
-- ==============================================

COMMENT ON COLUMN reports.reason_code IS 'Standardized reason category for the report';
COMMENT ON COLUMN reports.reason_text IS 'Detailed explanation from the reporter (10-500 chars)';
COMMENT ON TYPE report_reason IS 'Standardized categories for content reports';
COMMENT ON TYPE report_status IS 'Report lifecycle status: pending -> reviewed/removed/rejected';

-- ==============================================
-- VERIFICATION QUERIES (for testing)
-- ==============================================
-- Run these after migration to verify:

-- 1. Check vote counts function works:
-- SELECT * FROM get_vote_counts('some-post-uuid-here');

-- 2. Verify comments FK behavior:
-- SELECT conname, confdeltype FROM pg_constraint WHERE conname = 'comments_parent_comment_id_fkey';
-- Should show 'n' (SET NULL) not 'c' (CASCADE)

-- 3. Check reports enum values:
-- SELECT unnest(enum_range(NULL::report_reason));
-- SELECT unnest(enum_range(NULL::report_status));

-- 4. Verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('votes', 'comments', 'slides', 'slide_items', 'reports') 
-- ORDER BY tablename, policyname;

-- ==============================================
-- END OF PATCH MIGRATION
-- ==============================================
