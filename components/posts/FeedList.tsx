'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import AvatarFallback from '@/components/profile/AvatarFallback';
import FeedCardCarousel from '@/components/posts/FeedCardCarousel';
import { getRecentPosts, type FeedPost, type FeedCursor } from '@/app/actions/posts';
import { caseNumber } from '@/lib/caseNumber';

interface FeedListProps {
    initialPosts: FeedPost[];
    initialCursor: FeedCursor | null;
}

export default function FeedList({ initialPosts, initialCursor }: FeedListProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [cursor, setCursor] = useState(initialCursor);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !cursor) return;
        loadingRef.current = true;
        setLoading(true);

        const result = await getRecentPosts(20, cursor);
        setPosts((prev) => [...prev, ...result.posts]);
        setCursor(result.nextCursor);

        loadingRef.current = false;
        setLoading(false);
    }, [cursor]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !cursor) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '600px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore, cursor]);

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="font-display text-xl mb-4">The docket is empty. File the first case.</p>
                <Link
                    href="/app/create"
                    className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
                >
                    File a Case
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {posts.map((post) => {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

                return (
                    <Link
                        key={post.id}
                        href={`/p/${post.id}`}
                        className="block bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-gold/50 dark:hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 transition-all group"
                    >
                        {/* Case number + title */}
                        <div className="p-5 pb-3">
                            <p className="font-mono text-[11px] tracking-wider text-gold/80 mb-1">
                                {caseNumber(post.id, post.created_at)}
                            </p>
                            <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-gold transition-colors">
                                {post.title}
                            </h3>
                        </div>

                        {/* Exhibit image */}
                        {post.cover_image_url && (
                            <FeedCardCarousel
                                postId={post.id}
                                firstImageUrl={post.cover_image_url}
                                slideCount={post.slide_count}
                            />
                        )}

                        {/* Body + Meta */}
                        <div className="p-5 pt-3">
                            {post.body && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
                                    {post.body}
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                                    <AvatarFallback
                                        username={profile?.username || 'U'}
                                        avatarUrl={profile?.avatar_url}
                                        size="sm"
                                    />
                                    <span className="font-medium text-gold">{profile?.username || 'Unknown'}</span>
                                    <span>·</span>
                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                                    {post.vote_count} {post.vote_count === 1 ? 'verdict' : 'verdicts'}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}

            {cursor && (
                <div ref={sentinelRef} className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    {loading ? 'Loading more…' : ''}
                </div>
            )}
        </div>
    );
}
