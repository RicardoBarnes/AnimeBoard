import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, createClient } from '@/lib/supabase/server';
import { getErrorLogs } from '@/app/actions/errors';

export default async function AdminErrorsPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
        redirect('/home');
    }

    const { data: logs, error } = await getErrorLogs();

    return (
        <div className="space-y-8">
            <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">Registrar&apos;s Office</p>
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                        Incident Log
                    </h1>
                    <Link href="/app/admin" className="text-sm text-gold hover:underline">
                        &larr; Court Records
                    </Link>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    Unhandled errors reported by visitors&apos; browsers, most recent first. Not a full
                    diagnostics tool — no stack traces, just enough to know something broke.
                </p>
            </div>

            {error ? (
                <div className="text-center py-12 text-disagree">Failed to load the log: {error}</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    No incidents reported. All quiet on the docket.
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm font-mono">
                        <thead>
                            <tr className="text-left text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="py-3 px-4 font-medium">Time</th>
                                <th className="py-3 px-4 font-medium">Path</th>
                                <th className="py-3 px-4 font-medium">Message</th>
                                <th className="py-3 px-4 font-medium">Digest</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800 align-top">
                                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-gold whitespace-nowrap">{log.path || '—'}</td>
                                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 break-words max-w-md">
                                        {log.message}
                                    </td>
                                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                        {log.digest || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
