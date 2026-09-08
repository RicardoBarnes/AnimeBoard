'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

// Permanently deletes the current user's account and everything tied to
// it. Deleting the auth.users row cascades (via existing FK ON DELETE
// CASCADE constraints) through profiles -> posts/images/votes/comments/
// reports/rate_limit_events. Storage objects aren't covered by Postgres
// cascades, so the user's uploaded files are removed separately first.
export async function deleteAccount() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Best-effort cleanup of this user's storage folder (avatars + uploaded
    // images both live under `${user.id}/...`). Not fatal if it fails —
    // the account deletion below still removes all database records.
    try {
        const { data: files } = await supabase.storage.from('user-uploads').list(user.id);
        if (files && files.length > 0) {
            await supabase.storage.from('user-uploads').remove(files.map((f) => `${user.id}/${f.name}`));
        }
    } catch {
        // Continue even if storage cleanup fails — don't block account deletion on it.
    }

    try {
        const admin = createAdminClient();
        const { error } = await admin.auth.admin.deleteUser(user.id);

        if (error) {
            return { error: error.message };
        }
    } catch (err) {
        // createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY isn't
        // configured — surface that as a normal action error instead of an
        // unhandled 500 so the confirm dialog can show it cleanly.
        return { error: err instanceof Error ? err.message : 'Failed to delete account' };
    }

    await supabase.auth.signOut();
    redirect('/');
}
