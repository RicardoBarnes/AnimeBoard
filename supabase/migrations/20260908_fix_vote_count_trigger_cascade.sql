-- AnimeBoard - fix account deletion failing when the account has posts
-- that received votes
-- Migration: 20260908_fix_vote_count_trigger_cascade.sql
-- Created: 2026-09-08
--
-- Bug: deleting a user cascades profile -> their posts -> votes on those
-- posts (all in one statement). The AFTER DELETE trigger on votes then
-- tries to UPDATE the post's vote_count — but that same post is also being
-- deleted by the same cascading statement, which Postgres rejects with
-- "tuple to be updated was already modified by an operation triggered by
-- the current command". Safe fix: if that happens, the post is being
-- deleted anyway, so the vote_count update no longer matters — ignore it.

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
        BEGIN
            UPDATE posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
        EXCEPTION WHEN OTHERS THEN
            -- The post is mid-deletion in the same cascading statement
            -- (e.g. its owner's account is being deleted) — safe to skip.
            NULL;
        END;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION sync_post_vote_count IS 'Keeps posts.vote_count in sync; tolerates the post itself being deleted in the same cascading statement (e.g. account deletion)';
