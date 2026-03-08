export default function PostLoading() {
    return (
        <>
            {/* Back bar skeleton */}
            <div className="bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
            </div>

            <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Header skeleton */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
                        <div className="flex gap-6 items-center mb-4">
                            <div className="h-20 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-3" />
                                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                            <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    {/* Image skeleton */}
                    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-8" />

                    {/* Comment threads skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-xl border-l-4 border-slate-300 dark:border-slate-700">
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
                                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
