-- AnimeBoard MVP - Schema Patch v4
-- Migration: 20260212_patch_schema_v4.sql
-- Created: 2026-02-12
-- Hardened production-safe version

-- ==============================================
-- 1) FIX COMMENTS PARENT DELETION BEHAVIOR
-- ==============================================

ALTER TABLE comments
    DROP CONSTRAINT IF EXISTS comments_parent_comment_id_fkey,
    ADD CONSTRAINT comments_parent_comment_id_fkey
        FOREIGN KEY (parent_comment_id)
        REFERENCES comments(id)
        ON DELETE SET NULL;

-- ==============================================
-- 2) VOTE PRIVACY - SECURE RPC APPROACH
-- ==============================================

DROP POLICY IF EXISTS "votes_select_all" ON votes;
DROP POLICY IF EXISTS "votes_select_own" ON votes;
DROP POLICY IF EXISTS "votes_select_admin" ON votes;

CREATE POLICY "votes_select_own" ON votes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "votes_select_admin" ON votes
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION get_vote_counts(p_post_id uuid)
RETURNS TABLE(agree_count bigint, disagree_count bigint, total_votes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

ALTER FUNCTION get_vote_counts(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION get_vote_counts(uuid) TO anon, authenticated;

COMMENT ON FUNCTION get_vote_counts IS 'Returns aggregate vote counts for a post without exposing individual voter identities';

-- ==============================================
-- 3) FIX SLIDE_ITEMS PUBLIC LEAK
-- ==============================================

DROP POLICY IF EXISTS "slide_items_select_public" ON slide_items;
DROP POLICY IF EXISTS "slide_items_select_valid" ON slide_items;

CREATE POLICY "slide_items_select_valid" ON slide_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM slides
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id
            AND posts.removed_at IS NULL
        )
        AND
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

DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
DROP POLICY IF EXISTS "votes_insert_on_active_posts" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;
DROP POLICY IF EXISTS "votes_update_on_active_posts" ON votes;

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

DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
DROP POLICY IF EXISTS "comments_insert_on_active_posts" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "comments_update_on_active_posts" ON comments;

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

DROP POLICY IF EXISTS "slides_insert_own_post" ON slides;
DROP POLICY IF EXISTS "slides_insert_on_active_posts" ON slides;
DROP POLICY IF EXISTS "slides_update_own_post" ON slides;
DROP POLICY IF EXISTS "slides_update_on_active_posts" ON slides;

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

DROP POLICY IF EXISTS "slide_items_insert_own" ON slide_items;
DROP POLICY IF EXISTS "slide_items_insert_active_content" ON slide_items;

CREATE POLICY "slide_items_insert_active_content" ON slide_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM slides
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id
            AND posts.user_id = auth.uid()
            AND posts.removed_at IS NULL
        )
        AND
        EXISTS (
            SELECT 1 FROM images
            WHERE images.id = slide_items.image_id
            AND images.removed_at IS NULL
        )
    );

-- ==============================================
-- 5) IMPROVE REPORTS STRUCTURE - SAFE ENUM MIGRATION
-- ==============================================

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

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reason_code report_reason DEFAULT 'other'::report_reason NOT NULL,
    ADD COLUMN IF NOT EXISTS reason_text TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='reports'
      AND column_name='reason'
  ) THEN
    EXECUTE 'UPDATE public.reports
             SET reason_text = reason
             WHERE reason_text IS NULL';
  END IF;
END $$;

ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS reason_length,
    ADD CONSTRAINT reason_text_length
    CHECK (reason_text IS NULL OR (char_length(reason_text) >= 10 AND char_length(reason_text) <= 500));

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

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS status_v2 report_status_v2;

UPDATE reports
SET status_v2 = CASE
    WHEN status::text = 'pending' THEN 'pending'::report_status_v2
    WHEN status::text = 'reviewed' THEN 'reviewed'::report_status_v2
    WHEN status::text = 'dismissed' THEN 'rejected'::report_status_v2
    ELSE 'pending'::report_status_v2
END
WHERE status_v2 IS NULL;

ALTER TABLE reports
    ALTER COLUMN status_v2 SET NOT NULL,
    ALTER COLUMN status_v2 SET DEFAULT 'pending'::report_status_v2;

ALTER TABLE reports DROP COLUMN IF EXISTS status;

ALTER TABLE reports RENAME COLUMN status_v2 TO status;

DROP TYPE IF EXISTS report_status;

ALTER TYPE report_status_v2 RENAME TO report_status;

ALTER TABLE reports DROP COLUMN IF EXISTS reason;

DROP POLICY IF EXISTS "reports_select_own" ON reports;
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
DROP POLICY IF EXISTS "reports_insert_authenticated" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;
DROP POLICY IF EXISTS "reports_update_admin_only" ON reports;

CREATE POLICY "reports_select_own" ON reports
    FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "reports_select_admin" ON reports
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "reports_insert_authenticated" ON reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin_only" ON reports
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

COMMENT ON COLUMN reports.reason_code IS 'Standardized reason category for the report';
COMMENT ON COLUMN reports.reason_text IS 'Detailed explanation from the reporter (10-500 chars)';
COMMENT ON TYPE report_reason IS 'Standardized categories for content reports';
COMMENT ON TYPE report_status IS 'Report lifecycle status: pending -> reviewed/removed/rejected';
