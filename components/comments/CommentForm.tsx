'use client';

import { useState } from 'react';
import { addComment } from '@/app/actions/comments';
import { Send } from 'lucide-react';

interface CommentFormProps {
    postId: string;
    voteSection: 'agree' | 'disagree';
    parentCommentId?: string;
    onSuccess?: () => void;
}

export default function CommentForm({ postId, voteSection, parentCommentId, onSuccess }: CommentFormProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAgree = voteSection === 'agree';
    const borderColor = isAgree ? 'border-primary/20 focus:border-primary' : 'border-accent-red/20 focus:border-accent-red';
    const buttonColor = isAgree ? 'bg-primary' : 'bg-accent-red';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await addComment(postId, content, voteSection, parentCommentId);

        setIsSubmitting(false);

        if (result.error) {
            setError(result.error);
        } else {
            setContent('');
            onSuccess?.();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="relative">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                    parentCommentId
                        ? 'Write a reply...'
                        : isAgree
                            ? 'Add your argument for...'
                            : 'Add your argument against...'
                }
                className={`w-full bg-slate-100 dark:bg-slate-800 border-2 ${borderColor} rounded-xl p-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-0 resize-none min-h-[100px] placeholder-slate-500`}
                rows={parentCommentId ? 2 : 3}
                maxLength={2000}
                disabled={isSubmitting}
            />

            {error && (
                <div className="text-sm text-accent-red mt-1">{error}</div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className={`absolute bottom-3 right-3 ${buttonColor} text-white p-2 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
    );
}
