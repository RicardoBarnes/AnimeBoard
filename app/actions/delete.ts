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

    // Soft delete: set removed_at timestamp
    const { error } = await supabase
        .from('posts')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/home');
    revalidatePath('/');

    return { success: true };
}
