'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('email', email);

            const { forgotPassword } = await import('@/app/actions/auth');
            const result = await forgotPassword(formData);

            // Always show success message (don't reveal if email exists)
            setShowSuccess(true);
            setEmail('');
        } catch (err: any) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark p-4 grain-surface">
                <div className="w-full max-w-md">
                    <div className="bg-background-light dark:bg-slate-900 rounded-xl border border-gold/20 shadow-2xl shadow-black/40 p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-gold"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                                Check your email
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                If a record exists for that email, we&apos;ve sent a reset link.
                            </p>
                        </div>

                        <Link
                            href="/login"
                            className="block w-full text-center px-6 py-3 bg-gold text-ink rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-4 grain-surface">
            <div className="w-full max-w-md">
                <div className="bg-background-light dark:bg-slate-900 rounded-xl border border-gold/20 shadow-2xl shadow-black/40 p-8">
                    <div className="mb-8">
                        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                            Forgot password
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                            We&apos;ll send a reset link to restore your standing.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                                placeholder="your@email.com"
                                disabled={isSubmitting}
                            />
                        </div>

                        {error && (
                            <div className="bg-disagree/10 border border-disagree/30 text-disagree px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gold text-ink py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Remember your password?{' '}
                        <Link href="/login" className="text-gold font-semibold hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
