export default function CreateLoading() {
    return (
        <div className="max-w-[800px] mx-auto flex flex-col gap-8 py-8 px-4">
            {/* Progress stepper skeleton */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>

            {/* Form skeleton */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 lg:p-10 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-10">
                {/* Title field */}
                <div className="flex flex-col gap-2">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>

                {/* Slide deck */}
                <div className="flex flex-col gap-4">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="flex gap-3">
                        <div className="flex-1 aspect-[3/4] max-h-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="flex-1 aspect-[3/4] max-h-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Textarea */}
                <div className="flex flex-col gap-2">
                    <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
            </div>
        </div>
    );
}
