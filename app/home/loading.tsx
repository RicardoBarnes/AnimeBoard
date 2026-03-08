export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Nav skeleton */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-8">
                    <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="hidden md:flex gap-6">
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-8">
                {/* Trending skeleton */}
                <section className="flex flex-col gap-4">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-none w-[320px] md:w-[450px] aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </section>

                {/* Feed skeleton */}
                <section>
                    <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
                    <div className="max-w-3xl mx-auto space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                                <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
                                <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-4" />
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
