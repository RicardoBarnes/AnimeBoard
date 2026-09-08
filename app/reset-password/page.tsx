'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);

    // Handle the hash fragment from the email link
    useEffect(() => {
        const handlePasswordRecovery = async () => {
            const supabase = createClient();

            // First check if there's already a session (from the hash fragment)
            // Supabase automatically handles the hash fragment on page load
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (session) {
                // We have a valid session from the recovery link
                setIsLoading(false);
                return;
            }

            // If no session, show error
            setTokenError('No active session found. Please click the reset link from your email again.');
            setIsLoading(false);
        };

        // Small delay to allow Supabase to process the hash fragment
        const timer = setTimeout(() => {
            handlePasswordRecovery();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Update the user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                setError(updateError.message);
                setIsSubmitting(false);
                return;
            }

            // Success - redirect to login
            router.push('/login?reset=success');
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-4 grain-surface">
            <div className="w-full max-w-md">
                <div className="bg-background-light dark:bg-slate-900 rounded-xl border border-gold/20 shadow-2xl shadow-black/40 p-8">
                    <div className="mb-8">
                        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                            Reset password
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                            Choose a new password for your account.
                        </p>
                    </div>

                    {/* Loading state while checking session */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">Verifying reset link...</p>
                        </div>
                    )}

                    {/* Token error */}
                    {tokenError && (
                        <div className="space-y-4">
                            <div className="bg-disagree/10 border border-disagree/30 text-disagree px-4 py-3 rounded-lg text-sm">
                                {tokenError}
                            </div>
                            <Link
                                href="/forgot-password"
                                className="block text-center w-full bg-gold text-ink py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    )}

                    {/* Password reset form - only show if no loading and no token error */}
                    {!isLoading && !tokenError && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                    minLength={8}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    At least 8 characters
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                    minLength={8}
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
                                        Resetting...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

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
