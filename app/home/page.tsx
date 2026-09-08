import { getRecentPosts, getTrendingPosts } from '@/app/actions/posts';
import { getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import Navigation from '@/components/layout/Navigation';
import FeedList from '@/components/posts/FeedList';
import TrendingCarousel from '@/components/posts/TrendingCarousel';

// Fetch trending section data — a single query, sorted via the
// denormalized posts.vote_count column (no per-post vote-count queries).
async function TrendingSection() {
    const { posts: trendingPosts } = await getTrendingPosts(6);

    if (!trendingPosts || trendingPosts.length === 0) return null;

    return (
        <section id="trending" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Landmark Cases</span>
                <div className="h-px flex-1 bg-gold/20" />
            </div>
            <TrendingCarousel posts={trendingPosts} />
        </section>
    );
}

// Fetch the first feed page — a single posts query plus one batched slide-count
// query, regardless of how many posts are returned. Further pages are loaded
// client-side via infinite scroll in <FeedList>.
async function FeedSection() {
    const { posts, nextCursor } = await getRecentPosts(20);

    return <FeedList initialPosts={posts || []} initialCursor={nextCursor ?? null} />;
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
    // Check authentication — cached so the layout/middleware don't re-verify.
    const user = await getCurrentUser();

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
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                                The Docket
                            </h3>
                            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                        </div>
                        <Suspense fallback={<FeedSkeleton />}>
                            <FeedSection />
                        </Suspense>
                    </section>

                    {/* Footer */}
                    <footer className="mt-8 py-10 bg-ink rounded-2xl grain-surface relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                            <div className="text-center md:text-left">
                                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">
                                    Council Business
                                </p>
                                <h2 className="font-display text-2xl font-semibold text-white mb-1">
                                    File your case
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    Make your argument. Let the council vote.
                                </p>
                            </div>
                            <Link
                                href="/app/create"
                                className="bg-gold text-ink font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all whitespace-nowrap"
                            >
                                File a Case
                            </Link>
                        </div>
                        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/10 text-center md:text-left text-xs text-slate-500">
                            <Link href="/terms" className="hover:text-slate-300 transition-colors">
                                Terms of Service
                            </Link>
                            <span className="mx-2">·</span>
                            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                                Privacy Policy
                            </Link>
                            <span className="mx-2">·</span>
                            <Link href="/community-guidelines" className="hover:text-slate-300 transition-colors">
                                Community Guidelines
                            </Link>
                            <span className="mx-2">·</span>
                            <Link href="/copyright" className="hover:text-slate-300 transition-colors">
                                Copyright
                            </Link>
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}
