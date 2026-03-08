-- AnimeBoard MVP - Initial Database Schema
-- Migration: 20260212_initial_schema.sql
-- Created: 2026-02-12

-- ==============================================
-- EXTENSIONS
-- ==============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- ENUMS
-- ==============================================

-- User roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Slide types
CREATE TYPE slide_type AS ENUM ('single', 'collage');

-- Vote types
CREATE TYPE vote_type AS ENUM ('agree', 'disagree');

-- Vote section for comments
CREATE TYPE vote_section AS ENUM ('agree', 'disagree');

-- Report types
CREATE TYPE report_type AS ENUM ('post', 'image', 'comment');

-- Report status
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');

-- Collage template types
CREATE TYPE template_type AS ENUM ('2-grid', '3-grid', '2x2', 'vertical-stack');

-- ==============================================
-- TABLE: profiles
-- ==============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ==============================================
-- TABLE: images
-- ==============================================

CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    character_name TEXT,
    series_name TEXT,
    tags TEXT[] DEFAULT '{}',
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880) -- 5MB max
);

-- Indexes for search and filtering
CREATE INDEX idx_images_uploader ON images(uploader_id);
CREATE INDEX idx_images_character ON images(character_name) WHERE character_name IS NOT NULL;
CREATE INDEX idx_images_series ON images(series_name) WHERE series_name IS NOT NULL;
CREATE INDEX idx_images_tags ON images USING GIN(tags);
CREATE INDEX idx_images_created ON images(created_at DESC);
CREATE INDEX idx_images_not_removed ON images(removed_at) WHERE removed_at IS NULL;

-- ==============================================
-- TABLE: posts
-- ==============================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200)
);

-- Indexes for posts
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_not_removed ON posts(removed_at) WHERE removed_at IS NULL;

-- ==============================================
-- TABLE: slides
-- ==============================================

CREATE TABLE slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    slide_order INTEGER NOT NULL,
    slide_type slide_type NOT NULL,
    
    -- For single slides
    single_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    
    -- For collage slides (recipe stored as JSON)
    collage_recipe JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_slide_order CHECK (slide_order >= 0 AND slide_order < 10),
    CONSTRAINT single_has_image CHECK (
        (slide_type = 'single' AND single_image_id IS NOT NULL AND collage_recipe IS NULL) OR
        (slide_type = 'collage' AND single_image_id IS NULL AND collage_recipe IS NOT NULL)
    ),
    CONSTRAINT unique_slide_order UNIQUE (post_id, slide_order)
);

-- Indexes for slides
CREATE INDEX idx_slides_post ON slides(post_id, slide_order);
CREATE INDEX idx_slides_single_image ON slides(single_image_id) WHERE single_image_id IS NOT NULL;

-- ==============================================
-- TABLE: slide_items
-- ==============================================
-- This table tracks which images are used in collage slides
-- for referential integrity and analytics

CREATE TABLE slide_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    
    CONSTRAINT unique_slide_frame UNIQUE (slide_id, frame_index)
);

-- Indexes for slide_items
CREATE INDEX idx_slide_items_slide ON slide_items(slide_id);
CREATE INDEX idx_slide_items_image ON slide_items(image_id);

-- ==============================================
-- TABLE: votes
-- ==============================================

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_vote UNIQUE (post_id, user_id)
);

-- Indexes for votes
CREATE INDEX idx_votes_post ON votes(post_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- ==============================================
-- TABLE: comments
-- ==============================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    vote_section vote_section NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- Indexes for comments
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_vote_section ON comments(post_id, vote_section);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_not_removed ON comments(removed_at) WHERE removed_at IS NULL;

-- ==============================================
-- TABLE: reports
-- ==============================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    
    -- Polymorphic reference (only one should be set)
    reported_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    reported_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    reported_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    
    reason TEXT NOT NULL,
    status report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT reason_length CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500),
    CONSTRAINT one_reported_item CHECK (
        (report_type = 'post' AND reported_post_id IS NOT NULL AND reported_image_id IS NULL AND reported_comment_id IS NULL) OR
        (report_type = 'image' AND reported_post_id IS NULL AND reported_image_id IS NOT NULL AND reported_comment_id IS NULL) OR
        (report_type = 'comment' AND reported_post_id IS NULL AND reported_image_id IS NULL AND reported_comment_id IS NOT NULL)
    )
);

-- Indexes for reports
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_post ON reports(reported_post_id) WHERE reported_post_id IS NOT NULL;
CREATE INDEX idx_reports_image ON reports(reported_image_id) WHERE reported_image_id IS NOT NULL;
CREATE INDEX idx_reports_comment ON reports(reported_comment_id) WHERE reported_comment_id IS NOT NULL;
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Auto-update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for posts
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for votes
CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for comments
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- PROFILES
-- ---------------------------------------------

-- Public read access to all profiles
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT
    USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- ---------------------------------------------
-- IMAGES
-- ---------------------------------------------

-- Public read non-removed images
CREATE POLICY "images_select_not_removed" ON images
    FOR SELECT
    USING (removed_at IS NULL);

-- Admins can view all images
CREATE POLICY "images_select_admin" ON images
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can insert images
CREATE POLICY "images_insert_authenticated" ON images
    FOR INSERT
    WITH CHECK (auth.uid() = uploader_id);

