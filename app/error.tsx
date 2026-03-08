'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
                <div className="text-accent-red text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    onClick={reset}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
