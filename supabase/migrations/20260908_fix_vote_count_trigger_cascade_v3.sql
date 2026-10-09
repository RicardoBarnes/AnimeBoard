-- AnimeBoard - definitive fix for account/post deletion failing when votes exist
-- Migration: 20260908_fix_vote_count_trigger_cascade_v3.sql
-- Created: 2026-09-08
--
-- Two earlier attempts (exception handling, then pg_trigger_depth()) did
-- not resolve "Database error deleting user" for accounts with posts that
-- have votes. Rather than rely further on Postgres trigger-cascade
-- internals, remove the conflict at its source: the trigger no longer
-- touches `posts` at all on vote DELETE (so it can never race with a
-- cascading delete of that same post). The one legitimate case that needs
-- a decrement — a user explicitly toggling their own vote off — is now
-- handled explicitly by the application in a plain, non-cascading UPDATE.

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
        -- Deliberately does nothing. See toggleVote() in app/actions/votes.ts
        -- for the explicit decrement used on a direct vote-off action.
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_vote_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE posts SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_post_vote_count(uuid) TO authenticated;

COMMENT ON FUNCTION sync_post_vote_count IS 'Increments posts.vote_count on new votes. Does nothing on vote deletion — see decrement_post_vote_count() for the explicit, non-cascading decrement path';
COMMENT ON FUNCTION decrement_post_vote_count IS 'Explicitly decrements a post''s vote_count; called by toggleVote() when a user removes their own vote, never from a cascading delete';
