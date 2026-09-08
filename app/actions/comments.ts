'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rateLimit';

export async function addComment(
    postId: string,
    content: string,
    voteSection: 'agree' | 'disagree',
    parentCommentId?: string
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const rateLimit = await checkRateLimit(supabase, user.id, 'add_comment');
    if (!rateLimit.allowed) {
        return { error: rateLimit.error };
    }

    if (!content || content.length < 1 || content.length > 2000) {
        return { error: 'Comment must be between 1 and 2000 characters' };
    }

    const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content,
        vote_section: voteSection,
        parent_comment_id: parentCommentId || null,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/p/${postId}`);
    return { success: true };
}

export async function getComments(postId: string, voteSection: 'agree' | 'disagree') {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
        .from('comments')
        .select(
            `
      *,
      profiles!comments_user_id_fkey (
        username,
        avatar_url
      )
    `
        )
        .eq('post_id', postId)
        .eq('vote_section', voteSection)
        .is('removed_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        return { error: error.message };
    }

    // Organize into parent and replies
    const topLevel = comments.filter((c) => !c.parent_comment_id);
    const replies = comments.filter((c) => c.parent_comment_id);

    const enriched = topLevel.map((comment) => ({
        ...comment,
        replies: replies.filter((r) => r.parent_comment_id === comment.id),
    }));

    return { data: enriched };
}
