import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/auth/LogoutButton';
import AvatarFallback from '@/components/profile/AvatarFallback';
import { Home, TrendingUp, PlusCircle } from 'lucide-react';

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
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-8">
                <Link href="/home" className="flex items-center gap-2 text-primary">
                    <TrendingUp className="w-7 h-7" />
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
                        AnimeBoard
                    </h2>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/home"
                        className="text-primary text-sm font-bold leading-normal flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                    <Link
                        href="/home#trending"
                        className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Trending
                    </Link>
                    <Link
                        href="/app/create"
                        className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Create
                    </Link>
                </nav>
            </div>
            <div className="flex items-center gap-3">
                {/* User Avatar */}
                {username && (
                    <Link
                        href={`/u/${username}`}
                        className="hover:ring-primary/50 transition-all"
                    >
                        <AvatarFallback
                            username={username}
                            avatarUrl={avatarUrl}
                            size="sm"
                        />
                    </Link>
                )}
                <LogoutButton />
            </div>
        </header>
    );
}
