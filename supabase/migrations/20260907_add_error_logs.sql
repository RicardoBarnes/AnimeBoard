-- AnimeBoard Trust & Safety - lightweight production error visibility
-- Migration: 20260907_add_error_logs.sql
-- Created: 2026-09-07
--
-- Zero-new-service error logging: unhandled client/render errors report
-- here instead of vanishing silently. Not a replacement for a real APM
-- tool (no stack traces, no alerting) — just enough to know something
-- broke without waiting for a user to say so. Upgrade to Sentry or similar
-- if/when richer diagnostics are worth a new dependency.

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    digest TEXT,
    path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Errors can happen to logged-out visitors too (e.g. on /login itself),
-- so inserts aren't restricted to authenticated users.
CREATE POLICY "error_logs_insert_any" ON error_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "error_logs_select_admin" ON error_logs
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

COMMENT ON TABLE error_logs IS 'Client-reported unhandled errors, for admin visibility only — not a full APM replacement';
