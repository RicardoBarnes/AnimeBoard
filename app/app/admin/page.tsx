import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, createClient } from '@/lib/supabase/server';
import { getGrowthStats, type DailyCount } from '@/app/actions/admin';
import { getReports } from '@/app/actions/reports';

function formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function LedgerTable({ title, rows }: { title: string; rows: DailyCount[] }) {
    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
            {rows.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No entries in this window.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono">
                        <thead>
                            <tr className="text-left text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider">
                                <th className="py-1.5 pr-4 font-medium">Date</th>
                                <th className="py-1.5 font-medium">Entries</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...rows].reverse().map((row) => (
                                <tr key={row.day} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-400">{row.day}</td>
                                    <td className="py-1.5 text-slate-900 dark:text-white">{row.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default async function AdminPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
        redirect('/home');
    }

    const [{ data: stats, error }, { data: pendingReports }] = await Promise.all([
        getGrowthStats(30),
        getReports('pending'),
    ]);

    if (error || !stats) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Failed to load the ledger{error ? `: ${error}` : ''}.
            </div>
        );
    }

    const cards = [
        { label: 'Registered Members', value: stats.totals.users.toLocaleString() },
        { label: 'Cases Filed', value: stats.totals.posts.toLocaleString() },
        { label: 'Verdicts Cast', value: stats.totals.votes.toLocaleString() },
        { label: 'Testimony Entries', value: stats.totals.comments.toLocaleString() },
        { label: 'Evidence Stored', value: formatBytes(stats.totals.storageBytes) },
    ];

    return (
        <div className="space-y-8">
            <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">Registrar&apos;s Office</p>
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                        Court Records
                    </h1>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/app/admin/errors"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Incident Log
                        </Link>
                        <Link
                            href="/app/admin/reports"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-disagree/40 text-disagree text-sm font-semibold hover:bg-disagree/10 transition-all"
                        >
                            Grievance Queue
                            {pendingReports.length > 0 && (
                                <span className="bg-disagree text-disagree-foreground text-xs font-mono px-2 py-0.5 rounded-full">
                                    {pendingReports.length}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    Totals to date, and daily entries for the last 30 days.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
                    >
                        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {card.label}
                        </p>
                        <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LedgerTable title="Signups / day" rows={stats.signups} />
                <LedgerTable title="Cases filed / day" rows={stats.posts} />
                <LedgerTable title="Verdicts cast / day" rows={stats.votes} />
                <LedgerTable title="Testimony / day" rows={stats.comments} />
            </div>
        </div>
    );
}
