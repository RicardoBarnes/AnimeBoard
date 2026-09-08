'use client';

import { useState, useEffect, useTransition } from 'react';
import { toggleVote } from '@/app/actions/votes';
import { Check, X } from 'lucide-react';

interface VoteButtonsProps {
    postId: string;
    initialCounts: { agree_count: number; disagree_count: number };
    initialUserVote: 'agree' | 'disagree' | null;
}

export default function VoteButtons({ postId, initialCounts, initialUserVote }: VoteButtonsProps) {
    const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(initialUserVote);
    const [counts, setCounts] = useState(initialCounts);
    const [isPending, startTransition] = useTransition();
    const [justStamped, setJustStamped] = useState<'agree' | 'disagree' | null>(null);

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
            setJustStamped(voteType);
            setTimeout(() => setJustStamped(null), 400);
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

    const total = counts.agree_count + counts.disagree_count;
    const agreePct = total === 0 ? 50 : Math.round((counts.agree_count / total) * 100);

    return (
        <div className="flex flex-col gap-2">
            {/* Verdict meter — the tally, not decoration */}
            <div className="flex h-1.5 w-full max-w-[280px] rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div className="bg-gold transition-all duration-500" style={{ width: `${agreePct}%` }} />
                <div className="bg-disagree transition-all duration-500" style={{ width: `${100 - agreePct}%` }} />
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => handleVote('agree')}
                    disabled={isPending}
                    aria-pressed={userVote === 'agree'}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all transform active:scale-95 border-2 border-gold text-gold hover:bg-gold hover:text-ink data-[active=true]:bg-gold data-[active=true]:text-ink data-[active=true]:shadow-lg data-[active=true]:shadow-gold/25"
                    data-active={userVote === 'agree'}
                >
                    <span className={`stamp w-6 h-6 ${justStamped === 'agree' ? 'stamp-animate' : ''}`}>
                        <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>Agree</span>
                    <span className="font-mono text-sm opacity-80">{counts.agree_count}</span>
                </button>

                <button
                    onClick={() => handleVote('disagree')}
                    disabled={isPending}
                    aria-pressed={userVote === 'disagree'}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all transform active:scale-95 border-2 border-disagree text-disagree hover:bg-disagree hover:text-disagree-foreground data-[active=true]:bg-disagree data-[active=true]:text-disagree-foreground data-[active=true]:shadow-lg data-[active=true]:shadow-disagree/25"
                    data-active={userVote === 'disagree'}
                >
                    <span className={`stamp w-6 h-6 ${justStamped === 'disagree' ? 'stamp-animate' : ''}`}>
                        <X className="w-3.5 h-3.5" />
                    </span>
                    <span>Disagree</span>
                    <span className="font-mono text-sm opacity-80">{counts.disagree_count}</span>
                </button>
            </div>
        </div>
    );
}
