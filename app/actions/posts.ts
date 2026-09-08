'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CollageRecipe } from '@/lib/types/database.types';
import { checkRateLimit } from '@/lib/rateLimit';

export type SlideData = {
    slide_type: 'single' | 'collage';
    single_image_id?: string;
    collage_recipe?: CollageRecipe;
    slide_items?: { image_id: string; frame_index: number }[];
};

export type FeedProfile = { username: string; avatar_url: string | null };

export type FeedPost = {
    id: string;
    title: string;
    body: string | null;
    created_at: string;
    cover_image_url: string | null;
    vote_count: number;
    slide_count: number;
    profiles?: FeedProfile | FeedProfile[];
};

export type FeedCursor = { created_at: string; id: string };

// Validated before being interpolated into a PostgREST .or() filter string,
// since that string is otherwise built from client-supplied input.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isValidCursor(cursor: unknown): cursor is FeedCursor {
    const c = cursor as FeedCursor | undefined;
    return !!c && ISO_DATE_RE.test(c.created_at) && UUID_RE.test(c.id);
}

export async function createPost(title: string, body: string | null, slides: SlideData[]) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const rateLimit = await checkRateLimit(supabase, user.id, 'create_post');
    if (!rateLimit.allowed) {
        return { error: rateLimit.error };
    }

    if (!title || title.length < 1 || title.length > 200) {
        return { error: 'Title must be between 1 and 200 characters' };
    }

    if (slides.length === 0 || slides.length > 10) {
        return { error: 'Must have between 1 and 10 slides' };
    }

    // Resolve the cover image (slide 0) up front so posts.cover_image_url can
    // be set on insert instead of being looked up on every future feed read.
    const firstSlide = slides[0];
    let coverImageUrl: string | null = null;
    if (firstSlide.slide_type === 'single' && firstSlide.single_image_id) {
        const { data: image } = await supabase
            .from('images')
            .select('public_url')
            .eq('id', firstSlide.single_image_id)
            .single();
        coverImageUrl = image?.public_url || null;
    } else if (firstSlide.slide_type === 'collage' && firstSlide.slide_items?.length) {
        const frame0 =
            firstSlide.slide_items.find((item) => item.frame_index === 0) || firstSlide.slide_items[0];
        const { data: image } = await supabase
            .from('images')
            .select('public_url')
            .eq('id', frame0.image_id)
            .single();
        coverImageUrl = image?.public_url || null;
    }

    // Create post
    const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            title,
            body,
            cover_image_url: coverImageUrl,
        })
        .select()
        .single();

    if (postError || !post) {
        return { error: postError?.message || 'Failed to create post' };
    }

    // Create slides
    for (let i = 0; i < slides.length; i++) {
        const slideData = slides[i];

        const { data: slide, error: slideError } = await supabase
            .from('slides')
            .insert({
                post_id: post.id,
                slide_order: i,
                slide_type: slideData.slide_type,
                single_image_id: slideData.single_image_id || null,
                collage_recipe: slideData.collage_recipe || null,
            })
            .select()
            .single();

        if (slideError || !slide) {
            return { error: slideError?.message || `Failed to create slide ${i + 1}` };
        }

        // Create slide_items for collage slides
        if (slideData.slide_type === 'collage' && slideData.slide_items) {
            const items = slideData.slide_items.map((item) => ({
                slide_id: slide.id,
                image_id: item.image_id,
                frame_index: item.frame_index,
            }));

            const { error: itemsError } = await supabase.from('slide_items').insert(items);

            if (itemsError) {
                return { error: `Failed to create slide items: ${itemsError.message}` };
            }
        }
    }

    revalidatePath('/');
    revalidatePath('/app');
    redirect(`/p/${post.id}`);
}

