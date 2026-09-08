import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, createClient } from '@/lib/supabase/server';
import { getReports } from '@/app/actions/reports';
import ReportQueue from '@/components/reports/ReportQueue';

export default async function AdminReportsPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
        redirect('/home');
    }

    const { data: reports, error } = await getReports('pending');

    return (
        <div className="space-y-8">
            <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">Registrar&apos;s Office</p>
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                        Grievance Queue
                    </h1>
                    <Link href="/app/admin" className="text-sm text-gold hover:underline">
                        &larr; Court Records
                    </Link>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    Open grievances filed by council members, awaiting review.
                </p>
            </div>

            {error ? (
                <div className="text-center py-12 text-disagree">Failed to load the queue: {error}</div>
            ) : (
                <ReportQueue initialReports={reports as any} />
            )}
        </div>
    );
}
