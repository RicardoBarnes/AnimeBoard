'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rateLimit';

export async function toggleVote(postId: string, voteType: 'agree' | 'disagree') {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const rateLimit = await checkRateLimit(supabase, user.id, 'toggle_vote');
    if (!rateLimit.allowed) {
        return { error: rateLimit.error };
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    if (existingVote) {
        if (existingVote.vote_type === voteType) {
            // Same vote - toggle off (delete)
            const { error } = await supabase
                .from('votes')
                .delete()
                .eq('id', existingVote.id);

            if (error) {
                return { error: error.message };
            }

            // The vote-count trigger deliberately no-ops on DELETE (it can
            // conflict with cascading deletes of the post/account itself),
            // so decrement explicitly here — this is a direct, non-cascading
            // delete, so it's always safe to do.
            await supabase.rpc('decrement_post_vote_count', { p_post_id: postId });
        } else {
            // Different vote - update
            const { error } = await supabase
                .from('votes')
                .update({ vote_type: voteType })
                .eq('id', existingVote.id);

            if (error) {
                return { error: error.message };
            }
        }
    } else {
        // No existing vote - create new
        const { error } = await supabase.from('votes').insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType,
        });

        if (error) {
            return { error: error.message };
        }
    }

    revalidatePath(`/p/${postId}`);
    revalidatePath('/home');
    return { success: true };
}

export async function getVoteCounts(postId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_vote_counts', {
        p_post_id: postId,
    });

    if (error) {
        return { error: error.message };
    }

    const counts = data?.[0] || { agree_count: 0, disagree_count: 0, total_votes: 0 };
    return { data: counts };
}

export async function getUserVote(postId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { data: null };
    }

    const { data: vote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    return { data: vote?.vote_type || null };
}
