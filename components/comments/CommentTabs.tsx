'use client';

import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { Check, X } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: { username: string; avatar_url?: string };
    replies: Comment[];
}

interface CommentTabsProps {
    postId: string;
    agreeComments: Comment[];
    disagreeComments: Comment[];
}

export default function CommentTabs({ postId, agreeComments, disagreeComments }: CommentTabsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* AGREE TESTIMONY */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-2 border-gold pb-2 px-2">
                    <h2 className="font-display text-gold font-semibold text-xl flex items-center gap-2">
                        <span className="stamp w-6 h-6"><Check className="w-3.5 h-3.5" /></span>
                        Testimony for Agree
                    </h2>
                    <span className="bg-gold/10 text-gold text-xs font-mono px-2 py-1 rounded-full uppercase">
                        {agreeComments.length}
                    </span>
                </div>
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    <CommentList
                        postId={postId}
                        initialComments={agreeComments}
                        voteSection="agree"
                    />
                </div>
                {/* Input Box */}
                <div className="mt-2">
                    <CommentForm postId={postId} voteSection="agree" />
                </div>
            </div>

            {/* DISAGREE TESTIMONY */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-2 border-disagree pb-2 px-2">
                    <h2 className="font-display text-disagree font-semibold text-xl flex items-center gap-2">
                        <span className="stamp w-6 h-6"><X className="w-3.5 h-3.5" /></span>
                        Testimony for Disagree
                    </h2>
                    <span className="bg-disagree/10 text-disagree text-xs font-mono px-2 py-1 rounded-full uppercase">
                        {disagreeComments.length}
                    </span>
                </div>
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    <CommentList
                        postId={postId}
                        initialComments={disagreeComments}
                        voteSection="disagree"
                    />
                </div>
                {/* Input Box */}
                <div className="mt-2">
                    <CommentForm postId={postId} voteSection="disagree" />
                </div>
            </div>
        </div>
    );
}
