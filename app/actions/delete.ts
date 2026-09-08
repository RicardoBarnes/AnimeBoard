'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deletePost(postId: string) {

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Verify user owns the post
    const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (!post || post.user_id !== user.id) {
        return { error: 'Not authorized to delete this post' };
    }

    // Real deletion, not a soft-hide: the post row is actually removed, and
    // its slides/slide_items/votes/comments cascade-delete with it (see the
    // ON DELETE CASCADE foreign keys in the initial schema). The uploader's
    // underlying images are intentionally left alone — they live in the
    // user's own image library independently of any one post and may be
    // reused elsewhere. This is distinct from admin moderation removal
    // (resolveReport), which stays a soft removed_at hide so there's an
    // audit trail and the decision can be reversed.
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/home');
    revalidatePath('/');

    return { success: true };
}
