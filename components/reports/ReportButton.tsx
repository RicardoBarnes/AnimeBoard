'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag, X } from 'lucide-react';
import { createReport, type ReportReasonCode, type ReportType } from '@/app/actions/reports';

interface ReportButtonProps {
    reportType: ReportType;
    targetId: string;
    label?: string;
    className?: string;
}

const REASONS: { value: ReportReasonCode; label: string }[] = [
    { value: 'copyright', label: 'Copyright infringement' },
    { value: 'spam', label: 'Spam' },
    { value: 'nsfw', label: 'NSFW / inappropriate' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' },
];

export default function ReportButton({ reportType, targetId, label = 'Report', className = '' }: ReportButtonProps) {
    const [open, setOpen] = useState(false);
    const [reasonCode, setReasonCode] = useState<ReportReasonCode>('spam');
    const [reasonText, setReasonText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function handleSubmit() {
        setError(null);
        if (reasonText.trim().length < 10) {
            setError('Please explain the issue in at least 10 characters.');
            return;
        }

        setSubmitting(true);
        const result = await createReport({ reportType, targetId, reasonCode, reasonText });
        setSubmitting(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setDone(true);
    }

    function closeAndReset() {
        setOpen(false);
        setTimeout(() => {
            setDone(false);
            setReasonText('');
            setReasonCode('spam');
            setError(null);
        }, 200);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-disagree transition-colors ${className}`}
            >
                <Flag className="w-3.5 h-3.5" />
                {label}
            </button>

            {open && (
                <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-disagree/30">
                        <div className="flex items-center justify-between mb-1">
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-disagree">Grievance</p>
                            <button
                                onClick={closeAndReset}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {done ? (
                            <>
                                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2 mt-2">
                                    Grievance filed
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                    The registrar will review it. Thank you for helping keep the docket clean.
                                </p>
                                <button
                                    onClick={closeAndReset}
                                    className="w-full px-6 py-3 bg-gold text-ink rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all"
                                >
                                    Close
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-4 mt-2">
                                    File a grievance
                                </h2>

                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    Reason
                                </label>
                                <select
                                    value={reasonCode}
                                    onChange={(e) => setReasonCode(e.target.value as ReportReasonCode)}
                                    className="w-full mb-4 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-disagree focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    {REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>

                                {reasonCode === 'copyright' && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 -mt-2">
                                        For formal takedown requests, see our{' '}
                                        <Link href="/copyright" target="_blank" className="text-gold hover:underline">
                                            Copyright Policy
                                        </Link>
                                        .
                                    </p>
                                )}

                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    Statement of complaint
                                </label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Explain what's wrong (at least 10 characters)..."
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-disagree focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                                    {reasonText.length}/500
                                </p>

                                {error && (
                                    <div className="mt-3 bg-disagree/10 border border-disagree/30 text-disagree px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="mt-4 w-full px-6 py-3 bg-disagree text-disagree-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-disagree/30 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Filing...' : 'File Grievance'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
