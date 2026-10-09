-- AnimeBoard - fix "Database error deleting user" for accounts that have
-- filed a single-exhibit case
-- Migration: 20261008_fix_single_slide_image_fk_cascade.sql
-- Created: 2026-10-08
--
-- Actual root cause (found by the Playwright e2e suite; the 20260908 vote
-- trigger migrations were chasing the wrong error):
--
--   slides.single_image_id REFERENCES images(id) ON DELETE SET NULL
--   CONSTRAINT single_has_image CHECK (slide_type = 'single' AND single_image_id IS NOT NULL ...)
--
-- Deleting a user cascades to their images. For every single slide showing
-- one of those images, Postgres tries to SET single_image_id = NULL, which
-- violates single_has_image, so the whole account deletion is rolled back:
--
--   new row for relation "slides" violates check constraint "single_has_image"
--
-- Fix: cascade instead, matching slide_items.image_id (already ON DELETE
-- CASCADE). The app never hard-deletes an image on its own (moderation uses
-- images.removed_at), so in practice this only fires during account
-- deletion, when the slide's post is being deleted anyway.

ALTER TABLE slides
    DROP CONSTRAINT IF EXISTS slides_single_image_id_fkey;

ALTER TABLE slides
    ADD CONSTRAINT slides_single_image_id_fkey
    FOREIGN KEY (single_image_id) REFERENCES images(id) ON DELETE CASCADE;
