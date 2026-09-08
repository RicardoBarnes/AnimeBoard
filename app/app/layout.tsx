import { getCurrentUser, createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { Landmark } from 'lucide-react';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <nav className="bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gold/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/home" className="flex items-center gap-2 text-gold">
                                <Landmark className="w-5 h-5" strokeWidth={1.75} />
                                <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                                    AnimeBoard
                                </span>
                            </Link>
                            <div className="flex gap-1">
                                <Link
                                    href="/home"
                                    className="text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                                >
                                    Docket
                                </Link>
                                <Link
                                    href="/app/images"
                                    className="text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                                >
                                    Evidence Locker
                                </Link>
                                <Link
                                    href="/app/create"
                                    className="text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                                >
                                    File a Case
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/app/admin"
                                        className="text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                                    >
                                        Registrar
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                                {user.email}
                            </span>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
