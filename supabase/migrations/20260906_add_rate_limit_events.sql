-- AnimeBoard Trust & Safety - basic abuse-rate limiting
-- Migration: 20260906_add_rate_limit_events.sql
-- Created: 2026-09-06
--
-- A single generic event log used to throttle mutation-heavy actions
-- (creating posts, voting, commenting, filing reports) without adding
-- an external rate-limiting service. Each allowed action inserts one row;
-- the server action counts recent rows for (user_id, action) before
-- deciding whether to allow the next one.
--
-- NOTE: this table grows without bound. At real scale, add a periodic
-- cleanup (e.g. a nightly job deleting rows older than a day) — not
-- included here since it isn't needed until traffic actually justifies it.

CREATE TABLE IF NOT EXISTS rate_limit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup ON rate_limit_events(user_id, action, created_at DESC);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_events_select_own" ON rate_limit_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "rate_limit_events_insert_own" ON rate_limit_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can review event history if investigating abuse
CREATE POLICY "rate_limit_events_select_admin" ON rate_limit_events
    FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

COMMENT ON TABLE rate_limit_events IS 'Generic per-user action log used to throttle abusive/spammy usage of mutation actions';
