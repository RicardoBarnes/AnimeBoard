'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserProfile(username: string) {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, created_at')
        .eq('username', username)
        .single();

    if (error) {
        return { profile: null, error: 'User not found' };
    }

    return { profile, error: null };
}

export async function getUserPosts(userId: string, limit = 20) {
    const supabase = await createClient();

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            id,
            title,
            body,
            created_at,
            cover_image_url,
            profiles!posts_user_id_fkey (
                username
            )
        `)
        .eq('user_id', userId)
        .is('removed_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching user posts:', error);
        return { posts: [], error: error.message };
    }

    return { posts: posts || [], error: null };
}

export async function getUserStats(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_user_stats', {
        p_user_id: userId,
    });

    if (error) {
        console.error('Error fetching user stats:', error);
        return {
            stats: {
                post_count: 0,
                agree_votes_received: 0,
                disagree_votes_received: 0,
                total_votes_received: 0,
            },
            error: error.message,
        };
    }

    // RPC returns array with single row
    const stats = data?.[0] || {
        post_count: 0,
        agree_votes_received: 0,
        disagree_votes_received: 0,
        total_votes_received: 0,
    };

    return { stats, error: null };
}

export async function updateProfile(data: { bio?: string; avatarUrl?: string }) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const updateData: any = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

    if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }

    // Revalidate the profile page
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    if (profile?.username) {
        revalidatePath(`/u/${profile.username}`);
        revalidatePath('/app/profile');
    }

    return { success: true, error: null };
}

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated', url: null };
    }

    const file = formData.get('avatar') as File;
    if (!file) {
        return { success: false, error: 'No file provided', url: null };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image', url: null };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File size must be less than 5MB', url: null };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { success: false, error: uploadError.message, url: null };
    }

    // Get public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from('user-uploads').getPublicUrl(fileName);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
        return { success: false, error: updateError.message, url: null };
    }

    return { success: true, error: null, url: publicUrl };
}
