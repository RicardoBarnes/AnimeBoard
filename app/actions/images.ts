'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * NOTE: Image uploads now happen client-side via direct Supabase Storage uploads.
 * See: components/images/ImageUploader.tsx
 * 
 * The old uploadImage() server action was removed to avoid the 1MB body size limit
 * for Next.js Server Actions when handling file uploads.
 */


const IMAGES_PAGE_SIZE = 60;

export async function searchImages(query: string, page = 0) {
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
        .order('created_at', { ascending: false })
        .range(page * IMAGES_PAGE_SIZE, page * IMAGES_PAGE_SIZE + IMAGES_PAGE_SIZE - 1);

    if (query) {
        queryBuilder = queryBuilder.or(
            `character_name.ilike.%${query}%,series_name.ilike.%${query}%`
        );
    }

    const { data, error } = await queryBuilder;

    if (error) {
        return { error: error.message };
    }

    return { data, hasMore: (data?.length || 0) === IMAGES_PAGE_SIZE };
}
