'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logClientError } from '@/app/actions/errors';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const pathname = usePathname();

    useEffect(() => {
        logClientError(error.message || 'Unknown error', error.digest, pathname);
        // Only ever report the specific error instance this boundary caught.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
                <div className="font-mono text-xs uppercase tracking-widest text-disagree mb-3">Mistrial</div>
                <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    onClick={reset}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
