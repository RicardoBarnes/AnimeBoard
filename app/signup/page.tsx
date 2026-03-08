'use client';

import { signup } from '@/app/actions/auth';
import Link from 'next/link';
import { useActionState } from 'react';
import { TrendingUp } from 'lucide-react';

export default function SignupPage() {
    const [error, formAction] = useActionState(
        async (_prevState: any, formData: FormData) => {
            const result = await signup(formData);
            return result?.error || null;
        },
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 text-primary mb-4">
                            <TrendingUp className="w-8 h-8" />
                            <span className="text-2xl font-bold">AnimeBoard</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Join AnimeBoard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Create your account and start debating
                        </p>
                    </div>

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                minLength={3}
                                maxLength={20}
                                pattern="[a-zA-Z0-9_]+"
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="cool_username"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                3-20 characters, letters, numbers, and _ only
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="••••••••"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                At least 6 characters
                            </p>
                        </div>

                        {error && (
                            <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
                        >
                            Create Account
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
