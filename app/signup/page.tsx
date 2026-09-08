'use client';

import { signup } from '@/app/actions/auth';
import Link from 'next/link';
import { useActionState } from 'react';
import { Landmark } from 'lucide-react';

type SignupState = { error?: string; needsConfirmation?: boolean } | null;

export default function SignupPage() {
    const [state, formAction] = useActionState<SignupState, FormData>(
        async (_prevState, formData) => {
            const result = await signup(formData);
            return result || null;
        },
        null
    );

    const needsConfirmation = state?.needsConfirmation;
    const error = state?.error;

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
                    {needsConfirmation ? (
                        <>
                            <div className="mb-2">
                                <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                                    Check your email
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                                    We&apos;ve sent a confirmation link to finish registering your seat on the
                                    council. Click it, then sign in.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="mt-6 block w-full text-center px-6 py-3 bg-gold text-ink rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all"
                            >
                                Back to Sign In
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                                    File for admission
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                                    Register a seat on the council and start casting verdicts.
                                </p>
                            </div>

                            <form action={formAction} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
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
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                        placeholder="cool_username"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        3-20 characters, letters, numbers, and _ only
                                    </p>
                                </div>

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
                                        minLength={6}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                        placeholder="••••••••"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        At least 6 characters
                                    </p>
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
                                    Create Account
                                </button>

                                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                    By creating an account you agree to the{' '}
                                    <Link href="/terms" className="text-gold hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-gold hover:underline">
                                        Privacy Policy
                                    </Link>
                                    .
                                </p>
                            </form>

                            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                Already on the council?{' '}
                                <Link href="/login" className="text-gold font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
