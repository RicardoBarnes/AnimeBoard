import { getRecentPosts, getFirstSlideImage, getTrendingPosts } from '@/app/actions/posts';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import Navigation from '@/components/layout/Navigation';
import AvatarFallback from '@/components/profile/AvatarFallback';
import FeedCardCarousel from '@/components/posts/FeedCardCarousel';
import TrendingCarousel from '@/components/posts/TrendingCarousel';

// Fetch trending section data
async function TrendingSection() {
    const { posts: trendingPosts } = await getTrendingPosts(6);

    if (!trendingPosts || trendingPosts.length === 0) return null;

    // Fetch images in parallel
    const trendingWithImages = await Promise.all(
        trendingPosts.map(async (post) => {
            const imageUrl = await getFirstSlideImage(post.id);
            return { ...post, imageUrl };
        })
    );

    return (
        <section id="trending" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                    Featured Boards
                </h3>
            </div>
            <TrendingCarousel posts={trendingWithImages} />
        </section>
    );
}

// Fetch feed data
async function FeedSection() {
    const supabase = await createClient();
    const { posts } = await getRecentPosts(20);

    if (!posts || posts.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xl mb-4">No posts yet. Be the first to create one!</p>
                <Link
                    href="/app/create"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
                >
                    Create Post
                </Link>
            </div>
        );
    }

    // Fetch images + slide counts in parallel for all posts
    const postsWithImages = await Promise.all(
        posts.map(async (post) => {
            const [imageUrl, slideCountResult] = await Promise.all([
                getFirstSlideImage(post.id),
                supabase
                    .from('slides')
                    .select('id', { count: 'exact', head: true })
                    .eq('post_id', post.id),
            ]);

            return { ...post, imageUrl, slideCount: slideCountResult.count || 0 };
        })
    );

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {postsWithImages.map((post) => (
                <Link
                    key={post.id}
                    href={`/p/${post.id}`}
                    className="block bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all group"
                >
                    {/* Title */}
                    <div className="p-5 pb-3">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                            {post.title}
                        </h3>
                    </div>

                    {/* Image */}
                    {post.imageUrl && (
                        <FeedCardCarousel
                            postId={post.id}
                            firstImageUrl={post.imageUrl}
                            slideCount={post.slideCount}
                        />
                    )}

                    {/* Body + Meta */}
                    <div className="p-5 pt-3">
                        {(post as any).body && (
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
                                {(post as any).body}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                            <AvatarFallback
                                username={(post as any).profiles?.username || 'U'}
                                avatarUrl={(post as any).profiles?.avatar_url}
                                size="sm"
                            />
                            <span className="font-medium text-primary">{(post as any).profiles?.username || 'Unknown'}</span>
                            <span>·</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// Skeleton components for streaming
function TrendingSkeleton() {
    return (
        <section className="flex flex-col gap-4">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-none w-[320px] md:w-[450px] aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
            </div>
        </section>
    );
}

function FeedSkeleton() {
    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-5">
                    <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
                    <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-4" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}

export default async function HomePage() {
    // Check authentication
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-8">
                    {/* Trending — streams in independently */}
                    <Suspense fallback={<TrendingSkeleton />}>
                        <TrendingSection />
                    </Suspense>

                    {/* Feed — streams in independently */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Posts</h3>
                        </div>
                        <Suspense fallback={<FeedSkeleton />}>
                            <FeedSection />
                        </Suspense>
                    </section>

                    {/* Footer */}
                    <footer className="mt-8 py-10 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 rounded-2xl">
                        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-bold text-primary mb-1">Join the Council</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Join the most heated anime debates on the internet.
                                </p>
                            </div>
                            <Link
                                href="/app/create"
                                className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
                            >
                                Create a Board
                            </Link>
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}
