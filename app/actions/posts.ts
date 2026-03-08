'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CollageRecipe } from '@/lib/types/database.types';

export type SlideData = {
    slide_type: 'single' | 'collage';
    single_image_id?: string;
    collage_recipe?: CollageRecipe;
    slide_items?: { image_id: string; frame_index: number }[];
};

export async function createPost(title: string, body: string | null, slides: SlideData[]) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    if (!title || title.length < 1 || title.length > 200) {
        return { error: 'Title must be between 1 and 200 characters' };
    }

    if (slides.length === 0 || slides.length > 10) {
        return { error: 'Must have between 1 and 10 slides' };
    }

    // Create post
    const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            title,
            body,
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

    // Get slides
    const { data: slides, error: slidesError } = await supabase
        .from('slides')
        .select('*')
        .eq('post_id', postId)
        .order('slide_order', { ascending: true });

    if (slidesError) {
        return { error: slidesError.message };
    }

    // Get images for single slides and slide_items for collages
    const enrichedSlides = await Promise.all(
        slides.map(async (slide) => {
            if (slide.slide_type === 'single' && slide.single_image_id) {
                const { data: image } = await supabase
                    .from('images')
                    .select('*')
                    .eq('id', slide.single_image_id)
                    .single();
                return { ...slide, image };
            } else if (slide.slide_type === 'collage') {
                const { data: slideItems } = await supabase
                    .from('slide_items')
                    .select(
                        `
            frame_index,
            images (*)
          `
                    )
                    .eq('slide_id', slide.id)
                    .order('frame_index', { ascending: true });
                return { ...slide, slide_items: slideItems };
            }
            return slide;
        })
    );

    return { post, slides: enrichedSlides };
}

export async function getRecentPosts(limit = 20) {
    const supabase = await createClient();

    const { data: posts, error } = await supabase
        .from('posts')
        .select(
            `
      id,
      title,
      body,
      created_at,
      profiles!posts_user_id_fkey (
        username,
        avatar_url
      )
    `
        )
        .is('removed_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        return { error: error.message };
    }

    return { posts };
}

export async function getFirstSlideImage(postId: string) {
    const supabase = await createClient();

    const { data: slide } = await supabase
        .from('slides')
        .select('*')
        .eq('post_id', postId)
        .eq('slide_order', 0)
        .single();

    if (!slide) return null;

    if (slide.slide_type === 'single' && slide.single_image_id) {
        const { data: image } = await supabase
            .from('images')
            .select('public_url')
            .eq('id', slide.single_image_id)
            .single();
        return image?.public_url || null;
    } else if (slide.slide_type === 'collage') {
        const { data: firstItem } = await supabase
            .from('slide_items')
            .select(
                `
        images (public_url)
      `
            )
            .eq('slide_id', slide.id)
            .eq('frame_index', 0)
            .single();
        return (firstItem as any)?.images?.public_url || null;
    }

    return null;
}

export async function getAllSlideImages(postId: string) {
    const supabase = await createClient();

    const { data: slides } = await supabase
        .from('slides')
        .select('*')
        .eq('post_id', postId)
        .order('slide_order', { ascending: true });

    if (!slides || slides.length === 0) return [];

    const slideImages = await Promise.all(
        slides.map(async (slide) => {
            if (slide.slide_type === 'single' && slide.single_image_id) {
                const { data: image } = await supabase
                    .from('images')
                    .select('public_url')
                    .eq('id', slide.single_image_id)
                    .single();
                return image?.public_url || null;
            } else if (slide.slide_type === 'collage') {
                const { data: firstItem } = await supabase
                    .from('slide_items')
                    .select(
                        `
            images (public_url)
          `
                    )
                    .eq('slide_id', slide.id)
                    .eq('frame_index', 0)
                    .single();
                return (firstItem as any)?.images?.public_url || null;
            }
            return null;
        })
    );

    return slideImages.filter((url) => url !== null) as string[];
}

export async function getTrendingPosts(limit = 6) {
    const supabase = await createClient();

    // Get recent posts (small pool to reduce queries)
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            id,
            title,
            body,
            created_at,
            profiles!posts_user_id_fkey (
                username,
                avatar_url
            )
        `)
        .is('removed_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error || !posts || posts.length === 0) {
        return { posts: [] };
    }

    // Get vote counts for each post — use Promise.all for parallel execution
    const postsWithVotes = await Promise.all(
        posts.map(async (post) => {
            const { count } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id);

            return { ...post, totalVotes: count || 0, agreeCount: 0, disagreeCount: 0 };
        })
    );

    // Sort by total votes descending, then by recency
    postsWithVotes.sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { posts: postsWithVotes.slice(0, limit) };
}
