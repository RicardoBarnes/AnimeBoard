import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/auth/LogoutButton';
import AvatarFallback from '@/components/profile/AvatarFallback';
import { Landmark, PlusCircle } from 'lucide-react';

export default async function Navigation() {
    // Get current user and their profile
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let username = null;
    let avatarUrl = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();
        username = profile?.username;
        avatarUrl = profile?.avatar_url;
    }

    return (
        <header className="sticky top-0 z-50 border-b border-gold/20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 md:px-10 py-3.5">
                <div className="flex items-center gap-8">
                    <Link href="/home" className="flex items-center gap-2.5 text-gold">
                        <Landmark className="w-6 h-6" strokeWidth={1.75} />
                        <span className="font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                            AnimeBoard
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/home"
                            className="text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-white font-medium flex items-center gap-1.5"
                        >
                            The Docket
                        </Link>
                        <Link
                            href="/home#trending"
                            className="text-sm font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold transition-colors flex items-center gap-1.5"
                        >
                            Landmark Cases
                        </Link>
                        <Link
                            href="/app/create"
                            className="text-sm font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-gold dark:hover:text-gold transition-colors flex items-center gap-1.5"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            File a Case
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {username && (
                        <Link href={`/u/${username}`} className="ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark hover:ring-2 hover:ring-gold/50 rounded-full transition-all">
                            <AvatarFallback username={username} avatarUrl={avatarUrl} size="sm" />
                        </Link>
                    )}
                    <LogoutButton />
                </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </header>
    );
}