export async function getPostWithSlides(postId: string) {
    const supabase = await createClient();

    // Get post with author profile
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select(
            `
      *,
      profiles!posts_user_id_fkey (
        username,
        avatar_url
      )
    `
        )
        .eq('id', postId)
        .is('removed_at', null)
        .single();

    if (postError || !post) {
        return { error: 'Post not found' };
    }

    // Single embedded query for slides + their images (single or collage),
    // instead of a follow-up query per slide.
    const { data: slides, error: slidesError } = await supabase
        .from('slides')
        .select(
            `
      *,
      image:images!slides_single_image_id_fkey (*),
      slide_items ( frame_index, images (*) )
    `
        )
        .eq('post_id', postId)
        .order('slide_order', { ascending: true });

    if (slidesError) {
        return { error: slidesError.message };
    }

    const enrichedSlides = (slides || []).map((slide: any) => ({
        ...slide,
        slide_items: slide.slide_items
            ? [...slide.slide_items].sort((a: any, b: any) => a.frame_index - b.frame_index)
            : slide.slide_items,
    }));

    return { post, slides: enrichedSlides };
}

const POST_LIST_SELECT = `
    id,
    title,
    body,
    created_at,
    cover_image_url,
    vote_count,
    profiles!posts_user_id_fkey (
        username,
        avatar_url
    )
`;

// One batched query for slide counts across all given posts, instead of one
// count query per post.
async function withSlideCounts(posts: any[]): Promise<FeedPost[]> {
    if (posts.length === 0) return [];

    const supabase = await createClient();
    const postIds = posts.map((p) => p.id);
    const { data: slideRows } = await supabase.from('slides').select('post_id').in('post_id', postIds);

    const counts = new Map<string, number>();
    (slideRows || []).forEach((row) => {
        counts.set(row.post_id, (counts.get(row.post_id) || 0) + 1);
    });

    return posts.map((post) => ({
        ...post,
        slide_count: counts.get(post.id) || 0,
    }));
}

export async function getRecentPosts(limit = 20, cursor?: FeedCursor) {
    const supabase = await createClient();

    let query = supabase
        .from('posts')
        .select(POST_LIST_SELECT)
        .is('removed_at', null)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

    if (isValidCursor(cursor)) {
        query = query.or(
            `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
    }

    const { data: posts, error } = await query;

    if (error) {
        return { posts: [] as FeedPost[], nextCursor: null as FeedCursor | null, error: error.message };
    }

    const enriched = await withSlideCounts(posts || []);
    const last = enriched[enriched.length - 1];
    const nextCursor: FeedCursor | null =
        enriched.length === limit && last ? { created_at: last.created_at, id: last.id } : null;

    return { posts: enriched, nextCursor, error: undefined as string | undefined };
}

export async function getAllSlideImages(postId: string) {
    const supabase = await createClient();

    const { data: slides } = await supabase
        .from('slides')
        .select(
            `
      slide_order,
      slide_type,
      image:images!slides_single_image_id_fkey ( public_url ),
      slide_items ( frame_index, images ( public_url ) )
    `
        )
        .eq('post_id', postId)
        .order('slide_order', { ascending: true });

    if (!slides || slides.length === 0) return [];

    return slides
        .map((slide: any) => {
            if (slide.slide_type === 'single') {
                return slide.image?.public_url ?? null;
            }
            const items = slide.slide_items as
                | { frame_index: number; images: { public_url: string } }[]
                | null;
            const first = items && [...items].sort((a, b) => a.frame_index - b.frame_index)[0];
            return first?.images?.public_url ?? null;
        })
        .filter((url): url is string => url !== null);
}

export async function getTrendingPosts(limit = 6) {
    const supabase = await createClient();

    const { data: posts, error } = await supabase
        .from('posts')
        .select(POST_LIST_SELECT)
        .is('removed_at', null)
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !posts) {
        return { posts: [] };
    }

    return {
        posts: posts.map((post: any) => ({
            ...post,
            imageUrl: post.cover_image_url,
            totalVotes: post.vote_count,
            agreeCount: 0,
            disagreeCount: 0,
        })),
    };
}
