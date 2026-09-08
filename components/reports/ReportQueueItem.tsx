'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resolveReport } from '@/app/actions/reports';

interface ReportQueueItemProps {
    report: {
        id: string;
        report_type: 'post' | 'image' | 'comment';
        reason_code: string;
        reason_text: string;
        created_at: string;
        reporter: { username: string } | { username: string }[] | null;
        reported_post: { id: string; title: string; removed_at: string | null } | { id: string; title: string; removed_at: string | null }[] | null;
        reported_image: { id: string; public_url: string; removed_at: string | null } | { id: string; public_url: string; removed_at: string | null }[] | null;
        reported_comment: { id: string; content: string; removed_at: string | null } | { id: string; content: string; removed_at: string | null }[] | null;
    };
    onResolved: (reportId: string) => void;
}

function one<T>(v: T | T[] | null): T | null {
    return Array.isArray(v) ? v[0] ?? null : v;
}

export default function ReportQueueItem({ report, onResolved }: ReportQueueItemProps) {
    const [pending, setPending] = useState<'reviewed' | 'removed' | 'rejected' | null>(null);

    const reporter = one(report.reporter);
    const post = one(report.reported_post);
    const image = one(report.reported_image);
    const comment = one(report.reported_comment);
    const alreadyRemoved = post?.removed_at || image?.removed_at || comment?.removed_at;

    async function act(action: 'reviewed' | 'removed' | 'rejected') {
        setPending(action);
        const result = await resolveReport(report.id, action);
        setPending(null);
        if (!result.error) {
            onResolved(report.id);
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-disagree bg-disagree/10 px-2 py-1 rounded-full">
                    {report.report_type} · {report.reason_code}
                </span>
                <span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{report.reason_text}</p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 mb-3 text-sm">
                {post && (
                    <Link href={`/p/${post.id}`} target="_blank" className="text-gold hover:underline font-medium">
                        Case: {post.title}
                    </Link>
                )}
                {image && (
                    <a href={image.public_url} target="_blank" rel="noreferrer" className="text-gold hover:underline font-medium">
                        View reported image
                    </a>
                )}
                {comment && <p className="text-slate-600 dark:text-slate-400 italic">&quot;{comment.content}&quot;</p>}
                {alreadyRemoved && (
                    <p className="text-xs text-disagree mt-1 font-mono uppercase">Already removed</p>
                )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Filed by <span className="font-medium">{reporter?.username || 'unknown'}</span>
            </p>

            <div className="flex gap-2">
                <button
                    onClick={() => act('removed')}
                    disabled={pending !== null}
                    className="px-4 py-2 text-sm font-semibold bg-disagree text-disagree-foreground rounded-lg hover:shadow-lg hover:shadow-disagree/30 transition-all disabled:opacity-50"
                >
                    {pending === 'removed' ? 'Removing...' : 'Remove Content'}
                </button>
                <button
                    onClick={() => act('reviewed')}
                    disabled={pending !== null}
                    className="px-4 py-2 text-sm font-semibold border border-gold/40 text-gold rounded-lg hover:bg-gold/10 transition-all disabled:opacity-50"
                >
                    {pending === 'reviewed' ? 'Saving...' : 'Mark Reviewed'}
                </button>
                <button
                    onClick={() => act('rejected')}
                    disabled={pending !== null}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                >
                    {pending === 'rejected' ? 'Dismissing...' : 'Dismiss'}
                </button>
            </div>
        </div>
    );
}
