import type { SupabaseClient } from '@supabase/supabase-js';

export type RateLimitAction = 'create_post' | 'toggle_vote' | 'add_comment' | 'create_report';

const LIMITS: Record<RateLimitAction, { max: number; windowMinutes: number; message: string }> = {
    create_post: { max: 5, windowMinutes: 60, message: 'You are filing cases too quickly. Try again in a bit.' },
    toggle_vote: { max: 30, windowMinutes: 10, message: 'Too many verdicts cast too quickly. Slow down and try again.' },
    add_comment: { max: 15, windowMinutes: 10, message: 'Too much testimony too quickly. Try again in a few minutes.' },
    create_report: { max: 10, windowMinutes: 60, message: 'Too many reports filed. Try again later.' },
};

/**
 * Simple DB-backed rate limit: counts this user's rows for `action` in the
 * trailing window, and records a new event if under the limit. No external
 * service required, so it stays free at any scale Postgres itself handles.
 * Not perfectly race-proof under extreme concurrency, but sufficient to stop
 * casual spam/abuse — revisit with a proper token-bucket service only if
 * that turns out to be insufficient in practice.
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    userId: string,
    action: RateLimitAction
): Promise<{ allowed: true } | { allowed: false; error: string }> {
    const { max, windowMinutes, message } = LIMITS[action];
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

    const { count } = await supabase
        .from('rate_limit_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', action)
        .gte('created_at', since);

    if ((count || 0) >= max) {
        return { allowed: false, error: message };
    }

    await supabase.from('rate_limit_events').insert({ user_id: userId, action });
    return { allowed: true };
}