-- Users can update their own images (metadata only)
CREATE POLICY "images_update_own" ON images
    FOR UPDATE
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id AND removed_at IS NULL);

-- Admins can soft-remove images
CREATE POLICY "images_update_admin_remove" ON images
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------
-- POSTS
-- ---------------------------------------------

-- Public read non-removed posts
CREATE POLICY "posts_select_not_removed" ON posts
    FOR SELECT
    USING (removed_at IS NULL);

-- Admins can view all posts
CREATE POLICY "posts_select_admin" ON posts
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can create posts
CREATE POLICY "posts_insert_authenticated" ON posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "posts_update_own" ON posts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND removed_at IS NULL);

-- Users can delete their own posts
CREATE POLICY "posts_delete_own" ON posts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can soft-remove posts
CREATE POLICY "posts_update_admin_remove" ON posts
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------
-- SLIDES
-- ---------------------------------------------

-- Public read slides of non-removed posts
CREATE POLICY "slides_select_public" ON slides
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = slides.post_id 
            AND posts.removed_at IS NULL
        )
    );

-- Users can insert slides for their own posts
CREATE POLICY "slides_insert_own_post" ON slides
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = slides.post_id 
            AND posts.user_id = auth.uid()
        )
    );

-- Users can update slides for their own posts
CREATE POLICY "slides_update_own_post" ON slides
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = slides.post_id 
            AND posts.user_id = auth.uid()
        )
    );

-- Users can delete slides for their own posts
CREATE POLICY "slides_delete_own_post" ON slides
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = slides.post_id 
            AND posts.user_id = auth.uid()
        )
    );

-- ---------------------------------------------
-- SLIDE_ITEMS
-- ---------------------------------------------

-- Public read slide_items
CREATE POLICY "slide_items_select_public" ON slide_items
    FOR SELECT
    USING (true);

-- Users can insert slide_items for their own slides
CREATE POLICY "slide_items_insert_own" ON slide_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM slides 
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id 
            AND posts.user_id = auth.uid()
        )
    );

-- Users can delete slide_items for their own slides
CREATE POLICY "slide_items_delete_own" ON slide_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM slides 
            JOIN posts ON posts.id = slides.post_id
            WHERE slides.id = slide_items.slide_id 
            AND posts.user_id = auth.uid()
        )
    );

-- ---------------------------------------------
-- VOTES
-- ---------------------------------------------

-- Public read all votes
CREATE POLICY "votes_select_all" ON votes
    FOR SELECT
    USING (true);

-- Authenticated users can insert votes
CREATE POLICY "votes_insert_authenticated" ON votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes (for toggle)
CREATE POLICY "votes_update_own" ON votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "votes_delete_own" ON votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------------------------------------
-- COMMENTS
-- ---------------------------------------------

-- Public read non-removed comments
CREATE POLICY "comments_select_not_removed" ON comments
    FOR SELECT
    USING (removed_at IS NULL);

-- Admins can view all comments
CREATE POLICY "comments_select_admin" ON comments
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can insert comments
CREATE POLICY "comments_insert_authenticated" ON comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "comments_update_own" ON comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND removed_at IS NULL);

-- Admins can soft-remove comments
CREATE POLICY "comments_update_admin_remove" ON comments
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------
-- REPORTS
-- ---------------------------------------------

-- Users can view their own reports
CREATE POLICY "reports_select_own" ON reports
    FOR SELECT
    USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "reports_select_admin" ON reports
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can insert reports
CREATE POLICY "reports_insert_authenticated" ON reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Admins can update reports (review them)
CREATE POLICY "reports_update_admin" ON reports
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ==============================================
-- STORAGE BUCKET POLICIES
-- ==============================================
-- Note: These need to be configured via Supabase Dashboard or API
-- Bucket name: "user-uploads"
-- Path structure: {user_id}/{image_id}.{ext}

-- Example policies (configure in Supabase Dashboard):
-- 1. SELECT: Public read for all files
-- 2. INSERT: Authenticated users can upload to their own folder (user-uploads/{user_id}/*)
-- 3. DELETE: Users can delete from their own folder OR admins can delete any

-- ==============================================
-- INITIAL DATA (Optional)
-- ==============================================

-- Create a sample admin user (update with real user ID after signup)
-- INSERT INTO profiles (id, username, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin', 'admin');

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE profiles IS 'Extended user profile data linked to auth.users';
COMMENT ON TABLE images IS 'User-uploaded image metadata and storage references';
COMMENT ON TABLE posts IS 'User-created posts containing multiple slides';
COMMENT ON TABLE slides IS 'Individual slides within a post (single image or collage)';
COMMENT ON TABLE slide_items IS 'Tracks images used in collage slides';
COMMENT ON TABLE votes IS 'Agree/Disagree votes on posts';
COMMENT ON TABLE comments IS 'Threaded comments on posts, organized by vote section';
COMMENT ON TABLE reports IS 'User reports for content moderation';

COMMENT ON TYPE slide_type IS 'Type of slide: single image or collage layout';
COMMENT ON TYPE vote_type IS 'Vote direction: agree or disagree';
COMMENT ON TYPE vote_section IS 'Comment section: agree or disagree side';
COMMENT ON TYPE template_type IS 'Collage layout template types';

-- ==============================================
-- END OF MIGRATION
-- ==============================================
