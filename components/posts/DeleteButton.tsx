'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { deletePost } from '@/app/actions/delete';

interface DeleteButtonProps {
    postId: string;
}

export default function DeleteButton({ postId }: DeleteButtonProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setIsDeleting(true);
        setError(null);

        const result = await deletePost(postId);

        if (result?.error) {
            setError(result.error);
            setIsDeleting(false);
        } else {
            router.push('/home');
            router.refresh();
        }
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors border border-accent-red/30"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Delete this post?
                            </h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            This permanently deletes the case along with its votes and comments — it isn&apos;t
                            just hidden, it&apos;s gone. Your uploaded images stay in your library since you may
                            reuse them elsewhere. This can&apos;t be undone.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-accent-red/10 text-accent-red rounded-lg text-sm border border-accent-red/20">
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
                                disabled={isDeleting}
                                className="px-4 py-2 bg-accent-red text-white hover:bg-accent-red/90 rounded-lg transition-colors disabled:opacity-50 font-bold"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
