'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AvatarFallback from '@/components/profile/AvatarFallback';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TrendingPost {
    id: string;
    title: string;
    body?: string;
    created_at: string;
    imageUrl: string | null;
    totalVotes: number;
    agreeCount: number;
    disagreeCount: number;
    profiles?: { username: string; avatar_url?: string } | { username: string; avatar_url?: string }[];
}

interface TrendingCarouselProps {
    posts: TrendingPost[];
}

export default function TrendingCarousel({ posts }: TrendingCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 460;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    if (posts.length === 0) return null;

    return (
        <div className="relative">
            {/* Navigation Buttons */}
            <div className="flex gap-2 absolute -top-11 right-0 z-10">
                <button
                    onClick={() => scroll('left')}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-primary hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-primary hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Carousel */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 pb-4 no-scrollbar scroll-smooth"
            >
                {posts.map((post, index) => (
                    <Link
                        key={post.id}
                        href={`/p/${post.id}`}
                        className={`flex-none w-[320px] md:w-[450px] aspect-[16/9] relative rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-800 ${index === 0 ? 'ring-4 ring-primary/20' : ''}`}
                    >
                        {/* Background Image or Gradient */}
                        {post.imageUrl ? (
                            <Image
                                src={post.imageUrl}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 320px, 450px"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 dark:from-primary/20 dark:to-slate-900" />
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-4 left-4 right-4">
                            {index === 0 ? (
                                <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block">
                                    Trending #1 · {post.totalVotes} votes
                                </span>
                            ) : (
                                <span className="bg-slate-700 text-white text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block">
                                    #{index + 1} · {post.totalVotes} votes
                                </span>
                            )}
                            <h4 className="text-white text-xl font-bold line-clamp-2">{post.title}</h4>
                            {(() => {
                                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                                const username = profile?.username;
                                return username ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        <AvatarFallback
                                            username={username}
                                            avatarUrl={profile?.avatar_url}
                                            size="sm"
                                        />
                                        <span className="text-slate-300 text-sm font-medium">{username}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
