'use client';

import { useState, useEffect, useTransition } from 'react';
import { toggleVote } from '@/app/actions/votes';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VoteButtonsProps {
    postId: string;
    initialCounts: { agree_count: number; disagree_count: number };
    initialUserVote: 'agree' | 'disagree' | null;
}

export default function VoteButtons({ postId, initialCounts, initialUserVote }: VoteButtonsProps) {
    const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(initialUserVote);
    const [counts, setCounts] = useState(initialCounts);
    const [isPending, startTransition] = useTransition();

    // Sync state when server re-renders with fresh data (after revalidatePath)
    useEffect(() => {
        setCounts(initialCounts);
    }, [initialCounts.agree_count, initialCounts.disagree_count]);

    useEffect(() => {
        setUserVote(initialUserVote);
    }, [initialUserVote]);

    async function handleVote(voteType: 'agree' | 'disagree') {
        // Optimistic update
        const wasAgree = userVote === 'agree';
        const wasDisagree = userVote === 'disagree';
        const isTogglingOff = userVote === voteType;

        let newAgree = counts.agree_count;
        let newDisagree = counts.disagree_count;

        if (isTogglingOff) {
            if (voteType === 'agree') newAgree--;
            else newDisagree--;
            setUserVote(null);
        } else {
            if (wasAgree) newAgree--;
            if (wasDisagree) newDisagree--;
            if (voteType === 'agree') newAgree++;
            else newDisagree++;
            setUserVote(voteType);
        }

        setCounts({ agree_count: newAgree, disagree_count: newDisagree });

        startTransition(async () => {
            const result = await toggleVote(postId, voteType);
            if (result.error) {
                setCounts(initialCounts);
                setUserVote(initialUserVote);
            }
        });
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => handleVote('agree')}
                disabled={isPending}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${userVote === 'agree'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}
            >
                <ThumbsUp className="w-5 h-5" />
                <span>Agree</span>
                <span className="ml-1 font-bold">{counts.agree_count}</span>
            </button>

            <button
                onClick={() => handleVote('disagree')}
                disabled={isPending}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${userVote === 'disagree'
                    ? 'bg-accent-red text-white shadow-lg shadow-accent-red/20 scale-105'
                    : 'bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white'
                    }`}
            >
                <ThumbsDown className="w-5 h-5" />
                <span>Disagree</span>
                <span className="ml-1 font-bold">{counts.disagree_count}</span>
            </button>
        </div>
    );
}
