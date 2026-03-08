import { getUserProfile, getUserPosts, getUserStats } from '@/app/actions/profiles';
import { getFirstSlideImage } from '@/app/actions/posts';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import AvatarFallback from '@/components/profile/AvatarFallback';
import { ThumbsUp, ThumbsDown, FileText } from 'lucide-react';

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    // Fetch user profile
    const { profile, error } = await getUserProfile(username);

    if (error || !profile) {
        notFound();
    }

    // Fetch user stats
    const { stats } = await getUserStats(profile.id);

    // Fetch user's posts
    const { posts } = await getUserPosts(profile.id, 20);

    // Get current user to check if viewing own profile
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.id;

    // Get first slide image for each post
    const postsWithImages = await Promise.all(
        (posts || []).map(async (post: any) => {
            const imageUrl = await getFirstSlideImage(post.id);
            return { ...post, imageUrl };
        })
    );

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <main className="max-w-5xl mx-auto px-4 py-8">
                    {/* Profile Header */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <AvatarFallback
                                username={profile.username}
                                avatarUrl={profile.avatar_url}
                                size="xl"
                            />

                            {/* Profile Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    {profile.username}
                                </h1>

                                {profile.bio && (
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        {profile.bio}
                                    </p>
                                )}

                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Member since{' '}
                                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                    })}
                                </p>

                                {isOwnProfile && (
                                    <Link
                                        href="/app/profile"
                                        className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Posts
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.post_count}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ThumbsUp className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Agree
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.agree_votes_received}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ThumbsDown className="w-5 h-5 text-accent-red" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Disagree
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.disagree_votes_received}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Total Votes
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.total_votes_received}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User's Posts */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Recent Posts
                        </h2>

                        {postsWithImages && postsWithImages.length > 0 ? (
                            <div className="space-y-4">
                                {postsWithImages.map((post: any) => (
                                    <Link
                                        key={post.id}
                                        href={`/p/${post.id}`}
                                        className="block border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex gap-4 p-4">
                                            {/* Thumbnail */}
                                            {post.imageUrl && (
                                                <div className="w-24 h-24 flex-shrink-0">
                                                    <img
                                                        src={post.imageUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover rounded"
                                                    />
                                                </div>
                                            )}

                                            {/* Post Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate">
                                                    {post.title}
                                                </h3>
                                                {post.body && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                        {post.body}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                                No posts yet
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
