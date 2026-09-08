'use client';

import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useActionState } from 'react';
import { Landmark } from 'lucide-react';

export default function LoginPage() {
    const [error, formAction] = useActionState(
        async (_prevState: any, formData: FormData) => {
            const result = await login(formData);
            return result?.error || null;
        },
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-4 grain-surface">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 text-gold mb-3">
                        <Landmark className="w-7 h-7" strokeWidth={1.5} />
                        <span className="font-display text-2xl font-semibold text-white">AnimeBoard</span>
                    </div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                        Council Admission
                    </p>
                </div>

                <div className="bg-background-light dark:bg-slate-900 rounded-xl border border-gold/20 shadow-2xl shadow-black/40 p-8">
                    <div className="mb-8">
                        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                            Welcome back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                            Sign in to resume your standing before the council.
                        </p>
                    </div>

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-disagree/10 border border-disagree/30 text-disagree px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gold text-ink py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.99] transition-all"
                        >
                            Sign In
                        </button>

                        <div className="text-center">
                            <Link href="/forgot-password" className="text-sm text-gold hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        New to the council?{' '}
                        <Link href="/signup" className="text-gold font-semibold hover:underline">
                            File for admission
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
