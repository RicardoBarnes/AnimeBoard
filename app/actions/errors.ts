'use server';

import { createClient } from '@/lib/supabase/server';

// Intentionally forgiving: this only ever runs from a client-side error
// boundary trying to report that something already went wrong, so it must
// never itself throw or block the UI.
export async function logClientError(message: string, digest?: string, path?: string) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        await supabase.from('error_logs').insert({
            user_id: user?.id || null,
            message: message.slice(0, 2000),
            digest: digest || null,
            path: path || null,
        });
    } catch {
        // Swallow — logging the error must never crash the error page.
    }
}

export async function getErrorLogs(limit = 50) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: 'Not authenticated' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { data: [], error: 'Forbidden' };
    }

    const { data, error } = await supabase
        .from('error_logs')
        .select('id, message, digest, path, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}
