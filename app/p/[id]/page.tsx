import { getPostWithSlides } from '@/app/actions/posts';
import { getVoteCounts, getUserVote } from '@/app/actions/votes';
import { getComments } from '@/app/actions/comments';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SlideCarousel from '@/components/slides/SlideCarousel';
import VoteButtons from '@/components/voting/VoteButtons';
import CommentTabs from '@/components/comments/CommentTabs';
import BackToHome from '@/components/layout/BackToHome';
import DeleteButton from '@/components/posts/DeleteButton';
import AvatarFallback from '@/components/profile/AvatarFallback';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Run ALL data fetches in parallel instead of sequentially
    const [
        postResult,
        voteCountsResult,
        userVoteResult,
        agreeCommentsResult,
        disagreeCommentsResult,
        supabase,
    ] = await Promise.all([
        getPostWithSlides(id),
        getVoteCounts(id),
        getUserVote(id),
        getComments(id, 'agree'),
        getComments(id, 'disagree'),
        createClient(),
    ]);

    const { post, slides, error } = postResult;

    if (error || !post) {
        notFound();
    }

    const voteCounts = voteCountsResult.data;
    const userVote = userVoteResult.data;
    const agreeComments = agreeCommentsResult.data;
    const disagreeComments = disagreeCommentsResult.data;

    // Check if current user owns the post
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isOwner = user && post.user_id === user.id;

    const totalComments = (agreeComments?.length || 0) + (disagreeComments?.length || 0);

    return (
        <>
            <BackToHome />
            <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Current Active Discussion Header */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex gap-6 items-center">
                            {/* Post image thumbnail */}
                            {slides && slides.length > 0 && slides[0].image && (
                                <div className="h-20 w-20 rounded-xl overflow-hidden ring-4 ring-primary/10 flex-shrink-0">
                                    <img
                                        src={slides[0].image.public_url}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                    {post.title}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <AvatarFallback
                                        username={(post as any).profiles?.username || 'U'}
                                        avatarUrl={(post as any).profiles?.avatar_url}
                                        size="sm"
                                    />
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                        by <span className="text-primary">{(post as any).profiles?.username || 'Unknown'}</span>
                                        {' '}• {new Date(post.created_at).toLocaleDateString()}
                                        {' '}• <span className="text-slate-900 dark:text-slate-200">{totalComments} comments</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <VoteButtons
                                postId={id}
                                initialCounts={voteCounts || { agree_count: 0, disagree_count: 0 }}
                                initialUserVote={userVote}
                            />
                            {isOwner && <DeleteButton postId={id} />}
                        </div>
                    </div>

                    {/* Body Text */}
                    {post.body && (
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                                {post.body}
                            </p>
                        </div>
                    )}

                    {/* Slide Carousel */}
                    <div className="mb-8">
                        <SlideCarousel slides={slides || []} />
                    </div>

                    {/* The Dual Thread Debate */}
                    <CommentTabs
                        postId={id}
                        agreeComments={agreeComments || []}
                        disagreeComments={disagreeComments || []}
                    />
                </div>
            </div>
        </>
    );
}
