'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { deleteAccount } from '@/app/actions/account';

export default function DeleteAccountButton({ username }: { username: string }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setIsDeleting(true);
        setError(null);

        const result = await deleteAccount();

        if (result?.error) {
            setError(result.error);
            setIsDeleting(false);
        }
        // On success, deleteAccount() redirects — no further action needed here.
    }

    return (
        <>
            <div className="mt-10 pt-6 border-t border-disagree/20">
                <p className="font-mono text-xs uppercase tracking-wider text-disagree mb-2">Danger Zone</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Permanently delete your account — your profile, cases, votes, comments, and uploaded
                    images are all removed. This can&apos;t be undone.
                </p>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-disagree hover:bg-disagree/10 rounded-lg transition-colors border border-disagree/30"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                </button>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-disagree/30 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                                Delete your account?
                            </h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                            This permanently deletes your profile, every case you&apos;ve filed, your votes,
                            comments, and uploaded images. There is no recovery.
                        </p>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Type <span className="text-disagree">{username}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full mb-4 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-disagree focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder={username}
                        />

                        {error && (
                            <div className="mb-4 p-3 bg-disagree/10 text-disagree rounded-lg text-sm border border-disagree/20">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || confirmText !== username}
                                className="px-4 py-2 bg-disagree text-disagree-foreground hover:bg-disagree/90 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
