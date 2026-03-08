'use client';

import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { SmilePlus, Frown } from 'lucide-react';

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
            {/* AGREE THREAD (BLUE) */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-4 border-primary pb-2 px-2">
                    <h2 className="text-primary font-black text-xl flex items-center gap-2">
                        <SmilePlus className="w-6 h-6" /> THE AGREE THREAD
                    </h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full uppercase">
                        {agreeComments.length} Supporters
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

            {/* DISAGREE THREAD (RED) */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-4 border-accent-red pb-2 px-2">
                    <h2 className="text-accent-red font-black text-xl flex items-center gap-2">
                        <Frown className="w-6 h-6" /> THE DISAGREE THREAD
                    </h2>
                    <span className="bg-accent-red/10 text-accent-red text-xs font-bold px-2 py-1 rounded-full uppercase">
                        {disagreeComments.length} Skeptics
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
