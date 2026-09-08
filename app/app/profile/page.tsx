import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import ProfileEditor from '@/components/profile/ProfileEditor';
import DeleteAccountButton from '@/components/profile/DeleteAccountButton';

export default async function ProfileEditPage() {
    // Check authentication
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-8">
                        <div className="mb-8">
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">
                                Membership File
                            </p>
                            <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">
                                {profile.username}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                                Update your standing before the council — picture and bio.
                            </p>
                        </div>

                        <ProfileEditor
                            initialBio={profile.bio || undefined}
                            initialAvatarUrl={profile.avatar_url || undefined}
                        />

                        <DeleteAccountButton username={profile.username} />
                    </div>
                </main>
            </div>
        </>
    );
}
