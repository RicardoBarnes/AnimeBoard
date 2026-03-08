'use client';

import { useState } from 'react';
import CommentForm from './CommentForm';
import AvatarFallback from '@/components/profile/AvatarFallback';
import { ThumbsUp, ThumbsDown, Reply } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: { username: string; avatar_url?: string };
    replies: Comment[];
}

interface CommentListProps {
    postId: string;
    initialComments: Comment[];
    voteSection: 'agree' | 'disagree';
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentList({ postId, initialComments, voteSection }: CommentListProps) {
    const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
    const isAgree = voteSection === 'agree';
    const borderColor = isAgree ? 'border-primary' : 'border-accent-red';
    const nameColor = isAgree ? 'text-primary' : 'text-accent-red';
    const hoverColor = isAgree ? 'hover:text-primary' : 'hover:text-accent-red';

    return (
        <div className="flex flex-col gap-4">
            {initialComments.map((comment) => (
                <div key={comment.id} className={`bg-slate-100 dark:bg-slate-900/40 p-4 rounded-xl border-l-4 ${borderColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AvatarFallback
                            username={comment.profiles.username}
                            avatarUrl={comment.profiles.avatar_url}
                            size="sm"
                        />
                        <span className={`font-bold text-sm ${nameColor}`}>
                            {comment.profiles.username}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                            {timeAgo(comment.created_at)}
                        </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                        {comment.content}
                    </p>
                    <div className="flex items-center gap-4">
                        <button className={`flex items-center gap-1 text-xs font-bold text-slate-500 ${hoverColor} transition-colors`}>
                            {isAgree ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => setShowReplyForm(showReplyForm === comment.id ? null : comment.id)}
                            className={`flex items-center gap-1 text-xs font-bold text-slate-500 ${hoverColor} transition-colors`}
                        >
                            <Reply className="w-3.5 h-3.5" /> Reply
                        </button>
                    </div>

                    {showReplyForm === comment.id && (
                        <div className={`mt-3 pl-4 border-l-2 ${borderColor}/30`}>
                            <CommentForm
                                postId={postId}
                                voteSection={voteSection}
                                parentCommentId={comment.id}
                                onSuccess={() => setShowReplyForm(null)}
                            />
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className={`mt-4 pl-4 border-l-2 ${borderColor}/20 space-y-3`}>
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-3">
                                    <AvatarFallback
                                        username={reply.profiles.username}
                                        avatarUrl={reply.profiles.avatar_url}
                                        size="sm"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-xs ${nameColor}`}>
                                                {reply.profiles.username}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {timeAgo(reply.created_at)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                            {reply.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {initialComments.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                    No comments yet. Be the first!
                </div>
            )}
        </div>
    );
}
