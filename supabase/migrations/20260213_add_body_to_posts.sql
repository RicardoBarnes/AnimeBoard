-- AnimeBoard - Add body field to posts table
-- Migration: 20260213_add_body_to_posts.sql
-- Created: 2026-02-13
-- Description: Add optional body field to posts for Reddit-style text content

-- ==============================================
-- Add body column to posts table
-- ==============================================

-- Add body field (nullable for backward compatibility)
ALTER TABLE posts
ADD COLUMN body TEXT;

-- Add comment to document the field
COMMENT ON COLUMN posts.body IS 'Optional body/context text for the post (multi-paragraph supported)';

-- ==============================================
-- No additional indexes needed
-- ==============================================
-- Body is primarily for display, not search/filtering in MVP
-- If full-text search is needed later, add GIN index:
-- CREATE INDEX idx_posts_body_fulltext ON posts USING GIN(to_tsvector('english', body));
