'use server';

import { createClient } from '@/lib/supabase/server';

export type DailyCount = { day: string; count: number };

export type GrowthStats = {
    signups: DailyCount[];
    posts: DailyCount[];
    votes: DailyCount[];
    comments: DailyCount[];
    totals: {
        users: number;
        posts: number;
        votes: number;
        comments: number;
        storageBytes: number;
    };
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(): Promise<
    { error: string; supabase: null } | { error: null; supabase: SupabaseServerClient }
> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', supabase: null };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden', supabase: null };
    }

    return { error: null, supabase };
}

function bucketByDay(rows: { created_at: string }[]): DailyCount[] {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const day = row.created_at.slice(0, 10);
        counts.set(day, (counts.get(day) || 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day));
}

// Live aggregate queries — fine at this scale (fixed number of queries
// regardless of row count, using the same indexed created_at columns the
// feed queries already rely on). Revisit with a nightly rollup table only
// if this page is checked often enough for it to start feeling slow.
export async function getGrowthStats(days = 30): Promise<{ data: GrowthStats | null; error?: string }> {
    const { error: authError, supabase } = await requireAdmin();
    if (authError || !supabase) {
        return { data: null, error: authError ?? 'Forbidden' };
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
        signupsRes,
        postsRes,
        votesRes,
        commentsRes,
        totalUsersRes,
        totalPostsRes,
        totalVotesRes,
        totalCommentsRes,
        storageRes,
    ] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', since),
        supabase.from('posts').select('created_at').gte('created_at', since).is('removed_at', null),
        supabase.from('votes').select('created_at').gte('created_at', since),
        supabase.from('comments').select('created_at').gte('created_at', since).is('removed_at', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }).is('removed_at', null),
        supabase.from('votes').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).is('removed_at', null),
        // Plain column select + JS sum, rather than a PostgREST aggregate
        // function, since aggregate support isn't guaranteed enabled on
        // every Supabase project tier.
        supabase.from('images').select('file_size_bytes').is('removed_at', null),
    ]);

    const storageBytes = (storageRes.data || []).reduce(
        (sum: number, row: { file_size_bytes: number }) => sum + (row.file_size_bytes || 0),
        0
    );

    return {
        data: {
            signups: bucketByDay(signupsRes.data || []),
            posts: bucketByDay(postsRes.data || []),
            votes: bucketByDay(votesRes.data || []),
            comments: bucketByDay(commentsRes.data || []),
            totals: {
                users: totalUsersRes.count || 0,
                posts: totalPostsRes.count || 0,
                votes: totalVotesRes.count || 0,
                comments: totalCommentsRes.count || 0,
                storageBytes,
            },
        },
    };
}
