-- AnimeBoard - correct fix for account/post deletion failing when votes exist
-- Migration: 20260908_fix_vote_count_trigger_cascade_v2.sql
-- Created: 2026-09-08
--
-- The previous attempt (20260908_fix_vote_count_trigger_cascade.sql) wrapped
-- the UPDATE in an exception handler, which does NOT work: the "tuple to be
-- updated was already modified by an operation triggered by the current
-- command" error is raised by Postgres AFTER this trigger successfully runs,
-- when the outer cascade then tries to delete the very post row this
-- trigger just updated — that happens outside this function's own
-- execution, so no exception handler inside it can catch it.
--
-- Correct fix: only adjust vote_count for a direct vote deletion (toggling
-- a vote off via the app). If this vote is being deleted as a cascade side
-- effect of its post — or that post's owner's whole account — also being
-- deleted in the same statement, pg_trigger_depth() will be greater than 1
-- here. Skip the update in that case; the post's vote_count no longer
-- matters since the post itself won't exist once the statement finishes.

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
        IF pg_trigger_depth() <= 1 THEN
            UPDATE posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION sync_post_vote_count IS 'Keeps posts.vote_count in sync for direct vote toggles only; skips the update when the vote is being removed as a cascade side effect of its post/account being deleted in the same statement';
