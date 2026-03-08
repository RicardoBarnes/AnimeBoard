'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * NOTE: Image uploads now happen client-side via direct Supabase Storage uploads.
 * See: components/images/ImageUploader.tsx
 * 
 * The old uploadImage() server action was removed to avoid the 1MB body size limit
 * for Next.js Server Actions when handling file uploads.
 */


export async function searchImages(query: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    let queryBuilder = supabase
        .from('images')
        .select('*')
        .eq('uploader_id', user.id)
        .is('removed_at', null)
        .order('created_at', { ascending: false });

    if (query) {
        queryBuilder = queryBuilder.or(
            `character_name.ilike.%${query}%,series_name.ilike.%${query}%`
        );
    }

    const { data, error } = await queryBuilder;

    if (error) {
        return { error: error.message };
    }

    return { data };
}
