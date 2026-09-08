-- AnimeBoard Performance Uplift - support the admin growth-stats queries
-- Migration: 20260906_add_votes_created_index.sql
-- Created: 2026-09-06

CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at DESC);
