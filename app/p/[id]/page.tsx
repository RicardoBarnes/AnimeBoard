import { getPostWithSlides } from '@/app/actions/posts';
import { getVoteCounts, getUserVote } from '@/app/actions/votes';
import { getComments } from '@/app/actions/comments';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import Image from 'next/image';
import SlideCarousel from '@/components/slides/SlideCarousel';
import VoteButtons from '@/components/voting/VoteButtons';
import CommentTabs from '@/components/comments/CommentTabs';
import BackToHome from '@/components/layout/BackToHome';
import DeleteButton from '@/components/posts/DeleteButton';
import AvatarFallback from '@/components/profile/AvatarFallback';
import ReportButton from '@/components/reports/ReportButton';
import { caseNumber } from '@/lib/caseNumber';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Run ALL data fetches in parallel instead of sequentially
    const [
        postResult,
        voteCountsResult,
        userVoteResult,
        agreeCommentsResult,
        disagreeCommentsResult,
        user,
    ] = await Promise.all([
        getPostWithSlides(id),
        getVoteCounts(id),
        getUserVote(id),
        getComments(id, 'agree'),
        getComments(id, 'disagree'),
        getCurrentUser(),
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
    const isOwner = user && post.user_id === user.id;

    const totalComments = (agreeComments?.length || 0) + (disagreeComments?.length || 0);

    return (
        <>
            <BackToHome />
            <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Case Header */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex gap-6 items-center min-w-0">
                                {/* Exhibit thumbnail */}
                                {slides && slides.length > 0 && slides[0].image && (
                                    <div className="relative h-20 w-20 rounded-xl overflow-hidden ring-2 ring-gold/30 flex-shrink-0">
                                        <Image
                                            src={slides[0].image.public_url}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-mono text-xs tracking-wider text-gold/80 mb-1">
                                        {caseNumber(post.id, post.created_at)}
                                    </p>
                                    <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                        {post.title}
                                    </h1>
                                    <div className="flex items-center gap-3">
                                        <AvatarFallback
                                            username={(post as any).profiles?.username || 'U'}
                                            avatarUrl={(post as any).profiles?.avatar_url}
                                            size="sm"
                                        />
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                            filed by <span className="text-gold">{(post as any).profiles?.username || 'Unknown'}</span>
                                            {' '}• {new Date(post.created_at).toLocaleDateString()}
                                            {' '}• <span className="text-slate-900 dark:text-slate-200">{totalComments} testimony</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-4">
                                {!isOwner && user && (
                                    <ReportButton reportType="post" targetId={post.id} label="Report Case" />
                                )}
                                {isOwner && <DeleteButton postId={id} />}
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                                Cast your verdict
                            </p>
                            <VoteButtons
                                postId={id}
                                initialCounts={voteCounts || { agree_count: 0, disagree_count: 0 }}
                                initialUserVote={userVote}
                            />
                        </div>
                    </div>

                    {/* Body Text */}
                    {post.body && (
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                                Statement of the case
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                                {post.body}
                            </p>
                        </div>
                    )}

                    {/* Exhibit / Slide Carousel */}
                    <div className="mb-8">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                            Exhibit A
                        </p>
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
