import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch user's profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Welcome back to AnimeBoard!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Profile Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Email
                            </label>
                            <p className="text-slate-900 dark:text-white font-medium">
                                {user?.email}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Username
                            </label>
                            <p className="text-slate-900 dark:text-white font-medium">
                                {profile?.username || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Role
                            </label>
                            <p className="text-slate-900 dark:text-white font-medium capitalize">
                                {profile?.role || 'user'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Member Since
                            </label>
                            <p className="text-slate-900 dark:text-white font-medium">
                                {profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        <Link
                            href="/app/images"
                            className="block bg-white dark:bg-slate-800 rounded-lg p-4 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-primary/50"
                        >
                            <h3 className="font-semibold text-primary">
                                Manage Images
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Upload and organize your anime images
                            </p>
                        </Link>
                        <Link
                            href="/app/create"
                            className="block bg-white dark:bg-slate-800 rounded-lg p-4 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-primary/50"
                        >
                            <h3 className="font-semibold text-primary">
                                Create Board
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Start a new debate board
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
