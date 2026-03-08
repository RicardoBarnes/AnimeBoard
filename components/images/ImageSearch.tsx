'use client';

import { useState, useTransition } from 'react';
import { searchImages } from '@/app/actions/images';
import { useRouter } from 'next/navigation';

export default function ImageSearch() {
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        startTransition(() => {
            // Trigger re-render by updating URL
            const params = new URLSearchParams();
            if (query) {
                params.set('q', query);
            }
            router.push(`/app/images?${params.toString()}`);
        });
    }

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by character or series name..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
                <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            router.push('/app/images');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </form>
    );
}
