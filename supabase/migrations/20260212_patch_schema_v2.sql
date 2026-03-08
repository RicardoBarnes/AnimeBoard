-- AnimeBoard MVP - Schema Patch v2
-- Migration: 20260212_patch_schema_v2.sql
-- Created: 2026-02-12
-- Fixes: Comment cascades, vote privacy, slide_items leaks, removed content interactions, reports structure

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
-- 2) VOTE PRIVACY - REMOVE PUBLIC READS
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

-- Create a secure view for public vote counts
CREATE OR REPLACE VIEW vote_counts AS
SELECT
    post_id,
    COUNT(*) FILTER (WHERE vote_type = 'agree') AS agree_count,
    COUNT(*) FILTER (WHERE vote_type = 'disagree') AS disagree_count,
    COUNT(*) AS total_votes
FROM votes
GROUP BY post_id;

-- Grant public read access to the view
GRANT SELECT ON vote_counts TO authenticated, anon;

-- Add helpful comment
COMMENT ON VIEW vote_counts IS 'Public view of vote counts per post without exposing individual votes';

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

-- 4a) VOTES - Cannot vote on removed posts
DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;

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

-- 4b) COMMENTS - Cannot comment on removed posts
DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;

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

-- 4c) SLIDES - Cannot add slides to removed posts
DROP POLICY IF EXISTS "slides_insert_own_post" ON slides;

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

-- 4d) SLIDE_ITEMS - Cannot reference removed images
DROP POLICY IF EXISTS "slide_items_insert_own" ON slide_items;

CREATE POLICY "slide_items_insert_active_images" ON slide_items
    FOR INSERT
    WITH CHECK (
        -- User owns the slide's post
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
-- 5) IMPROVE REPORTS STRUCTURE
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

-- 5b) Create new report_status enum with expanded values
-- Postgres doesn't allow ALTER TYPE in transactions, so we create new and migrate

-- Create new enum type
DO $$ BEGIN
    CREATE TYPE report_status_new AS ENUM (
        'pending',
        'reviewed',
        'removed',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to reports table
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reason_code report_reason DEFAULT 'other' NOT NULL,
    ADD COLUMN IF NOT EXISTS reason_text TEXT;

-- Migrate existing 'reason' data to 'reason_text' if column doesn't exist yet
DO $$ BEGIN
    -- Check if old 'reason' column exists and new 'reason_text' is empty
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reports' AND column_name = 'reason'
    ) THEN
        -- Copy data from reason to reason_text
        UPDATE reports SET reason_text = reason WHERE reason_text IS NULL;
    END IF;
END $$;

-- Update constraints for reason_text
ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS reason_length;

ALTER TABLE reports
    ADD CONSTRAINT reason_text_length
    CHECK (reason_text IS NULL OR (char_length(reason_text) >= 10 AND char_length(reason_text) <= 500));

-- Migrate status column to new enum
-- Step 1: Add temporary column with new enum type
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS status_new report_status_new;

-- Step 2: Migrate data (map old values to new ones)
UPDATE reports
SET status_new = CASE
    WHEN status::text = 'pending' THEN 'pending'::report_status_new
    WHEN status::text = 'reviewed' THEN 'reviewed'::report_status_new
    WHEN status::text = 'dismissed' THEN 'rejected'::report_status_new
    ELSE 'pending'::report_status_new
END
WHERE status_new IS NULL;

-- Step 3: Drop old column and rename new one
ALTER TABLE reports
    DROP COLUMN IF EXISTS status,
    ALTER COLUMN status_new SET NOT NULL,
    ALTER COLUMN status_new SET DEFAULT 'pending'::report_status_new;

-- Rename the column
ALTER TABLE reports
    RENAME COLUMN status_new TO status;

-- Clean up old enum type (do this last, after column is migrated)
DROP TYPE IF EXISTS report_status CASCADE;

-- Rename new type to proper name
ALTER TYPE report_status_new RENAME TO report_status;

-- Drop old 'reason' column now that data is migrated
ALTER TABLE reports
    DROP COLUMN IF EXISTS reason;

-- 5c) Update reports RLS policies for better control

-- Drop existing policies
DROP POLICY IF EXISTS "reports_select_own" ON reports;
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
DROP POLICY IF EXISTS "reports_insert_authenticated" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;

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
COMMENT ON COLUMN reports.reason_text IS 'Detailed explanation from the reporter (optional additional context)';
COMMENT ON TYPE report_reason IS 'Standardized categories for content reports';
COMMENT ON TYPE report_status IS 'Report lifecycle status: pending -> reviewed/removed/rejected';

-- ==============================================
-- VERIFICATION QUERIES (for testing)
-- ==============================================
-- Run these after migration to verify:

-- 1. Check vote_counts view works:
-- SELECT * FROM vote_counts LIMIT 5;

-- 2. Verify comments FK behavior:
-- SELECT conname, confdeltype FROM pg_constraint WHERE conname = 'comments_parent_comment_id_fkey';
-- Should show 'n' (SET NULL) not 'c' (CASCADE)

-- 3. Check reports enum values:
-- SELECT unnest(enum_range(NULL::report_reason));
-- SELECT unnest(enum_range(NULL::report_status));

-- 4. Verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('votes', 'comments', 'slides', 'slide_items', 'reports') ORDER BY tablename, policyname;

-- ==============================================
-- END OF PATCH MIGRATION
-- ==============================================
