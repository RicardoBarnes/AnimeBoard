import { createClient } from '@supabase/supabase-js';

/**
 * Server-only admin client using the service role key, which bypasses RLS
 * entirely. NEVER import this from a client component or expose the key
 * with a NEXT_PUBLIC_ prefix — only call this from 'use server' action
 * files, and only for operations (like deleting an auth user) that the
 * regular user-scoped client cannot perform.
 */
export function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is not set. Add it (server-only, no NEXT_PUBLIC_ prefix) from ' +
            'Supabase Dashboard -> Settings -> API -> service_role key.'
        );
    }

    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
