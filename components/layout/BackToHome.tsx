'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BackToHome() {
    return (
        <div className="bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto px-4 py-3">
                <Link
                    href="/home"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </Link>
            </div>
        </div>
    );
}
